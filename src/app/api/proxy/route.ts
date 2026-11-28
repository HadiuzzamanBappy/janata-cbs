import { type NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";
import { verifyUserRecordAccess, verifyZeroAuthAccess } from "@/lib/cbs-access";
import { logger } from "@/lib/core-logger";
import { normalizeAuditTimes } from "@/lib/core-utils";
import { decodeProtobufValue, extractInquiryTotal, parseInquiryRecords } from "@/lib/data-parsers";
import {
  type ApiResponse,
  type CbsWirePayload,
  cbsWirePayloadSchema,
  formConfigRecordSchema,
  formConfigSaveSchema,
  type GrpcEnvelope,
  INQUIRY_MAX_ROWS,
  type InquiryResult,
  inquiryConfigRecordSchema,
  inquiryConfigSaveSchema,
  isApiSuccess,
  modelConfigRecordSchema,
  modelConfigSaveSchema,
} from "@/lib/data-schemas";
import { dispatch } from "@/lib/infra-grpc";
import {
  autoInvalidateOnMutation,
  getOrSet,
  getSession,
  resolveCacheDescriptor,
} from "@/lib/infra-redis";
import { CbsControlTable, CbsRequestType, isCbsMutationRequest } from "@/types";
import { buildGrpcEnvelope } from "../_lib/envelope";
import { resolveInquiryEnvelope } from "../_lib/inquiry";
import {
  actsOnStoredRecord,
  type StoredRecordLoader,
  verifyFourEyes,
  verifySavedModel,
  withoutClientAudit,
} from "../_lib/record-guards";
import { apiError, apiFail } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxyLogger = logger.withContext("PROXY_API");

/**
 * Config saves whose `data` is checked here too, so a direct API call can't skip the screen's rules.
 * A dedicated verb (SFC) is keyed by request type; a generic PUT or HLD by `<VERB>:<CONTROL>`.
 * Hold parks work in progress, so it gets the lenient read schema: no save rules, but the draft
 * must be readable and keys the schema doesn't know are stripped.
 */
const SAVE_DATA_SCHEMAS: Readonly<Partial<Record<string, ZodType>>> = {
  [CbsRequestType.SFC]: formConfigSaveSchema,
  [`${CbsRequestType.PUT}:${CbsControlTable.MODEL_CONFIG}`]: modelConfigSaveSchema,
  [`${CbsRequestType.PUT}:${CbsControlTable.INQUIRY_CONFIG}`]: inquiryConfigSaveSchema,
  [`${CbsRequestType.HLD}:${CbsControlTable.FORM_CONFIG}`]: formConfigRecordSchema,
  [`${CbsRequestType.HLD}:${CbsControlTable.MODEL_CONFIG}`]: modelConfigRecordSchema,
  [`${CbsRequestType.HLD}:${CbsControlTable.INQUIRY_CONFIG}`]: inquiryConfigRecordSchema,
};

/** Authorize, Delete and Reverse carry no definition to check (`actsOnStoredRecord`). */
function saveDataSchemaFor(body: CbsWirePayload): ZodType | undefined {
  if (actsOnStoredRecord(body.recordFunction)) return;
  const control = (body.controlName ?? "").trim().toUpperCase();
  return SAVE_DATA_SCHEMAS[body.requestType] ?? SAVE_DATA_SCHEMAS[`${body.requestType}:${control}`];
}

/**
 * Single decode point for core payloads: INQ results become an `InquiryResult` (at most
 * `INQUIRY_MAX_ROWS` rows plus the matched total), everything else is protobuf-decoded.
 * Cached entries hold the decoded form, so cache hits skip this step.
 */
function decodeResponse(requestType: string, res: ApiResponse): ApiResponse {
  if (!isApiSuccess(res)) return res;
  // Dates are ISO inside the system: audit timestamps are converted once, here
  const decoded = res.data ? normalizeAuditTimes(decodeProtobufValue(res.data)) : undefined;
  if (requestType !== CbsRequestType.INQ)
    return decoded === undefined ? res : { ...res, data: decoded };
  const rows = parseInquiryRecords(decoded);
  const total = extractInquiryTotal(decoded, rows.length);
  const result: InquiryResult = { rows: rows.slice(0, INQUIRY_MAX_ROWS), total };
  return { ...res, data: result };
}

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session?.currUser) {
      return apiFail("User session expired or unauthorized", 401);
    }
    if (session.currUser.initLogin) {
      return apiFail("Password change required before accessing CBS core.", 403);
    }
    if (!session.currUser.branchCode) {
      return apiFail("No active branch assigned to user session.", 403);
    }

    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return apiFail("Invalid JSON request body", 400);
    }
    const parsed = cbsWirePayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return apiFail(
        parsed.error.issues[0]?.message || "Invalid proxy request payload",
        400,
        parsed.error.issues.map((i) => i.message),
      );
    }

    const { token, currUser } = session;
    const body = parsed.data;

    // 1. Domain Access Verification Gate (RIDASHL, plus 'A' for a zero-auth mutation)
    const accessViolation =
      verifyUserRecordAccess(currUser, body.requestType, body.recordFunction) ??
      verifyZeroAuthAccess(currUser, body.requestType, body.authLevel);
    if (accessViolation) {
      proxyLogger.warn(`Access Denied: ${accessViolation.message}`, {
        controlName: body.controlName,
        recordId: body.recordId,
        userId: currUser.userId,
      });
      return apiFail(accessViolation.message, 403, [
        `User ${currUser.userId} lacks capability '${accessViolation.funcCode}'`,
      ]);
    }

    // 2. Config save rules (the same schema the designer screen checks before sending; a hold
    // gets the lenient read schema)
    const dataCheck = saveDataSchemaFor(body)?.safeParse(body.data);
    if (dataCheck && !dataCheck.success) {
      return apiFail(
        dataCheck.error.issues[0]?.message || "Invalid configuration record",
        400,
        dataCheck.error.issues.map((i) => i.message),
      );
    }

    // 3. Canonical GrpcEnvelope Assembly (branch and user come from the session). A checked
    // config save forwards the parsed record, so keys the schema strips never reach the core;
    // Authorize, Delete and Reverse forward no data at all, so a crafted call can't slip an
    // unchecked record through them. A mutation never forwards the audit fields the core
    // stamps (maker, authorizer, status), only the version it edited.
    const checkedData = dataCheck ? (dataCheck.data as Record<string, unknown>) : body.data;
    const requested = buildGrpcEnvelope(session, {
      ...body,
      data: actsOnStoredRecord(body.recordFunction)
        ? undefined
        : isCbsMutationRequest(body.requestType)
          ? withoutClientAudit(checkedData)
          : checkedData,
    });

    // 4. Dispatch with Read-Through Redis Caching (responses are decoded exactly once)
    try {
      const dispatchFresh: StoredRecordLoader = async (target) =>
        decodeResponse(target.requestType, await dispatch(target, token));
      // One dispatch per miss: concurrent callers share its result, and failures are never cached.
      const dispatchCached = (target: GrpcEnvelope): Promise<ApiResponse> => {
        const cacheDesc = resolveCacheDescriptor(target);
        return cacheDesc
          ? getOrSet(cacheDesc.key, () => dispatchFresh(target), cacheDesc.ttl, isApiSuccess)
          : dispatchFresh(target);
      };

      // Rules checked against the stored record, read fresh: Four-Eyes on every authorize, and
      // the saved table and columns on a MODEL.CONFIG save
      const refusal =
        (await verifyFourEyes(requested, dispatchFresh)) ??
        (await verifySavedModel(requested, dispatchFresh));
      if (refusal) {
        proxyLogger.warn(`Request refused: ${refusal.message}`, {
          requestType: requested.requestType,
          controlName: requested.controlName,
          recordId: requested.recordId,
          userId: currUser.userId,
        });
        return apiFail(refusal.message, refusal.status, refusal.details);
      }

      // An inquiry runs only as its saved definition says (controller, fixed selection, branch)
      let envelope = requested;
      if (requested.requestType === CbsRequestType.INQ) {
        const resolved = await resolveInquiryEnvelope(requested, dispatchCached);
        if (!resolved.ok) {
          proxyLogger.warn(`Inquiry refused: ${resolved.message}`, {
            recordId: requested.recordId,
            userId: currUser.userId,
          });
          return apiFail(resolved.message, resolved.status);
        }
        envelope = resolved.envelope;
      }

      const response = await dispatchCached(envelope);

      if (isApiSuccess(response)) {
        await autoInvalidateOnMutation(envelope);
        return NextResponse.json(response, { status: 200 });
      }

      // Handle Downstream Core Failures
      const fallbackMessage = `CBS host returned ${response.status} (${response.statusCode}) for ${envelope.requestType} on ${envelope.controlName || "default"}`;
      proxyLogger.warn(`Proxy downstream returned non-success (${response.statusCode})`, {
        controlName: envelope.controlName,
        requestType: envelope.requestType,
        message: response.message || fallbackMessage,
      });

      return NextResponse.json(
        {
          ...response,
          message: response.message || fallbackMessage,
          errors: response.errors?.length ? response.errors : [fallbackMessage],
        },
        { status: response.statusCode || 400 },
      );
    } catch (dispatchErr: unknown) {
      proxyLogger.error("CBS Host communication failed", dispatchErr);
      return apiError(dispatchErr, "CBS Host communication failed", 502);
    }
  } catch (err: unknown) {
    proxyLogger.error("Internal Proxy Dispatch Error", err);
    return apiError(err, "Internal Proxy Dispatch Error");
  }
}

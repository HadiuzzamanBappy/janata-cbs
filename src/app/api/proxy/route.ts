import { type NextRequest, NextResponse } from "next/server";
import type { ZodType } from "zod";
import { verifyUserRecordAccess, verifyZeroAuthAccess } from "@/lib/cbs-access";
import { logger } from "@/lib/core-logger";
import { normalizeAuditTimes } from "@/lib/core-utils";
import { decodeProtobufValue, parseInquiryRecords } from "@/lib/data-parsers";
import {
  type ApiResponse,
  type CbsWirePayload,
  cbsWirePayloadSchema,
  formConfigSaveSchema,
  type GrpcEnvelope,
  INQUIRY_MAX_ROWS,
  type InquiryResult,
  inquiryConfigSaveSchema,
  isApiSuccess,
  modelConfigSaveSchema,
} from "@/lib/data-schemas";
import { dispatch } from "@/lib/infra-grpc";
import {
  autoInvalidateOnMutation,
  getOrSet,
  getSession,
  resolveCacheDescriptor,
} from "@/lib/infra-redis";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";
import { buildGrpcEnvelope } from "../_lib/envelope";
import { resolveInquiryEnvelope } from "../_lib/inquiry";
import { apiError, apiFail } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxyLogger = logger.withContext("PROXY_API");

/**
 * Config saves whose `data` is checked here too, so a direct API call can't skip the screen's rules.
 * Dedicated verbs (SMC, SFC) are keyed by request type; a generic PUT by `PUT:<CONTROL>`.
 */
const SAVE_DATA_SCHEMAS: Readonly<Partial<Record<string, ZodType>>> = {
  [CbsRequestType.SMC]: modelConfigSaveSchema,
  [CbsRequestType.SFC]: formConfigSaveSchema,
  [`${CbsRequestType.PUT}:${CbsControlTable.INQUIRY_CONFIG}`]: inquiryConfigSaveSchema,
};

/** Authorize, Delete and Reverse act on the stored record and carry no definition to check. */
const NO_DEFINITION_FUNCTIONS: ReadonlySet<string> = new Set([
  CbsRecordFunction.AUTHORIZE,
  CbsRecordFunction.DELETE,
  CbsRecordFunction.REVERSE,
]);

function saveDataSchemaFor(body: CbsWirePayload): ZodType | undefined {
  if (NO_DEFINITION_FUNCTIONS.has((body.recordFunction ?? "").trim().toUpperCase())) return;
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
  const result: InquiryResult = { rows: rows.slice(0, INQUIRY_MAX_ROWS), total: rows.length };
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

    const rawBody = await req.json();
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

    // 2. Config save rules (the same schema the designer screen checks before sending)
    const dataCheck = saveDataSchemaFor(body)?.safeParse(body.data);
    if (dataCheck && !dataCheck.success) {
      return apiFail(
        dataCheck.error.issues[0]?.message || "Invalid configuration record",
        400,
        dataCheck.error.issues.map((i) => i.message),
      );
    }

    // 3. Canonical GrpcEnvelope Assembly (branch and user come from the session)
    const requested = buildGrpcEnvelope(session, body);

    // 4. Dispatch with Read-Through Redis Caching (responses are decoded exactly once)
    try {
      // One dispatch per miss: concurrent callers share its result, and failures are never cached.
      const dispatchCached = (target: GrpcEnvelope): Promise<ApiResponse> => {
        const cacheDesc = resolveCacheDescriptor(target);
        const dispatchDecoded = async () =>
          decodeResponse(target.requestType, await dispatch(target, token));
        return cacheDesc
          ? getOrSet(cacheDesc.key, dispatchDecoded, cacheDesc.ttl, isApiSuccess)
          : dispatchDecoded();
      };

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

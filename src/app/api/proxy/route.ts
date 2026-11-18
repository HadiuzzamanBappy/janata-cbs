import { type NextRequest, NextResponse } from "next/server";
import { verifyUserRecordAccess } from "@/lib/cbs-access";
import { logger } from "@/lib/core-logger";
import { decodeProtobufValue, parseInquiryRecords } from "@/lib/data-parsers";
import {
  type ApiResponse,
  cbsWirePayloadSchema,
  type GrpcEnvelope,
  INQUIRY_BRANCH_FIELD,
  isApiSuccess,
} from "@/lib/data-schemas";
import { dispatch } from "@/lib/infra-grpc";
import {
  autoInvalidateOnMutation,
  getOrSet,
  getSession,
  resolveCacheDescriptor,
} from "@/lib/infra-redis";
import { CbsRequestType } from "@/types";
import { buildGrpcEnvelope } from "../_lib/envelope";
import { apiError, apiFail } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxyLogger = logger.withContext("PROXY_API");

/**
 * Single decode point for core payloads: INQ results become InquiryRow[], everything else
 * is protobuf-decoded. Cached entries hold the decoded form, so cache hits skip this step.
 */
function decodeResponse(requestType: string, res: ApiResponse): ApiResponse {
  if (!isApiSuccess(res) || !res.data) return res;
  const data =
    requestType === CbsRequestType.INQ
      ? parseInquiryRecords(decodeProtobufValue(res.data))
      : decodeProtobufValue(res.data);
  return { ...res, data };
}

/**
 * Branch-wise inquiries filter on `INQUIRY_BRANCH_FIELD`. The browser builds that filter, so it's
 * pinned to the envelope's (session) branch here: a tampered filter can't read another branch.
 */
function pinInquiryBranch(envelope: GrpcEnvelope): GrpcEnvelope {
  const queryString = envelope.data.queryString;
  if (envelope.requestType !== CbsRequestType.INQ || !Array.isArray(queryString)) return envelope;
  const pinned = queryString.map((c) =>
    (c as { selectFieldName?: unknown })?.selectFieldName === INQUIRY_BRANCH_FIELD
      ? { ...(c as object), selectFieldValue: envelope.branchCode }
      : c,
  );
  return { ...envelope, data: { ...envelope.data, queryString: pinned } };
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

    // 1. Domain Access Verification Gate (Maker-Checker & RIDASHL)
    const accessViolation = verifyUserRecordAccess(currUser, body.recordFunction);
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

    // 2. Canonical GrpcEnvelope Assembly (branch and user come from the session)
    const envelope = pinInquiryBranch(buildGrpcEnvelope(session, body));

    // 3. Dispatch with Read-Through Redis Caching (responses are decoded exactly once)
    try {
      const cacheDesc = resolveCacheDescriptor(envelope);
      const dispatchDecoded = async () =>
        decodeResponse(envelope.requestType, await dispatch(envelope, token));

      // One dispatch per miss: concurrent callers share its result, and failures are never cached.
      const response = cacheDesc
        ? await getOrSet(cacheDesc.key, dispatchDecoded, cacheDesc.ttl, isApiSuccess)
        : await dispatchDecoded();

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

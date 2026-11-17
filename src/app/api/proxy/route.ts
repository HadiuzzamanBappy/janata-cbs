import { type NextRequest, NextResponse } from "next/server";
import { verifyUserRecordAccess } from "@/lib/cbs-access";
import { serverConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { decodeProtobufValue, parseInquiryRecords } from "@/lib/data-parsers";
import {
  type ApiResponse,
  CBS_API_STATUS,
  cbsWirePayloadSchema,
  type GrpcEnvelope,
} from "@/lib/data-schemas";
import { dispatch } from "@/lib/infra-grpc";
import {
  autoInvalidateOnMutation,
  getOrSet,
  getSession,
  resolveCacheDescriptor,
} from "@/lib/infra-redis";
import { CbsRequestType } from "@/types";
import { apiError, apiFail } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const proxyLogger = logger.withContext("PROXY_API");

/**
 * Single decode point for core payloads: INQ results become InquiryRow[], everything else
 * is protobuf-decoded. Cached entries hold the decoded form, so cache hits skip this step.
 */
function decodeResponse(requestType: string, res: ApiResponse): ApiResponse {
  if (res.status !== CBS_API_STATUS.SUCCESS || !res.data) return res;
  const data =
    requestType === CbsRequestType.INQ
      ? parseInquiryRecords(decodeProtobufValue(res.data))
      : decodeProtobufValue(res.data);
  return { ...res, data };
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

    const { token, userId, currUser } = session;
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

    // 2. Canonical GrpcEnvelope Assembly
    const envelope: GrpcEnvelope = {
      servicePath: body.servicePath ?? "default",
      requestType: body.requestType,
      controlName: body.controlName ?? "",
      branchCode: currUser.branchCode || serverConfig.centralBranch,
      recordFunction: body.recordFunction ?? "",
      recordId: body.recordId ?? "",
      authLevel: body.authLevel ?? 1,
      idempotencyKey: body.idempotencyKey,
      userId,
      clientId: serverConfig.grpc.clientId,
      data: body.data ?? {},
    };

    // 3. Dispatch with Read-Through Redis Caching (responses are decoded exactly once)
    try {
      const cacheDesc = resolveCacheDescriptor(envelope);
      const dispatchDecoded = async () =>
        decodeResponse(envelope.requestType, await dispatch(envelope, token));
      let failedResponse: ApiResponse | null = null;

      const response = cacheDesc
        ? ((await getOrSet(
            cacheDesc.key,
            async () => {
              const res = await dispatchDecoded();
              if (res.status !== CBS_API_STATUS.SUCCESS) {
                failedResponse = res;
                return null;
              }
              return res;
            },
            cacheDesc.ttl,
          )) ??
          failedResponse ??
          (await dispatchDecoded()))
        : await dispatchDecoded();

      if (response.status === CBS_API_STATUS.SUCCESS) {
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

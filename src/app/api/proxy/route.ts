import { type NextRequest, NextResponse } from "next/server";
import { verifyUserRecordAccess } from "@/lib/cbs-access";
import { serverConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { decodeProtobufValue, parseInquiryRecords } from "@/lib/data-parsers";
import { type ApiResponse, cbsWirePayloadSchema, type GrpcEnvelope } from "@/lib/data-schemas";
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

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session?.currUser) {
      return apiFail("User session expired or unauthorized", 401);
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

    // 3. Dispatch with Read-Through Redis Caching
    try {
      const cacheDesc = resolveCacheDescriptor(envelope);

      const response = cacheDesc
        ? (await getOrSet(
            cacheDesc.key,
            async () => {
              const res = await dispatch(envelope, token);
              if (res.status !== "SUCCESS") return null;
              return {
                ...res,
                data: res.data ? decodeProtobufValue(res.data) : res.data,
              };
            },
            cacheDesc.ttl,
          )) || (await dispatch(envelope, token))
        : await dispatch(envelope, token);

      if (response.status === "SUCCESS") {
        await autoInvalidateOnMutation(envelope);

        const data =
          body.requestType === CbsRequestType.INQ && response.data
            ? parseInquiryRecords(response)
            : response.data
              ? decodeProtobufValue(response.data)
              : response.data;

        return NextResponse.json({ ...response, success: true, data }, { status: 200 });
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
          success: false,
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

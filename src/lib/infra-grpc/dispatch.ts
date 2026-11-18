import "server-only";

import { mockDispatch } from "@mock/core";
import { getServiceUrl, serverConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import {
  type ApiResponse,
  type ApiStatus,
  apiStatusSchema,
  CBS_API_STATUS,
  type GrpcEnvelope,
} from "@/lib/data-schemas";
import { financialProcess, grpcStatusToHttp, isStaticMode, nonFinancialProcess } from "./client";
import type { GrpcRequest } from "./generated/service";

const grpcLogger = logger.withContext("GRPC");

const FINANCIAL_REQUEST_TYPES = new Set(serverConfig.grpc.financialTransactionTypes);

/**
 * Returns true if the requestType matches a configured financial transaction code from env.
 * @internal Exported only for scripts/verify.
 */
export function isFinancialRequest(requestType: string): boolean {
  return FINANCIAL_REQUEST_TYPES.has(requestType.trim().toUpperCase());
}

/**
 * Validates the core's status string at the trust boundary. An unrecognised value is
 * surfaced as ERROR (never as success) and logged so it can be added to CBS_API_STATUS.
 */
function resolveCoreStatus(rawStatus: string): ApiStatus {
  const parsed = apiStatusSchema.safeParse(rawStatus);
  if (parsed.success) return parsed.data;
  grpcLogger.error(`Core returned unrecognised status "${rawStatus}"`);
  return CBS_API_STATUS.ERROR;
}

/**
 * Dispatches a CBS wire envelope over gRPC (FinancialProcess or NonFinancialProcess),
 * or routes to mockDispatch when DATA_SOURCE is "static".
 */
export async function dispatch(envelope: GrpcEnvelope, token: string): Promise<ApiResponse> {
  if (isStaticMode()) {
    return mockDispatch(envelope);
  }

  try {
    const serviceKey = envelope.servicePath?.split("/")[0] || "default";
    const address = getServiceUrl(serviceKey);
    const isFinancial = isFinancialRequest(envelope.requestType);

    const req: GrpcRequest = {
      idempotencyKey: envelope.idempotencyKey ?? "",
      clientId: envelope.clientId,
      requestType: envelope.requestType,
      controlName: envelope.controlName,
      recordFunction: envelope.recordFunction,
      recordId: envelope.recordId,
      branchCode: envelope.branchCode,
      authLevel: envelope.authLevel,
      userId: envelope.userId,
      data: envelope.data,
    };

    grpcLogger.debug(
      `→ ${isFinancial ? "FIN" : "NONFIN"} ${req.requestType} ${req.controlName}`,
      req,
    );

    const res = isFinancial
      ? await financialProcess(address, req, token)
      : await nonFinancialProcess(address, req, token);

    const status = resolveCoreStatus(res.status);

    // Surface backend-side failures with the exact request that triggered them,
    // since the host often returns ERROR with an empty message on unhandled exceptions.
    if (status !== CBS_API_STATUS.SUCCESS) {
      grpcLogger.warn(
        `← ${res.status} ${res.statusCode} for ${req.requestType} ${req.controlName}`,
        {
          request: req,
          response: res,
        },
      );
    }

    return {
      status,
      statusCode: res.statusCode,
      message: res.message,
      idempotencyKey: res.idempotencyKey,
      errors: res.errors,
      timestamp: res.timestamp,
      data: res.data ?? null,
    };
  } catch (error: unknown) {
    const { status, message } = grpcStatusToHttp(error);
    return {
      status: CBS_API_STATUS.FAIL,
      statusCode: status,
      message,
      idempotencyKey: envelope.idempotencyKey ?? "",
      errors: [message],
      timestamp: new Date().toISOString(),
      data: null,
    };
  }
}

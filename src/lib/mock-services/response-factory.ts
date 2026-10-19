import "server-only";

import type { GrpcResponse } from "@/lib/infra-grpc/generated/service";
import type { MockProxyResult } from "./types";

/**
 * Creates standard 200 SUCCESS response payload.
 */
export function successResult(data: unknown, message = "Success"): MockProxyResult {
  return {
    status: "SUCCESS",
    statusCode: 200,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates standard 404 RECORD_NOT_FOUND response payload.
 */
export function notFoundResult(message = "Record not found"): MockProxyResult {
  return {
    status: "RECORD_NOT_FOUND",
    statusCode: 404,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates standard HTTP error response payload.
 */
export function errorResult(statusCode: number, message: string): MockProxyResult {
  return {
    status: "ERROR",
    statusCode,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Translates MockProxyResult to canonical GrpcResponse.
 */
export function toGrpcResponse(result: MockProxyResult, idempotencyKey = ""): GrpcResponse {
  return {
    status: result.status,
    statusCode: result.statusCode,
    idempotencyKey,
    message: result.message,
    errors: result.statusCode >= 400 ? [result.message] : [],
    timestamp: result.timestamp,
    data: (result.data as GrpcResponse["data"]) ?? undefined,
  };
}

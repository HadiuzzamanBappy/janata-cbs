import { type ApiResponse, CBS_API_STATUS } from "@/lib/data-schemas";
import type { GrpcResponse } from "@/lib/infra-grpc/generated/service";

/**
 * Creates standard 200 SUCCESS response payload.
 */
export function successResult<T = unknown>(data: T, message = "Success"): ApiResponse<T> {
  return {
    status: CBS_API_STATUS.SUCCESS,
    statusCode: 200,
    message,
    errors: [],
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates standard 404 RECORD_NOT_FOUND response payload.
 */
export function notFoundResult(message = "Record not found"): ApiResponse<null> {
  return {
    status: CBS_API_STATUS.RECORD_NOT_FOUND,
    statusCode: 404,
    message,
    errors: [message],
    data: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Creates standard HTTP error response payload.
 */
export function errorResult(statusCode: number, message: string): ApiResponse<null> {
  return {
    status: CBS_API_STATUS.ERROR,
    statusCode,
    message,
    errors: [message],
    data: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Translates ApiResponse to canonical GrpcResponse.
 */
export function toGrpcResponse(result: ApiResponse, idempotencyKey = ""): GrpcResponse {
  return {
    status: String(result.status),
    statusCode: result.statusCode,
    idempotencyKey: idempotencyKey || result.idempotencyKey || "",
    message: result.message || "",
    errors:
      result.errors && result.errors.length > 0
        ? [...result.errors]
        : result.statusCode >= 400 && result.message
          ? [result.message]
          : [],
    timestamp: result.timestamp,
    data: (result.data as GrpcResponse["data"]) ?? undefined,
  };
}

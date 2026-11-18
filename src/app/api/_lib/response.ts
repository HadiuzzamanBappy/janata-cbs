import { type NextRequest, NextResponse } from "next/server";
import { type ApiResponse, CBS_API_STATUS } from "@/lib/data-schemas";

function createApiResponse<T>(
  body: ApiResponse<T>,
  statusCode: number,
  headers?: Record<string, string>,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(body, { status: statusCode, headers });
}

export function apiSuccess<T>(
  data?: T,
  message?: string,
  statusCode = 200,
): NextResponse<ApiResponse<T>> {
  return createApiResponse(
    {
      status: CBS_API_STATUS.SUCCESS,
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    statusCode,
  );
}

/** 429 for a rate-limited action, with `Retry-After` so clients know when to retry. */
export function apiTooManyRequests(what: string, resetSec: number): NextResponse<ApiResponse> {
  return apiFail(`Too many ${what}. Try again in ${resetSec}s.`, 429, undefined, {
    "Retry-After": String(resetSec),
  });
}

export function apiFail(
  message: string,
  statusCode = 400,
  errors?: readonly string[],
  headers?: Record<string, string>,
): NextResponse<ApiResponse> {
  return createApiResponse(
    {
      status: CBS_API_STATUS.FAIL,
      statusCode,
      message,
      errors: errors ?? [message],
      timestamp: new Date().toISOString(),
    },
    statusCode,
    headers,
  );
}

export function apiError(
  err: unknown,
  fallbackMessage = "Internal Server Error",
  statusCode = 500,
): NextResponse<ApiResponse> {
  const message = err instanceof Error ? err.message : fallbackMessage;
  return createApiResponse(
    {
      status: CBS_API_STATUS.ERROR,
      statusCode,
      message,
      errors: [message],
      timestamp: new Date().toISOString(),
    },
    statusCode,
  );
}

export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

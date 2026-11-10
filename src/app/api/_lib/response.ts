import { type NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/data-schemas";

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
      success: true,
      status: "SUCCESS",
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    statusCode,
  );
}

export function apiFail(
  message: string,
  statusCode = 400,
  errors?: readonly string[],
  headers?: Record<string, string>,
): NextResponse<ApiResponse> {
  return createApiResponse(
    {
      success: false,
      status: "FAIL",
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
      success: false,
      status: "ERROR",
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

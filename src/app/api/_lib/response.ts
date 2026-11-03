import { type NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/lib/data-schemas";

/**
 * Standard API JSON response helper for Janata CBS API Routes.
 * Enforces unified timestamping, status codes, and type safety.
 */
export function apiSuccess<T>(
  data?: T,
  message?: string,
  statusCode = 200,
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      status: "SUCCESS",
      statusCode,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}

export function apiFail(
  message: string,
  statusCode = 400,
  errors?: readonly string[],
  headers?: Record<string, string>,
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      status: "FAIL",
      statusCode,
      message,
      errors: errors ?? [message],
      timestamp: new Date().toISOString(),
    },
    { status: statusCode, headers },
  );
}

export function apiError(
  err: unknown,
  fallbackMessage = "Internal Server Error",
  statusCode = 500,
): NextResponse<ApiResponse> {
  const message = err instanceof Error ? err.message : fallbackMessage;
  return NextResponse.json(
    {
      success: false,
      status: "ERROR",
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode },
  );
}

/**
 * Extracts normalized client IP from request headers.
 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

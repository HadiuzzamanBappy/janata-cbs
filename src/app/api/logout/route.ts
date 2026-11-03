import type { NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { logoutUser } from "@/lib/infra-grpc";
import { apiError, apiSuccess } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const logoutLogger = logger.withContext("LOGOUT_API");

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    await logoutUser();
    logoutLogger.info("User logged out successfully");
    return apiSuccess(undefined, "Logged out successfully");
  } catch (err: unknown) {
    logoutLogger.error("POST /api/logout failed", err);
    return apiError(err, "Failed to logout");
  }
}

import { NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import { logoutUser } from "@/lib/infra-services";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const logoutLogger = logger.withContext("LOGOUT_API");

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    await logoutUser();
    logoutLogger.info("User logged out successfully");
    return NextResponse.json(
      {
        success: true,
        status: "SUCCESS",
        statusCode: 200,
        message: "Logged out successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    logoutLogger.error("POST /api/logout failed", err);
    const message = err instanceof Error ? err.message : "Failed to logout";
    return NextResponse.json(
      {
        success: false,
        status: "ERROR",
        statusCode: 500,
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

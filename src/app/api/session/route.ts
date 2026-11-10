import type { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { updateBranchSessionSchema } from "@/lib/data-schemas";
import { getFromSession, getSession, updateBranchCodeAndName } from "@/lib/infra-redis";
import { apiError, apiFail, apiSuccess } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionLogger = logger.withContext("SESSION_API");

/**
 * Hydrates active user teller profile from Redis session.
 */
export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const currUser = await getFromSession("currUser");

    if (!currUser) {
      return apiFail("No active session", 401);
    }

    return apiSuccess(currUser);
  } catch (error: unknown) {
    sessionLogger.error("GET /api/session failed", error);
    return apiError(error, "Internal server error retrieving session");
  }
}

/**
 * Updates active user's branch roaming context in Redis session and cookies.
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return apiFail("Unauthorized", 401);
    }

    const body = await req.json();
    const parsed = updateBranchSessionSchema.safeParse(body);
    if (!parsed.success) {
      return apiFail(
        parsed.error.issues[0]?.message || "Invalid branch update parameters",
        400,
        parsed.error.issues.map((i) => i.message),
      );
    }

    const updatedUser = await updateBranchCodeAndName(
      parsed.data.branchCode,
      parsed.data.branchName,
    );
    if (!updatedUser) {
      return apiFail("Failed to update session branch", 500);
    }
    return apiSuccess(updatedUser, "Branch context updated successfully");
  } catch (error: unknown) {
    sessionLogger.error("POST /api/session failed", error);
    return apiError(error, "Internal server error updating session");
  }
}

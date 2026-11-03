import type { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { updateBranchSessionSchema } from "@/lib/data-schemas";
import {
  destroySession,
  getFromSession,
  getSession,
  updateBranchCodeAndName,
} from "@/lib/infra-redis";
import { apiError, apiFail, apiSuccess } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionLogger = logger.withContext("SESSION_API");

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

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return apiFail("Unauthorized", 401);
    }

    const body = await req.json();
    const parsed = updateBranchSessionSchema.safeParse(body);

    if (parsed.success) {
      const updatedUser = await updateBranchCodeAndName(
        parsed.data.branchCode,
        parsed.data.branchName,
      );
      if (!updatedUser) {
        return apiFail("Failed to update session branch", 500);
      }

      const res = apiSuccess(updatedUser);

      // Keep cookie aligned with updated branch
      res.cookies.set(appConfig.auth.branchCookie, parsed.data.branchCode, {
        httpOnly: false,
        secure: !appConfig.isDev && appConfig.useHttps,
        sameSite: "lax",
        path: "/",
        maxAge: appConfig.auth.sessionMaxAgeSeconds,
      });

      return res;
    }

    return apiSuccess(session.currUser);
  } catch (error: unknown) {
    sessionLogger.error("POST /api/session failed", error);
    return apiError(error, "Internal server error updating session");
  }
}

export async function DELETE(): Promise<NextResponse<ApiResponse>> {
  sessionLogger.info("Destroying session via DELETE /api/session");
  await destroySession();
  return apiSuccess(undefined, "Session destroyed");
}

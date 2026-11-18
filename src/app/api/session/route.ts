import type { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import { decodeProtobufValue, parseBranchDirectory } from "@/lib/data-parsers";
import { type ApiResponse, isApiSuccess, updateBranchSessionSchema } from "@/lib/data-schemas";
import { dispatch } from "@/lib/infra-grpc";
import {
  getFromSession,
  getSession,
  type SessionData,
  updateBranchCodeAndName,
} from "@/lib/infra-redis";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";
import { buildGrpcEnvelope } from "../_lib/envelope";
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
 * Looks a branch up in the core's branch directory. Returns the core's branch name, or `null`
 * when the code doesn't exist, so the session never holds a branch the core doesn't know.
 */
async function resolveBranchName(session: SessionData, branchCode: string): Promise<string | null> {
  const envelope = buildGrpcEnvelope(session, {
    requestType: CbsRequestType.GRL,
    controlName: CbsControlTable.BRANCH,
    recordFunction: CbsRecordFunction.LIST,
  });
  const res = await dispatch(envelope, session.token);
  if (!isApiSuccess(res) || !res.data) return null;

  const match = parseBranchDirectory(decodeProtobufValue(res.data)).find(
    (b) => b.code === branchCode,
  );
  return match?.name ?? null;
}

/**
 * Updates the active user's branch in the server session.
 * Every proxied request takes its branch from this session, so the code is checked against the
 * core and the name comes from the core, never from the browser.
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return apiFail("Unauthorized", 401);
    }
    if (session.currUser.initLogin) {
      return apiFail("Password change required before switching branch.", 403);
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

    const branchCode = parsed.data.branchCode;
    const branchName = await resolveBranchName(session, branchCode);
    if (!branchName) {
      sessionLogger.warn(
        `Branch switch rejected for ${session.userId}: unknown branch ${branchCode}`,
      );
      return apiFail(`Unknown branch: ${branchCode}`, 400);
    }

    const updatedUser = await updateBranchCodeAndName(branchCode, branchName);
    if (!updatedUser) {
      return apiFail("Failed to update session branch", 500);
    }
    sessionLogger.info(`User ${session.userId} switched branch to ${branchCode}`);
    return apiSuccess(updatedUser, "Branch context updated successfully");
  } catch (error: unknown) {
    sessionLogger.error("POST /api/session failed", error);
    return apiError(error, "Internal server error updating session");
  }
}

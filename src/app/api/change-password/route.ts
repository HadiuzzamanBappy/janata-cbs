import type { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import { generateIdempotencyKey } from "@/lib/core-utils";
import { type ApiResponse, changePasswordSchema, isApiSuccess } from "@/lib/data-schemas";
import { dispatch } from "@/lib/infra-grpc";
import {
  clearInitialLoginRequirement,
  clearRateLimit,
  getSession,
  rateLimit,
} from "@/lib/infra-redis";
import { CbsRequestType } from "@/types";
import { buildGrpcEnvelope } from "../_lib/envelope";
import { apiError, apiFail, apiSuccess, apiTooManyRequests } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pwdLogger = logger.withContext("AUTH_CHANGE_PASSWORD");

/**
 * Changes the signed-in user's password in the CBS core (CPW). Serves both the forced first-login
 * change (the proxy is locked until it succeeds) and the voluntary change in Settings.
 */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return apiFail("Session expired. Please sign in again.", 401);
    }

    const rawBody = await req.json();
    const parsed = changePasswordSchema.safeParse(rawBody);

    if (!parsed.success) {
      return apiFail(
        parsed.error.issues[0]?.message || "Invalid password data.",
        400,
        parsed.error.issues.map((i) => i.message),
      );
    }

    // Limit current-password guesses from a signed-in session (an unattended terminal).
    const limitKey = `cpw:${session.userId}`;
    const { allowed, resetSec } = await rateLimit(limitKey);
    if (!allowed) {
      pwdLogger.warn(`Password change rate limit exceeded for user ${session.userId}`);
      return apiTooManyRequests("password change attempts", resetSec);
    }

    const envelope = buildGrpcEnvelope(session, {
      requestType: CbsRequestType.CPW,
      idempotencyKey: generateIdempotencyKey(),
      data: { currPass: parsed.data.oldPassword, newPass: parsed.data.newPassword },
    });
    const res = await dispatch(envelope, session.token);

    if (!isApiSuccess(res)) {
      const message = res.message || "The core rejected the password change.";
      pwdLogger.warn(`Password change rejected for user ${session.userId}: ${message}`);
      return apiFail(message, Math.max(res.statusCode, 400), res.errors);
    }

    // Only after the core accepted the new password: lift the first-login lock
    await clearRateLimit(limitKey);
    await clearInitialLoginRequirement();

    pwdLogger.info(`Password successfully changed for user ${session.userId}`);
    return apiSuccess(undefined, "Password updated successfully.");
  } catch (err: unknown) {
    pwdLogger.error("POST /api/change-password failed", err);
    return apiError(err, "Failed to update password.");
  }
}

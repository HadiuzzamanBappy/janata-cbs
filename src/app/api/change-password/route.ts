import type { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { changePasswordSchema } from "@/lib/data-schemas";
import { clearInitialLoginRequirement, getSession } from "@/lib/infra-redis";
import { apiError, apiFail, apiSuccess } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const pwdLogger = logger.withContext("AUTH_CHANGE_PASSWORD");

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

    // Clear initial login requirement in active Redis session and delete restriction cookie
    await clearInitialLoginRequirement();

    pwdLogger.info(`Password successfully changed for user ${session.userId}`);
    return apiSuccess(undefined, "Password updated successfully.");
  } catch (err: unknown) {
    pwdLogger.error("POST /api/change-password failed", err);
    return apiError(err, "Failed to update password.");
  }
}

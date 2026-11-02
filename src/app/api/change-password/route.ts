import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/core-config";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { changePasswordSchema } from "@/lib/data-schemas";
import { getSession, updateSession } from "@/lib/infra-redis";
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

    // Update active Redis session to set initLogin = false
    await updateSession({
      currUser: {
        ...session.currUser,
        initLogin: false,
      },
    });

    // Remove the initLogin HTTP cookie restriction
    const store = await cookies();
    store.delete(appConfig.auth.initLoginCookie);

    pwdLogger.info(`Password successfully changed for user ${session.userId}`);
    return apiSuccess(undefined, "Password updated successfully.");
  } catch (err: unknown) {
    pwdLogger.error("POST /api/change-password failed", err);
    return apiError(err, "Failed to update password.");
  }
}

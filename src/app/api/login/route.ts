import type { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { loginSchema } from "@/lib/data-schemas";
import { loginUser } from "@/lib/infra-grpc";
import { clearRateLimit, rateLimit } from "@/lib/infra-redis";
import { apiError, apiFail, apiSuccess, apiTooManyRequests, getClientIp } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const authLogger = logger.withContext("AUTH_API");

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rawBody = await req.json();
    const parsed = loginSchema.safeParse(rawBody);

    if (!parsed.success) {
      return apiFail(
        parsed.error.issues[0]?.message || "Username and password are required",
        400,
        parsed.error.issues.map((i) => i.message),
      );
    }

    const { username, password } = parsed.data;
    authLogger.info("Login attempt received", { username });

    // Rate limit per sign-on name. Not per IP: X-Forwarded-For is client-controlled, so an
    // IP-based key could be bypassed by sending a new fake IP on each attempt. IP is logged only.
    const ip = getClientIp(req);
    const limitKey = `login:${username.trim().toUpperCase()}`;
    const { allowed, resetSec } = await rateLimit(limitKey);
    if (!allowed) {
      authLogger.warn(`Rate limit exceeded for login: ${username}`, { ip, resetSec });
      return apiTooManyRequests("login attempts", resetSec);
    }

    const result = await loginUser({ username, password });

    if (!result.success || !result.user) {
      authLogger.warn(`Failed login for ${username}`, { error: result.error });
      const statusCode = result.statusCode || 401;
      const errMsg = result.error || "Invalid credentials";
      return apiFail(errMsg, statusCode, result.errors?.length ? result.errors : [errMsg]);
    }

    await clearRateLimit(limitKey);
    authLogger.info(`Successful login for ${username}`, {
      userId: result.user.userId,
      branchCode: result.user.branchCode,
      accessibility: result.user.accessibility,
    });

    return apiSuccess(result.user, "Logged in successfully");
  } catch (err: unknown) {
    authLogger.error("Internal login server error", err);
    return apiError(err, "Internal login server error");
  }
}

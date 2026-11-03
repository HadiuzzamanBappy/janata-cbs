import type { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { loginSchema } from "@/lib/data-schemas";
import { loginUser } from "@/lib/infra-grpc";
import { rateLimit } from "@/lib/infra-redis";
import { apiError, apiFail, apiSuccess, getClientIp } from "../_lib/response";

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

    // Rate limiting: configured attempts per minute per IP + username
    const ip = getClientIp(req);
    const { allowed, resetSec } = await rateLimit(`login:${ip}:${username}`);
    if (!allowed) {
      authLogger.warn(`Rate limit exceeded for login: ${username}`, { ip, resetSec });
      return apiFail(`Too many login attempts. Try again in ${resetSec}s.`, 429, undefined, {
        "Retry-After": String(resetSec),
      });
    }

    const result = await loginUser({ username, password });

    if (!result.success || !result.user) {
      authLogger.warn(`Failed login for ${username}`, { error: result.error });
      const statusCode = result.statusCode || 401;
      const errMsg = result.error || "Invalid credentials";
      return apiFail(errMsg, statusCode, result.errors?.length ? result.errors : [errMsg]);
    }

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

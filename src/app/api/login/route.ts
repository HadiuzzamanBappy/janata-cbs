import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import { loginSchema } from "@/lib/data-schemas";
import { rateLimit } from "@/lib/infra-redis";
import { loginUser } from "@/lib/infra-services";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const authLogger = logger.withContext("AUTH_API");

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const rawBody = await req.json();
    const parsed = loginSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 400,
          message: parsed.error.issues[0]?.message || "Username and password are required",
          errors: parsed.error.issues.map((i) => i.message),
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const { username, password } = parsed.data;

    // Log login attempt (passwords automatically redacted)
    authLogger.info("Login attempt received", { username });

    // Rate limiting: configured attempts per minute per IP + username
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const { allowed, resetSec } = await rateLimit(`login:${ip}:${username}`);
    if (!allowed) {
      authLogger.warn(`Rate limit exceeded for login: ${username}`, { ip, resetSec });
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 429,
          message: `Too many login attempts. Try again in ${resetSec}s.`,
          timestamp: new Date().toISOString(),
        },
        { status: 429, headers: { "Retry-After": String(resetSec) } },
      );
    }

    const result = await loginUser({ username, password });

    if (!result.success || !result.user) {
      authLogger.warn(`Failed login for ${username}`, { error: result.error });
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: result.statusCode || 401,
          message: result.error || "Invalid credentials",
          errors: result.errors?.length
            ? result.errors
            : [result.error || "Invalid credentials"],
          timestamp: new Date().toISOString(),
        },
        { status: result.statusCode || 401 },
      );
    }

    authLogger.info(`Successful login for ${username}`, {
      userId: result.user.userId,
      branchCode: result.user.branchCode,
      accessibility: result.user.accessibility,
    });

    return NextResponse.json(
      {
        success: true,
        status: "SUCCESS",
        statusCode: 200,
        message: "Logged in successfully",
        data: result.user,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    authLogger.error("Internal login server error", err);
    const message = err instanceof Error ? err.message : "Internal login server error";
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

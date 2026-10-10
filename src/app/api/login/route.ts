import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/core-logger";
import { rateLimit } from "@/lib/infra-redis";
import { loginUser } from "@/lib/infra-services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const authLogger = logger.withContext("AUTH_API");

interface LoginBody {
  username?: string;
  password?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as LoginBody;
    const { username, password } = body;

    // Log login attempt (passwords automatically redacted)
    authLogger.info("Login attempt received", { username, body });

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username and password are required" },
        { status: 400 },
      );
    }

    // Rate limiting: configured attempts per minute per IP + username
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const { allowed, resetSec } = await rateLimit(`login:${ip}:${username}`);
    if (!allowed) {
      authLogger.warn(`Rate limit exceeded for login: ${username}`, { ip, resetSec });
      return NextResponse.json(
        { success: false, message: `Too many login attempts. Try again in ${resetSec}s.` },
        { status: 429, headers: { "Retry-After": String(resetSec) } },
      );
    }

    const result = await loginUser({ username, password });

    if (!result.success || !result.user) {
      authLogger.warn(`Failed login for ${username}`, { error: result.error });
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Invalid credentials",
          errors: result.errors,
        },
        { status: result.statusCode || 401 },
      );
    }

    authLogger.info(`Successful login for ${username}`, {
      userId: result.user.userId,
      branchCode: result.user.branchCode,
      accessibility: result.user.accessibility,
    });

    return NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: result.user,
    });
  } catch (err: unknown) {
    authLogger.error("Internal login server error", err);
    const message = err instanceof Error ? err.message : "Internal login server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

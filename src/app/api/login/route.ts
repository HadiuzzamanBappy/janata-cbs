import { type NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/redis";
import { loginUser } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LoginBody {
  username?: string;
  password?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { username, password } = (await req.json()) as LoginBody;
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
      return NextResponse.json(
        { success: false, message: `Too many login attempts. Try again in ${resetSec}s.` },
        { status: 429, headers: { "Retry-After": String(resetSec) } },
      );
    }

    const result = await loginUser({ username, password });

    if (!result.success || !result.user) {
      return NextResponse.json(
        {
          success: false,
          message: result.error || "Invalid credentials",
          errors: result.errors,
        },
        { status: result.statusCode || 401 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Logged in successfully",
      user: result.user,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal login server error";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

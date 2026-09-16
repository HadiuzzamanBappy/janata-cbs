import { NextRequest, NextResponse } from "next/server";
import { loginProcess, grpcStatusToHttp } from "@/lib/core/grpc";
import { createSession, type CurrentUser } from "@/lib/core/redis-session";
import { rateLimit } from "@/lib/core/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LoginBody {
  clientId?: string;
  username?: string;
  password?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { username, password } = (await req.json()) as LoginBody;
    if (!username || !password) {
      return NextResponse.json(
        { message: "Username and password are required" },
        { status: 400 }
      );
    }

    // Rate limiting: 3 attempts per minute per IP + username combination
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const { allowed, resetSec } = await rateLimit(`login:${ip}:${username}`);
    if (!allowed) {
      return NextResponse.json(
        { message: `Too many login attempts. Try again in ${resetSec}s.` },
        { status: 429, headers: { "Retry-After": String(resetSec) } }
      );
    }

    const clientId = "web-client";
    const res = await loginProcess({ clientId, username, password });

    if (res.statusCode !== 200) {
      return NextResponse.json(
        { message: res.message || "Invalid credentials", errors: res.errors },
        { status: res.statusCode || 401 }
      );
    }

    const payload = (res.data ?? {}) as {
      userId: string;
      token: string;
      fullName: string;
      branchCode: string;
      userRole: string[];
      commandLine: boolean;
      branchName: string;
      txnDate: string;
      accessibility: string;
      isLoggedIn: boolean;
      initLogin: boolean;
      userStatus: number;
    };

    if (!payload.token || !payload.userId) {
      return NextResponse.json(
        { message: "Login response missing required authentication token" },
        { status: 502 }
      );
    }

    const currUser: CurrentUser = {
      userId: payload.userId,
      fullName: payload.fullName || username,
      branchCode: payload.branchCode || "JB9999",
      userRole: payload.userRole || ["TELLER"],
      commandLine: Boolean(payload.commandLine),
      branchName: payload.branchName || "Head Office",
      txnDate: payload.txnDate || new Date().toISOString().split("T")[0],
      accessibility: payload.accessibility || "FULL",
      isLoggedIn: true,
      initLogin: Boolean(payload.initLogin),
      userStatus: payload.userStatus ?? 1,
    };

    await createSession({
      userId: payload.userId,
      token: payload.token,
      currUser,
    });

    return NextResponse.json({ message: "Logged in successfully", user: currUser });
  } catch (err) {
    const { status, message } = grpcStatusToHttp(err);
    return NextResponse.json({ message }, { status: status || 500 });
  }
}

import { STATIC_USERS } from "@fixtures";
import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import {
  extractBooleanField,
  extractNumberField,
  extractStringField,
  grpcStatusToHttp,
  loginProcess,
} from "@/lib/grpc";
import { type CurrentUser, createSession, rateLimit } from "@/lib/redis";

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
      return NextResponse.json({ message: "Username and password are required" }, { status: 400 });
    }

    // Rate limiting: configured attempts per minute per IP + username combination
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const { allowed, resetSec } = await rateLimit(`login:${ip}:${username}`);
    if (!allowed) {
      return NextResponse.json(
        { message: `Too many login attempts. Try again in ${resetSec}s.` },
        { status: 429, headers: { "Retry-After": String(resetSec) } },
      );
    }

    const clientId = appConfig.grpc.clientId;

    if (appConfig.auth.userSource === "static") {
      const mockUser = STATIC_USERS[username.toLowerCase()];
      if (!mockUser) {
        return NextResponse.json(
          {
            message: "Invalid static credentials. Try 'admin', 'teller', or 'new_user'.",
          },
          { status: 401 },
        );
      }

      await createSession({
        userId: mockUser.userId,
        token: "static-mock-token-xyz123",
        currUser: mockUser,
      });

      return NextResponse.json({
        message: "Logged in successfully (STATIC)",
        user: mockUser,
      });
    }

    const res = await loginProcess({ clientId, username, password });

    if (res.statusCode !== 200) {
      return NextResponse.json(
        { message: res.message || "Invalid credentials", errors: res.errors },
        { status: res.statusCode || 401 },
      );
    }

    const rawData = res.data ?? {};
    const fields = (
      typeof rawData === "object" && rawData !== null && "fields" in rawData
        ? (rawData as { fields: Record<string, unknown> }).fields
        : rawData
    ) as Record<string, unknown>;

    const userId = (extractStringField(fields, "userId") || (fields.userId as string) || "").trim();
    const token = (extractStringField(fields, "token") || (fields.token as string) || "").trim();

    if (!token || !userId) {
      return NextResponse.json(
        { message: "Login response missing required authentication token or userId" },
        { status: 502 },
      );
    }

    const fullName = extractStringField(fields, "fullName") || (fields.fullName as string) || username;
    const branchCode = extractStringField(fields, "branchCode") || (fields.branchCode as string) || appConfig.centralBranch;
    const branchName = extractStringField(fields, "branchName") || (fields.branchName as string) || "Central Office";
    const txnDate = extractStringField(fields, "txnDate") || (fields.txnDate as string) || new Date().toISOString().split("T")[0];
    const accessibility = extractStringField(fields, "accessibility") || (fields.accessibility as string) || "FULL";
    const commandLine = extractBooleanField(fields, "commandLine", false);
    const initLogin = extractBooleanField(fields, "initLogin", false);
    const userStatus = extractNumberField(fields, "userStatus", 1);
    
    // Extract role
    let userRole = ["TELLER"];
    if (Array.isArray(fields.userRole)) {
      userRole = fields.userRole.map(String);
    } else if (typeof fields.userRole === "string" && fields.userRole.trim()) {
      userRole = [fields.userRole.trim()];
    }

    // Extract function rights if present in accessibility or dedicated field
    const functionRights = accessibility ? accessibility.split("").filter(Boolean) : ["R", "I", "D", "A", "S", "H"];

    const currUser: CurrentUser = {
      userId,
      fullName: fullName.trim(),
      branchCode: branchCode.trim(),
      userRole,
      accessibility,
      functionRights,
      commandLine,
      branchName: branchName.trim(),
      txnDate: txnDate.trim(),
      isLoggedIn: true,
      initLogin,
      userStatus,
    };

    await createSession({
      userId,
      token,
      currUser,
    });

    return NextResponse.json({
      message: "Logged in successfully",
      user: currUser,
    });
  } catch (err) {
    const { status, message } = grpcStatusToHttp(err);
    return NextResponse.json({ message }, { status: status || 500 });
  }
}

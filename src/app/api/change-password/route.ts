import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/core-config";
import { changePasswordSchema } from "@/lib/data-schemas";
import { getSession, updateSession } from "@/lib/infra-redis";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 401,
          message: "Session expired. Please sign in again.",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    const rawBody = await req.json();
    const parsed = changePasswordSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 400,
          message: parsed.error.issues[0]?.message || "Invalid password data.",
          errors: parsed.error.issues.map((i) => i.message),
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    // 2. Update active Redis session to set initLogin = false
    await updateSession({
      currUser: {
        ...session.currUser,
        initLogin: false,
      },
    });

    // 3. Remove the initLogin HTTP cookie restriction
    const store = await cookies();
    store.delete(appConfig.auth.initLoginCookie);

    return NextResponse.json(
      {
        success: true,
        status: "SUCCESS",
        statusCode: 200,
        message: "Password updated successfully.",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update password.";
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

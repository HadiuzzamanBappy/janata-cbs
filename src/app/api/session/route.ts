import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { updateBranchSessionSchema } from "@/lib/data-schemas";
import {
  destroySession,
  getFromSession,
  getSession,
  updateBranchCodeAndName,
} from "@/lib/infra-redis";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const sessionLogger = logger.withContext("SESSION_API");

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const currUser = await getFromSession("currUser");

    if (!currUser) {
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 401,
          message: "No active session",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        status: "SUCCESS",
        statusCode: 200,
        data: currUser,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    sessionLogger.error("GET /api/session failed", error);
    const message =
      error instanceof Error ? error.message : "Internal server error retrieving session";
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

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 401,
          message: "Unauthorized",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const parsed = updateBranchSessionSchema.safeParse(body);

    if (parsed.success) {
      const updatedUser = await updateBranchCodeAndName(
        parsed.data.branchCode,
        parsed.data.branchName,
      );
      if (!updatedUser) {
        return NextResponse.json(
          {
            success: false,
            status: "FAIL",
            statusCode: 500,
            message: "Failed to update session branch",
            timestamp: new Date().toISOString(),
          },
          { status: 500 },
        );
      }

      const res = NextResponse.json(
        {
          success: true,
          status: "SUCCESS",
          statusCode: 200,
          data: updatedUser,
          currUser: updatedUser,
          timestamp: new Date().toISOString(),
        },
        { status: 200 },
      );

      // Keep cookie aligned with updated branch
      res.cookies.set(appConfig.auth.branchCookie, parsed.data.branchCode, {
        httpOnly: false,
        secure: !appConfig.isDev && appConfig.useHttps,
        sameSite: "lax",
        path: "/",
        maxAge: appConfig.auth.sessionMaxAgeSeconds,
      });

      return res;
    }

    return NextResponse.json(
      {
        success: true,
        status: "SUCCESS",
        statusCode: 200,
        data: session.currUser,
        currUser: session.currUser,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    sessionLogger.error("POST /api/session failed", error);
    const message =
      error instanceof Error ? error.message : "Internal server error updating session";
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

export async function DELETE(): Promise<NextResponse<ApiResponse>> {
  sessionLogger.info("Destroying session via DELETE /api/session");
  await destroySession();
  return NextResponse.json(
    {
      success: true,
      status: "SUCCESS",
      statusCode: 200,
      message: "Session destroyed",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}

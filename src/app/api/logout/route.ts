import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/infra-services";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse<ApiResponse>> {
  try {
    await logoutUser();
    return NextResponse.json(
      {
        success: true,
        status: "SUCCESS",
        statusCode: 200,
        message: "Logged out successfully",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to logout";
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

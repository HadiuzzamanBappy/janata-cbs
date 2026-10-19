import { NextResponse } from "next/server";
import { getSession } from "@/lib/infra-redis";
import { getMenuData } from "@/lib/infra-services";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getSession();
    if (!session?.token) {
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 401,
          message: "Unauthorized: Active session required",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    const menuItems = await getMenuData();
    return NextResponse.json(
      {
        success: true,
        status: "SUCCESS",
        statusCode: 200,
        data: menuItems,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch menu items";
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

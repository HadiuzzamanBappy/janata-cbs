import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/infra-redis";
import { getEnquiryData } from "@/lib/infra-services";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cmd: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    const { cmd } = await params;
    if (!cmd) {
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 400,
          message: "Command parameter is required",
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

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

    const schema = await getEnquiryData(cmd);

    if (!schema) {
      return NextResponse.json(
        {
          success: false,
          status: "RECORD_NOT_FOUND",
          statusCode: 404,
          message: `Inquiry schema not found for command "${cmd}"`,
          timestamp: new Date().toISOString(),
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        status: "SUCCESS",
        statusCode: 200,
        data: schema,
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Inquiry Schema Fetch Error";
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

import { type NextRequest, NextResponse } from "next/server";
import { getModelData } from "@/lib/services";
import { getSession } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ cmd: string }> },
): Promise<NextResponse> {
  try {
    const { cmd } = await params;
    if (!cmd) {
      return NextResponse.json(
        { success: false, error: "Command parameter is required" },
        { status: 400 },
      );
    }

    const session = await getSession();
    if (!session?.token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required" },
        { status: 401 },
      );
    }

    const schema = await getModelData(cmd, session.token);

    if (!schema) {
      return NextResponse.json(
        { success: false, error: `Schema not found for command "${cmd}"` },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: schema }, { status: 200 });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal Schema Fetch Error",
      },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { getControlsData } from "@/lib/schema/get-controls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const controls = await getControlsData();
    return NextResponse.json({ success: true, data: controls });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to fetch system controls",
      },
      { status: 500 },
    );
  }
}

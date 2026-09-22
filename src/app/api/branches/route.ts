import { NextResponse } from "next/server";
import { getBranches } from "@/lib/schema/get-branches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branches = await getBranches();
    return NextResponse.json({ success: true, data: branches });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch branch list",
      },
      { status: 500 },
    );
  }
}

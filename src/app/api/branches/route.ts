import { NextResponse } from "next/server";
import { getBranches } from "@/lib/schema/get-branches";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branches = await getBranches();
    return NextResponse.json({ success: true, data: branches });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to fetch branch list",
      },
      { status: 500 },
    );
  }
}

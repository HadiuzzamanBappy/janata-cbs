import { NextResponse } from "next/server";
import { getBranchesData } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const branches = await getBranchesData();
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

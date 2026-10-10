import { NextResponse } from "next/server";
import { getSession } from "@/lib/infra-redis";
import { getBranchesData } from "@/lib/infra-services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Active session required" },
        { status: 401 },
      );
    }

    const branches = await getBranchesData(session.token);
    return NextResponse.json({ success: true, data: branches });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch branch list";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}

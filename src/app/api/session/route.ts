import { type NextRequest, NextResponse } from "next/server";
import { destroySession, getFromSession, getSession, updateBranchCodeAndName } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const currUser = await getFromSession("currUser");

    if (!currUser) {
      return NextResponse.json({ success: false, message: "No active session" }, { status: 401 });
    }

    return NextResponse.json({ success: true, currUser }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error retrieving session";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.branchCode && body.branchName) {
      const updatedUser = await updateBranchCodeAndName(body.branchCode, body.branchName);
      if (!updatedUser) {
        return NextResponse.json(
          { success: false, message: "Failed to update session branch" },
          { status: 500 },
        );
      }
      return NextResponse.json({ success: true, currUser: updatedUser }, { status: 200 });
    }

    return NextResponse.json({ success: true, currUser: session.currUser }, { status: 200 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Internal server error updating session";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(): Promise<NextResponse> {
  await destroySession();
  return NextResponse.json({ success: true, message: "Session destroyed" });
}

import { NextResponse } from "next/server";
import { getSession } from "@/lib/redis";
import { getMenuData } from "@/lib/services";

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

    const menuItems = await getMenuData(session.token);
    return NextResponse.json({ success: true, data: menuItems });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch menu items";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

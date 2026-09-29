import { NextResponse } from "next/server";
import { getMenuData } from "@/lib/services";
import { getSession } from "@/lib/redis";

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
    const err = error as { message?: string };
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch menu items" },
      { status: 500 },
    );
  }
}

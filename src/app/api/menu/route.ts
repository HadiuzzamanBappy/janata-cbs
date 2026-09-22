import { NextResponse } from "next/server";
import { getMenuData } from "@/lib/schema/get-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const menuItems = await getMenuData();
    return NextResponse.json({ success: true, data: menuItems });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch menu items" },
      { status: 500 },
    );
  }
}

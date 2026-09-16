import { NextResponse } from "next/server";
import { destroySession } from "@/lib/core/redis-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  await destroySession();
  return NextResponse.json({ message: "Logged out successfully", success: true });
}

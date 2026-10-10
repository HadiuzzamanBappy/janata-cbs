import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/infra-services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  await logoutUser();
  return NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });
}

import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/config";
import { invalidateCache } from "@/lib/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const secret = appConfig.redis.invalidateToken;

  // TODO: [Step 8 - Security Audit] Enforce HMAC SHA-256 signature verification for Java core webhook calls.
  if (secret) {
    const provided = request.headers.get("x-cache-token");
    if (provided !== secret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const control = request.nextUrl.searchParams.get("control") ?? undefined;
  const removed = await invalidateCache(control);

  return NextResponse.json({ success: true, removed, control: control ?? "*" });
}

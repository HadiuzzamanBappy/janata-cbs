import { type NextRequest, NextResponse } from "next/server";
import { invalidateCache } from "@/lib/core/cache";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const secret = env.CACHE_INVALIDATE_TOKEN;

  // TODO: [Step 8 - Security Audit] Enforce HMAC SHA-256 signature verification for Java core webhook calls.
  if (secret) {
    const provided = request.headers.get("x-cache-token");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const control = new URL(request.url).searchParams.get("control") ?? undefined;
  const removed = await invalidateCache(control);

  return NextResponse.json({ removed, control: control ?? "*" });
}

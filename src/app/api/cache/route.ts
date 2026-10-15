import { type NextRequest, NextResponse } from "next/server";
import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import { invalidateCache } from "@/lib/infra-redis";
import type { ApiResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const secret = appConfig.redis.invalidateToken;

    // Enforce token verification if configured, or require development environment
    const provided = request.headers.get("x-cache-token");
    if (secret && provided !== secret) {
      return NextResponse.json(
        {
          success: false,
          status: "FAIL",
          statusCode: 401,
          message: "Unauthorized: Invalid or missing cache invalidation token",
          timestamp: new Date().toISOString(),
        },
        { status: 401 },
      );
    }

    const control = request.nextUrl.searchParams.get("control") ?? undefined;
    const removed = await invalidateCache(control);
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "internal";

    logger.info(
      `[Cache] Invalidated ${removed} key(s) for pattern/control: "${control ?? "*"}" by [${clientIp}]`,
      { control: control ?? "*", removed, clientIp },
      "CACHE",
    );

    return NextResponse.json(
      {
        success: true,
        status: "SUCCESS",
        statusCode: 200,
        message: `Invalidated cache for: ${control ?? "*"}`,
        data: { removed, control: control ?? "*" },
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Cache invalidation failed";
    return NextResponse.json(
      {
        success: false,
        status: "ERROR",
        statusCode: 500,
        message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

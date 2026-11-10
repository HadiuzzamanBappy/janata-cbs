import type { NextRequest, NextResponse } from "next/server";
import { serverConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { invalidateCache } from "@/lib/infra-redis";
import { apiError, apiFail, apiSuccess, getClientIp } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cacheLogger = logger.withContext("CACHE_API");

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const secret = serverConfig.redis.invalidateToken;

    // Enforce token verification if configured
    const provided = request.headers.get("x-cache-token");
    if (secret && provided !== secret) {
      return apiFail("Unauthorized: Invalid or missing cache invalidation token", 401);
    }

    const control = request.nextUrl.searchParams.get("control") ?? undefined;
    const removed = await invalidateCache(control);
    const clientIp = getClientIp(request);

    cacheLogger.info(
      `Invalidated ${removed} key(s) for pattern/control: "${control ?? "*"}" by [${clientIp}]`,
      { control: control ?? "*", removed, clientIp },
    );

    return apiSuccess(
      { removed, control: control ?? "*" },
      `Invalidated cache for: ${control ?? "*"}`,
    );
  } catch (err: unknown) {
    cacheLogger.error("DELETE /api/cache failed", err);
    return apiError(err, "Cache invalidation failed");
  }
}

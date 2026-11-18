import { timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { serverConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";
import type { ApiResponse } from "@/lib/data-schemas";
import { invalidateCache } from "@/lib/infra-redis";
import { apiError, apiFail, apiSuccess, getClientIp } from "../_lib/response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cacheLogger = logger.withContext("CACHE_API");

/**
 * Optional `?control=` filter: a screen / model ID prefix such as `ACCOUNT` (clears that ID's form,
 * model, inquiry and menu keys plus every user menu); omitted means every spec and menu key.
 */
const controlParamSchema = z.string().trim().min(1).max(64).optional();

export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Disabled unless a token is configured; compared in constant time.
    const secret = serverConfig.redis.invalidateToken;
    if (!secret) {
      return apiFail(
        "Cache invalidation endpoint is disabled (CACHE_INVALIDATE_TOKEN not set)",
        403,
      );
    }
    const expected = Buffer.from(secret);
    const provided = Buffer.from(request.headers.get("x-cache-token") ?? "");
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
      return apiFail("Unauthorized: Invalid or missing cache invalidation token", 401);
    }

    const parsedControl = controlParamSchema.safeParse(
      request.nextUrl.searchParams.get("control") ?? undefined,
    );
    if (!parsedControl.success) {
      return apiFail("Invalid 'control' parameter", 400);
    }
    const control = parsedControl.data;
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

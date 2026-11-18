import "server-only";

import { serverConfig } from "@/lib/core-config/server";
import { cacheDelete, cacheKey, circuitOpen, getRedisClient, tripCircuit } from "./client";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSec: number;
}

/** Per-process fallback window, used while Redis is disabled or unavailable. */
const memoryWindows = new Map<string, { count: number; resetAt: number }>();

function memoryHit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  for (const [k, w] of memoryWindows) if (w.resetAt <= now) memoryWindows.delete(k);

  const window = memoryWindows.get(key) ?? { count: 0, resetAt: now + windowSec * 1000 };
  window.count += 1;
  memoryWindows.set(key, window);

  return {
    allowed: window.count <= limit,
    remaining: Math.max(0, limit - window.count),
    resetSec: Math.ceil((window.resetAt - now) / 1000),
  };
}

/**
 * Fixed-window rate limiter: at most `limit` hits per `windowSec`, counted from the first hit.
 * Uses Redis when it is reachable and a per-process counter otherwise, so the limit still holds
 * during a Redis outage (per instance) instead of failing open.
 */
export async function rateLimit(
  key: string,
  limit = serverConfig.auth.loginLimit,
  windowSec = serverConfig.auth.rateLimitWindowSec,
): Promise<RateLimitResult> {
  const redis = circuitOpen() ? null : getRedisClient();
  if (!redis) return memoryHit(key, limit, windowSec);

  const redisKey = cacheKey(serverConfig.redis.cacheKeys.rateLimit(key));
  try {
    // SET ... NX starts the window only on the first hit; INCR never extends it.
    const results = await redis
      .pipeline()
      .set(redisKey, 0, "EX", windowSec, "NX")
      .incr(redisKey)
      .ttl(redisKey)
      .exec();
    const count = (results?.[1]?.[1] as number) ?? 1;
    const ttl = (results?.[2]?.[1] as number) ?? windowSec;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetSec: ttl > 0 ? ttl : windowSec,
    };
  } catch {
    tripCircuit();
    return memoryHit(key, limit, windowSec);
  }
}

/** Clears a key's window, for example after a successful login. */
export async function clearRateLimit(key: string): Promise<void> {
  memoryWindows.delete(key);
  await cacheDelete(cacheKey(serverConfig.redis.cacheKeys.rateLimit(key)));
}

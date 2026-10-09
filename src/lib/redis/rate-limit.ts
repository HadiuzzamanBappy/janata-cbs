import "server-only";
import { appConfig } from "@/lib/config/server";
import { getRedisClient } from "./client";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSec: number;
}

/**
 * Fixed-window rate limiter utilizing Redis.
 * Defaults to appConfig.auth.loginLimit attempts per window. Fails open on Redis outages.
 */
export async function rateLimit(
  key: string,
  limit = appConfig.auth.loginLimit,
  windowSec = appConfig.auth.rateLimitWindowSec,
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  if (!redis) {
    return { allowed: true, remaining: limit, resetSec: windowSec };
  }

  const redisKey = `rl:${key}`;
  try {
    const pipeline = redis.pipeline();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, windowSec);
    const results = await pipeline.exec();
    const count = (results?.[0]?.[1] as number) ?? 1;
    const ttl = (results?.[1]?.[1] as number) ?? windowSec;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetSec: ttl > 0 ? ttl : windowSec,
    };
  } catch {
    return { allowed: true, remaining: limit, resetSec: windowSec };
  }
}

import "server-only";
import { env } from "@/lib/config";
import { getRedisClient } from "@/lib/core/redis-client";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSec: number;
}

/**
 * Fixed-window rate limiter utilizing Redis.
 * Defaults to 3 login attempts per minute. Fails open on Redis outages.
 */
export async function rateLimit(
  key: string,
  limit = env.LOGIN_LIMIT || 3,
  windowSec = 60,
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

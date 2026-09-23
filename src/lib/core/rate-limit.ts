import "server-only";
import { getRedisClient } from "@/lib/core/redis-client";
import { env } from "@/lib/config";

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
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }
    const ttl = await redis.ttl(redisKey);
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetSec: ttl > 0 ? ttl : windowSec,
    };
  } catch {
    return { allowed: true, remaining: limit, resetSec: windowSec };
  }
}

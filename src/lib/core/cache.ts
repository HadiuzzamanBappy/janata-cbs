import "server-only";
import {
  cacheDelete,
  cacheGet,
  cacheKey,
  cacheSet,
  circuitOpen,
  singleFlight,
} from "@/lib/core/redis-client";
import { env } from "@/lib/env";

const DEFAULT_TTL_SECONDS = 60 * 60 * 24; // 24 Hours

/**
 * Gets a cached item by key or executes the fetcher function on miss / circuit trip.
 */
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<T> {
  const fullKey = cacheKey(key);

  if (env.CACHE_ENABLED && !circuitOpen()) {
    const cached = await cacheGet<T>(fullKey);
    if (cached !== null) {
      return cached;
    }
  }

  // Use single-flight pattern to collapse concurrent cold cache hits
  return singleFlight(fullKey, async () => {
    const freshData = await fetcher();

    if (env.CACHE_ENABLED && !circuitOpen() && freshData) {
      await cacheSet(fullKey, freshData, ttlSeconds);
    }

    return freshData;
  });
}

/**
 * Invalidation hook to clear all or specific model schema caches.
 */
export async function invalidateCache(controlName?: string): Promise<number> {
  if (controlName) {
    const key = cacheKey("model", controlName.toUpperCase());
    return await cacheDelete(key);
  }
  // Delete all keys matching key prefix pattern
  const pattern = cacheKey("*");
  return await cacheDelete(pattern);
}

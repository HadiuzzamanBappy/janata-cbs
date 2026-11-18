import "server-only";

import Redis from "ioredis";
import { serverConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";

const redisLogger = logger.withContext("REDIS");

/* -------------------------------------------------------------------------- */
/* Circuit Breaker & Connection State                                         */
/* -------------------------------------------------------------------------- */

const PREFIX = serverConfig.redis.keyPrefix;
const ENABLED = serverConfig.redis.enabled;
const COOLDOWN_MS = serverConfig.redis.cooldownMs;

type Client = Redis & { __warned?: boolean };

let openUntil = 0;

export function circuitOpen(): boolean {
  return Date.now() < openUntil;
}

export function tripCircuit(): void {
  openUntil = Date.now() + COOLDOWN_MS;
}

/** @internal Exported only for scripts/verify. */
export function resetCircuit(): void {
  openUntil = 0;
}

declare global {
  var __redisClient: Client | null | undefined;
}

/* -------------------------------------------------------------------------- */
/* Redis Client Lifecycle                                                     */
/* -------------------------------------------------------------------------- */

export function getRedisClient(): Client | null {
  if (!ENABLED) return null;

  if (globalThis.__redisClient !== undefined) {
    return globalThis.__redisClient;
  }

  try {
    const client = new Redis(serverConfig.redis.url, {
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      commandTimeout: 1000,
      lazyConnect: false,
      retryStrategy: (times) => Math.min(times * 500, 5000),
    }) as Client;

    client.on("error", (error) => {
      if (!client.__warned) {
        client.__warned = true;
        redisLogger.warn(`Redis unavailable, failing open: ${error.message}`);
      }
      tripCircuit();
    });

    client.on("ready", () => {
      const recovered = client.__warned === true;
      client.__warned = false;
      openUntil = 0;
      redisLogger.info(`Redis connected successfully at ${serverConfig.redis.url}`);
      // Config saved during the outage couldn't invalidate the spec cache: drop it on recovery.
      if (recovered) void deleteKeysMatching(SPEC_CACHE_PATTERNS);
    });

    globalThis.__redisClient = client;
    return client;
  } catch (error) {
    redisLogger.warn("Failed to initialize Redis client:", error);
    globalThis.__redisClient = null;
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Centralized Key Namespacing & Safe Operations                              */
/* -------------------------------------------------------------------------- */

/**
 * Returns a fully namespaced Redis key using the canonical key prefix (`cbs:...`).
 */
export function cacheKey(...parts: string[]): string {
  return [PREFIX, ...parts].join(":");
}

/** Spec and menu keys only: what "clear the cache" may delete (never sessions or rate limits). */
export const SPEC_CACHE_PATTERNS: readonly string[] = [cacheKey("spec:*"), cacheKey("menu:*")];

/**
 * Reads a JSON key: the value, `null` when the key is absent, or `undefined` when Redis is
 * disabled or unavailable. Callers that must not confuse "absent" with "down" use this.
 */
export async function cacheRead<T>(key: string): Promise<T | null | undefined> {
  if (circuitOpen()) return undefined;

  const redis = getRedisClient();
  if (!redis) return undefined;

  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    tripCircuit();
    return undefined;
  }
}

/** Safe JSON retrieval: `null` when absent or when Redis is unavailable. */
export async function cacheGet<T>(key: string): Promise<T | null> {
  return (await cacheRead<T>(key)) ?? null;
}

/** Safe JSON persistence. Returns `false` when Redis is disabled or the write failed. */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<boolean> {
  if (circuitOpen()) return false;

  const redis = getRedisClient();
  if (!redis) return false;

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
    return true;
  } catch {
    tripCircuit();
    return false;
  }
}

/**
 * Safe key deletion supporting single keys or SCAN-based pattern deletions.
 */
export async function cacheDelete(pattern: string): Promise<number> {
  if (circuitOpen()) return 0;

  const redis = getRedisClient();
  if (!redis) return 0;

  try {
    if (!pattern.includes("*")) {
      return await redis.del(pattern);
    }

    let cursor = "0";
    let removed = 0;
    do {
      const [next, batch] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
      cursor = next;
      if (batch.length > 0) {
        removed += await redis.del(...batch);
      }
    } while (cursor !== "0");

    return removed;
  } catch {
    tripCircuit();
    return 0;
  }
}

/** Deletes every key matching any of the patterns; returns how many were removed. */
export async function deleteKeysMatching(patterns: readonly string[]): Promise<number> {
  const counts = await Promise.all(patterns.map((p) => cacheDelete(p)));
  return counts.reduce((sum, count) => sum + count, 0);
}

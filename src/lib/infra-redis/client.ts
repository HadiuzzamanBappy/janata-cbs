import "server-only";

import Redis from "ioredis";
import { appConfig } from "@/lib/core-config/server";
import { logger } from "@/lib/core-logger";

const redisLogger = logger.withContext("REDIS");

/* -------------------------------------------------------------------------- */
/* Circuit Breaker & Connection State                                         */
/* -------------------------------------------------------------------------- */

const PREFIX = appConfig.redis.keyPrefix;
const ENABLED = appConfig.redis.enabled;
const COOLDOWN_MS = appConfig.redis.cooldownMs;

type Client = Redis & { __warned?: boolean };

let openUntil = 0;

export function circuitOpen(): boolean {
  return Date.now() < openUntil;
}

export function tripCircuit(): void {
  openUntil = Date.now() + COOLDOWN_MS;
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
    const client = new Redis(appConfig.redis.url, {
      enableOfflineQueue: true,
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
      client.__warned = false;
      openUntil = 0;
      redisLogger.info(`Redis connected successfully at ${appConfig.redis.url}`);
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

/**
 * Safe JSON retrieval with automatic circuit breaker gating.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (circuitOpen()) return null;

  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    tripCircuit();
    return null;
  }
}

/**
 * Safe JSON persistence with automatic circuit breaker gating.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (circuitOpen()) return;

  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    tripCircuit();
  }
}

/**
 * Safe key deletion supporting single keys or SCAN-based pattern deletions.
 */
export async function cacheDelete(pattern: string): Promise<number> {
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
    return 0;
  }
}

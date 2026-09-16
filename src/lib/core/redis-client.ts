import "server-only";
import Redis from "ioredis";
import { env } from "@/lib/env";

/**
 * Redis client with circuit breaker and fail-open guarantees.
 * Ensures that Redis outages never bring down core banking application flows.
 */

const URL = env.REDIS_URL || "redis://127.0.0.1:6379";
const PREFIX = env.REDIS_KEY_PREFIX || "finx";
const ENABLED = env.CACHE_ENABLED;
const COOLDOWN_MS = Number(env.CACHE_COOLDOWN_MS || 5000);

type Client = Redis & { __warned?: boolean };

let openUntil = 0;

export function circuitOpen(): boolean {
  return Date.now() < openUntil;
}

export function tripCircuit(): void {
  openUntil = Date.now() + COOLDOWN_MS;
}

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Client | null | undefined;
}

export function getRedisClient(): Client | null {
  if (!ENABLED) return null;

  if (globalThis.__redisClient !== undefined) {
    return globalThis.__redisClient;
  }

  try {
    const client = new Redis(URL, {
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
        console.warn(`[cache] Redis unavailable, serving from core: ${error.message}`);
      }
      tripCircuit();
    });

    client.on("ready", () => {
      client.__warned = false;
      openUntil = 0;
      console.info(`[cache] Redis connected successfully at ${URL}`);
    });

    globalThis.__redisClient = client;
    return client;
  } catch (error) {
    console.warn("[cache] Failed to initialize Redis client:", error);
    globalThis.__redisClient = null;
    return null;
  }
}

export function cacheKey(...parts: string[]): string {
  return [PREFIX, ...parts].join(":");
}

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

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  if (circuitOpen()) return;

  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    tripCircuit();
  }
}

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

/** In-process single-flight request deduplication wrapper */
const inflight = new Map<string, Promise<unknown>>();

export function singleFlight<T>(key: string, run: () => Promise<T>): Promise<T> {
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = run().finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

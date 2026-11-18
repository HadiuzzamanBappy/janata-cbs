import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const prefix = process.env.REDIS_KEY_PREFIX || "cbs";

async function clearCache() {
  console.log(`Connecting to Redis at ${redisUrl}...`);
  const redis = new Redis(redisUrl, {
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  });

  try {
    // Spec and menu caches only: sessions (sess:, user:sess:) and rate limits (rl:) are kept,
    // so clearing the cache never signs operators out.
    const patterns = [`${prefix}:spec:*`, `${prefix}:menu:*`];
    let count = 0;

    for (const pattern of patterns) {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
        cursor = nextCursor;
        if (keys.length > 0) count += await redis.del(...keys);
      } while (cursor !== "0");
    }

    console.log(`✓ Cache cleared: removed ${count} key(s) matching ${patterns.join(", ")}.`);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`✕ Failed to clear Redis cache: ${errorMessage}`);
  } finally {
    redis.disconnect();
    process.exit(0);
  }
}

clearCache();

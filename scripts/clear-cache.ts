import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const prefix = process.env.REDIS_KEY_PREFIX || "finx";

async function clearCache() {
  console.log(`Connecting to Redis at ${redisUrl}...`);
  const redis = new Redis(redisUrl, {
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  });

  try {
    const pattern = `${prefix}:*`;
    let cursor = "0";
    let count = 0;

    do {
      const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
      cursor = nextCursor;
      if (keys.length > 0) {
        const deleted = await redis.del(...keys);
        count += deleted;
      }
    } while (cursor !== "0");

    console.log(`✓ Cache cleared successfully! Removed ${count} key(s) matching pattern "${pattern}".`);
  } catch (err: any) {
    console.error(`✕ Failed to clear Redis cache: ${err?.message || err}`);
  } finally {
    redis.disconnect();
    process.exit(0);
  }
}

clearCache();

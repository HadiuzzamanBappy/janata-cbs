import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const prefix = process.env.REDIS_KEY_PREFIX || "cbs";

async function inspectCache() {
  console.log(`Connecting to Redis at ${redisUrl}...`);
  const redis = new Redis(redisUrl, {
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
  });

  try {
    const pattern = `${prefix}:*`;
    let cursor = "0";
    const keys: string[] = [];

    do {
      const [nextCursor, batch] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 200);
      cursor = nextCursor;
      keys.push(...batch);
    } while (cursor !== "0");

    if (keys.length === 0) {
      console.log(
        `\nℹ No cached keys found matching pattern "${pattern}". Cache is currently empty.\n`,
      );
      return;
    }

    console.log(`\n🔍 Found ${keys.length} cached key(s) matching "${pattern}":\n`);

    for (const key of keys) {
      const [type, ttl, rawVal] = await Promise.all([
        redis.type(key),
        redis.ttl(key),
        redis.get(key),
      ]);

      const ttlDisplay = ttl === -1 ? "no expiry" : ttl === -2 ? "expired" : `${ttl}s remaining`;
      console.log(`🔑 Key:   ${key}`);
      console.log(`   Type:  ${type} | TTL: ${ttlDisplay}`);

      if (rawVal) {
        try {
          const parsed = JSON.parse(rawVal);
          const preview = JSON.stringify(parsed, null, 2);
          const lines = preview.split("\n");
          if (lines.length > 15) {
            console.log(
              `   Value: ${lines.slice(0, 15).join("\n")}\n          ... [truncated, ${lines.length - 15} more lines]`,
            );
          } else {
            console.log(`   Value: ${preview}`);
          }
        } catch {
          const preview = rawVal.length > 150 ? `${rawVal.slice(0, 150)}...` : rawVal;
          console.log(`   Value: ${preview}`);
        }
      }
      console.log("─".repeat(60));
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`✕ Failed to inspect Redis cache: ${errorMessage}`);
  } finally {
    redis.disconnect();
    process.exit(0);
  }
}

inspectCache();

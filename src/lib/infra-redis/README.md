# ⚡ CBS Infrastructure: Redis Caching & Session Engine (`@/lib/infra-redis`)

A resilient, server-only caching, session persistence, and rate-limiting subsystem designed for the **Janata Core Banking Workbench**.

It accelerates repetitive core banking metadata lookups (form schemas, inquiry definitions, branch catalogs) while providing a high-availability session store protected by an automatic **circuit breaker** and **single-flight concurrency deduplication**.

---

## 📦 What It Contains

```text
src/lib/infra-redis/
├── client.ts       # ioredis connection pool, circuit breaker (open/closed/cooldown), and atomic key operations
├── cache.ts        # Read-through cache API (getOrSet), single-flight request collapse, and cache invalidation
├── session.ts      # Server-side session lifecycle (create, read, patch, destroy) with inactivity timeout guard
├── rate-limit.ts   # Fixed-window Redis pipeline rate limiter for login brute-force prevention
└── index.ts        # Server-only barrel exports ('server-only')
```

---

## 🛡️ Resilience & Production Engineering

### 1. Circuit Breaker ("Fail-Open" Resilience)
If Redis crashes or is not running during local development:
- The connection failure trips the circuit breaker (`tripCircuit()`).
- During the cooldown window (`appConfig.redis.cooldownMs` = 5,000ms), all cache operations **fail open** without throwing errors or halting the banking operator.
- Sessions automatically fall back to a server-side in-memory `Map` (`__memorySessionStore`).
- The entire workbench remains 100% operational with zero Redis dependencies.

### 2. Single-Flight Concurrency Deduplication (`singleFlight`)
Prevents **cache stampedes ("thundering herd")** when 50+ tellers open the same form simultaneously on a cold morning:
- The first request triggers the database/gRPC fetch.
- All subsequent concurrent requests for the same key are attached to the **same in-flight Promise**.
- Only 1 query hits the Java backend, resolving simultaneously for all callers.

### 3. Non-Blocking Pattern Deletions
Invalidations never run the blocking `KEYS *` command. Instead, `cacheDelete()` runs cursor-based `SCAN ... COUNT 200` to delete keys in safe micro-batches.

---

## 🚀 How to Use

### 1. Read-Through Caching (`getOrSet`)

Used in backend services to cache expensive metadata:

```typescript
import { getOrSet } from "@/lib/infra-redis";

// Fetches from cache if available; otherwise executes fetcher and caches result
const formSchema = await getOrSet(
  "spec:ACCOUNT",
  async () => {
    return await fetchFormSchemaFromGrpc("ACCOUNT");
  },
  3600 // TTL in seconds
);
```

---

### 2. Managing Server Sessions (`session.ts`)

Encapsulates user session state behind secure, HTTP-only cookie IDs (`sid`):

```typescript
import { createSession, getSession, destroySession } from "@/lib/infra-redis";

// On Login:
const sessionId = await createSession({
  userId: "AD028459",
  token: "jwt-token-string",
  currUser: {
    userId: "AD028459",
    userName: "Senior Officer",
    branchCode: "JB0001",
    branchName: "Corporate Branch",
    accessibility: "RIDASHL",
  },
});

// In API Route / Server Action:
const session = await getSession();
if (!session) {
  throw new Error("UNAUTHORIZED");
}
console.log(session.currUser.userName);

// On Logout:
await destroySession();
```

---

### 3. Login Rate Limiting (`rateLimit`)

Fixed-window rate limiter protecting login endpoints:

```typescript
import { rateLimit } from "@/lib/infra-redis";

const clientIp = "192.168.1.100";
const result = await rateLimit(`login:${clientIp}`, 3, 60);

if (!result.allowed) {
  throw new Error(`Too many login attempts. Try again in ${result.resetSec}s`);
}
```

---

### 4. Cache Invalidation (`invalidateCache`)

```typescript
import { invalidateCache } from "@/lib/infra-redis";

// Clear specific model cache (formSpec, inquirySpec, menu)
await invalidateCache("CUSTOMER");

// Invalidate all workbench cache keys (cbs:*)
await invalidateCache();
```

---

## 🛠️ Cache Inspection & Diagnostics

The project provides dedicated diagnostic scripts to inspect or clear the active Redis cache without leaving your terminal:

```bash
# View all cached keys, TTLs, and JSON payloads:
pnpm cache:inspect

# Flush all namespaced CBS cache keys:
pnpm cache:clear
```

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Caching & Circuit Breaker Engine: **SEALED**
Connection pooling, single-flight collapse, circuit breaker trips, and session serialization are finalized and sealed.

### 2. Cache Keys & TTLs: **SCALABLE**
When caching new entities:
- Add canonical cache key patterns to `appConfig.redis.cacheKeys` in `src/lib/core-config/server.ts`.
- Set custom TTLs per entity using the `ttlSeconds` parameter in `getOrSet()`.

---

## 🧪 Verification

Run the infrastructure verification suite:
```bash
pnpm verify:services
```

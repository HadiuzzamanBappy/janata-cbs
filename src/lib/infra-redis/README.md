# ⚡ CBS Infrastructure: Redis Caching & Session Engine (`@/lib/infra-redis`)

A resilient, server-only caching, session persistence, and rate-limiting subsystem designed for the **Janata Core Banking Workbench**.

It accelerates repetitive core banking metadata lookups (compiled form specifications, inquiry layouts, branch catalogs, and navigation menus) while providing a high-availability session store protected by an automatic **circuit breaker** and **single-flight concurrency deduplication**.

---

## 📦 What It Contains

```text
src/lib/infra-redis/
├── client.ts       # ioredis connection pool, circuit breaker (open/closed/cooldown), and atomic key operations
├── cache.ts        # Read-through cache API (getOrSet), single-flight request collapse, and wildcard cache invalidation
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
- The first request triggers the database/gRPC fetch or compiler.
- All subsequent concurrent requests for the same key are attached to the **same in-flight Promise**.
- Only 1 compilation or query hits the backend, resolving simultaneously for all callers.

### 3. Non-Blocking Pattern Deletions

Invalidations never run the blocking `KEYS *` command. Instead, `cacheDelete()` runs cursor-based `SCAN ... COUNT 200` to delete keys in safe micro-batches.

### 4. Wildcard Form Specification Invalidation (`spec:form:*`)

When a developer saves or authorizes changes in **Model Config** (`SC.MODEL.CONFIG`) or **Form Config** (`SC.FORM.CONFIG`):
- `/api/proxy` automatically calls `invalidateCache(targetModel)`.
- It deletes wildcard pattern matches:
  - Form specifications: `cbs:spec:form:${MODEL}*`
  - Inquiry specifications: `cbs:spec:inq:${MODEL}*`
  - Menu catalog items: `cbs:menu:${MODEL}`
- Tellers and operators receive the freshly compiled form immediately without server restarts or manual cache purges.

---

## 🏛️ Invalidation Flow in the Master Form Architecture

```
┌────────────────────────────────────────────────────────┐
│             Model Config / Form Config Save            │
│         (Maker commits change or Checker authorizes)   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                 /api/proxy Route Handler               │
│                                                        │
│   Detects mutation on MODEL.CONFIG or FORM.CONFIG      │
│   targetModel = payload.targetModel || payload.tableName│
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             invalidateCache(targetModel)               │
│                                                        │
│   Scans and purges:                                    │
│   • cbs:spec:form:COLLATERAL*                          │
│   • cbs:spec:inq:COLLATERAL*                           │
│   • cbs:menu:COLLATERAL                                │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Operator Opens Runtime Form              │
│                                                        │
│   getOrSet() experiences clean cache-miss              │
│   compileFormSpec() compiles the fresh active model     │
│   and re-caches with TTL                               │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Use

### 1. Read-Through Caching (`getOrSet`)

Used in backend services and API routes to cache compiled form specifications and inquiries:

```typescript
import { getOrSet } from "@/lib/infra-redis";
import { compileFormSpec } from "@/lib/cbs-form-spec";

// Fetches from Redis cache if available; otherwise compiles and caches result
const compiledSpec = await getOrSet(
  `spec:form:${commandCode}`,
  async () => {
    const [model, formLayout] = await Promise.all([
      fetchModelFromBackend(commandCode),
      fetchLayoutFromBackend(commandCode),
    ]);
    return compileFormSpec(model, formLayout);
  },
  3600, // TTL in seconds (1 hour)
);
```

---

### 2. Wildcard Cache Invalidation (`invalidateCache`)

```typescript
import { invalidateCache } from "@/lib/infra-redis";

// 1. Invalidate all form specs, inquiries, and menus for a specific model:
await invalidateCache("COLLATERAL");

// 2. Invalidate all CBS namespaced cache keys (cbs:*):
await invalidateCache();
```

---

### 3. Managing Server Sessions (`session.ts`)

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

### 4. Login Rate Limiting (`rateLimit`)

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

## 🛠️ Cache Inspection & Diagnostics

Use the built-in terminal scripts to inspect or clear the active Redis cache:

```bash
# View all cached keys, TTLs, and JSON payloads:
pnpm cache:inspect

# Flush all namespaced CBS cache keys:
pnpm cache:clear
```

---

## 🔒 Architectural State: Scalable or Sealed?

- **Caching & Circuit Breaker Engine: SEALED**
  Connection pooling, single-flight collapse, circuit breaker trips, and session serialization are finalized and sealed.
- **Cache Keys & TTLs: SCALABLE**
  When caching new entities:
  - Add canonical cache key patterns to `appConfig.redis.cacheKeys` in `src/lib/core-config/server.ts`.
  - Set custom TTLs per entity using the `ttlSeconds` parameter in `getOrSet()`.

---

## 🧪 Verification

Run the infrastructure verification suite:

```bash
pnpm verify:services
```

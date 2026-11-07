# ⚡ CBS Infrastructure: Redis Caching & Session Engine (`@/lib/infra-redis`)

A resilient, server-only caching, session persistence, and rate-limiting subsystem designed for the **Janata Core Banking Workbench**.

It accelerates repetitive core banking metadata lookups (compiled form specifications, inquiry layouts, branch catalogs, and navigation menus) while providing a high-availability session store protected by an automatic **circuit breaker** and **single-flight concurrency deduplication**.

---

## 📦 What It Contains

```text
src/lib/infra-redis/
├── client.ts       # ioredis connection pool, circuit breaker (open/closed/cooldown), and atomic key operations
├── cache.ts        # Read-through cache API (getOrSet), single-flight request collapse, descriptor resolver, and auto-invalidation
├── session.ts      # Server-side session lifecycle (create, read, patch, branch update, initLogin reset, destroy) with inactivity guard
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

### 4. Specification & Catalog Auto-Invalidation (`autoInvalidateOnMutation`)

When a developer or supervisor saves or authorizes changes in **Model Config** (`SC.MODEL.CONFIG`), **Form Config** (`SC.FORM.CONFIG`), or **Menu Designer** (`SC.MENU.TREE`):

- `/api/proxy` automatically executes `autoInvalidateOnMutation(envelope)`.
- It deletes wildcard pattern matches:
  - Form specifications: `cbs:spec:${MODEL}*`
  - Inquiry specifications: `cbs:spec:enq:${MODEL}*`
  - Menu catalog items: `cbs:menu:${MODEL}`
- Tellers and operators receive the freshly updated layout or catalog immediately without server restarts or manual cache purges.

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
│   Detects mutation (PUT, AUT, I, A) on CONFIG tables   │
│   autoInvalidateOnMutation() resolves targetModel      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             invalidateCache(targetModel)               │
│                                                        │
│   Scans and purges:                                    │
│   • cbs:spec:ACCOUNT*                                  │
│   • cbs:spec:enq:ACCOUNT*                              │
│   • cbs:menu:ACCOUNT                                   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│               Operator Opens Runtime Form              │
│                                                        │
│   getOrSet() experiences clean cache-miss              │
│   Backend retrieves fresh schema from CBS core         │
│   and re-caches with TTL                               │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Use

### 1. Read-Through Caching (`getOrSet`)

Used in backend services and API routes to cache compiled form specifications, menus, and inquiries:

```typescript
import { getOrSet } from "@/lib/infra-redis";

// Fetches from Redis cache if available; otherwise executes fetcher and caches result
const compiledSpec = await getOrSet(
  "spec:ACCOUNT",
  async () => fetchModelFromBackend("ACCOUNT"),
  3600, // TTL in seconds (1 hour)
);
```

---

### 2. Resolving Cache Descriptors (`resolveCacheDescriptor`)

Transparently detects read operations on cacheable metadata entities and maps them to canonical Redis keys and TTLs:

```typescript
import { resolveCacheDescriptor } from "@/lib/infra-redis";

const desc = resolveCacheDescriptor({
  requestType: "GFC",
  controlName: "CONFIG.FORM",
  recordId: "ACCOUNT",
});

if (desc) {
  console.log(desc.key); // "spec:ACCOUNT"
  console.log(desc.ttl); // 3600
}
```

---

### 3. Wildcard Cache Invalidation (`invalidateCache`)

```typescript
import { invalidateCache } from "@/lib/infra-redis";

// 1. Invalidate all form specs, inquiries, and menus for a specific model:
await invalidateCache("ACCOUNT");

// 2. Invalidate all CBS namespaced cache keys (cbs:*):
await invalidateCache();
```

---

### 4. Managing Server Sessions (`session.ts`)

Encapsulates user session state behind secure, HTTP-only cookie IDs (`sid`):

```typescript
import {
  createSession,
  getSession,
  updateBranchCodeAndName,
  clearInitialLoginRequirement,
  destroySession,
} from "@/lib/infra-redis";

// 1. On Login:
const sessionId = await createSession({
  userId: "AD028459",
  token: "jwt-token-string",
  currUser: {
    userId: "AD028459",
    fullName: "Senior Officer",
    branchCode: "JB0001",
    branchName: "Corporate Branch",
    txnDate: "2026-11-02",
    userRole: ["USER"],
    accessibility: "RIDASHL",
    isLoggedIn: true,
    commandLine: true,
    initLogin: false,
    userStatus: 1,
  },
});

// 2. In API Route / Server Action:
const session = await getSession();
if (!session) {
  throw new Error("UNAUTHORIZED");
}
console.log(session.currUser.fullName);

// 3. On Branch Roaming:
await updateBranchCodeAndName("JB0101", "Principal Branch");

// 4. On First-Time Password Reset:
await clearInitialLoginRequirement();

// 5. On Logout:
await destroySession();
```

---

### 5. Login Rate Limiting (`rateLimit`)

Fixed-window rate limiter protecting login endpoints:

```typescript
import { rateLimit } from "@/lib/infra-redis";

const clientIp = "192.168.1.100";
const result = await rateLimit(`login:${clientIp}:USER01`, 5, 60);

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

Run the infrastructure verification suites:

```bash
pnpm verify:services
pnpm verify:config
```

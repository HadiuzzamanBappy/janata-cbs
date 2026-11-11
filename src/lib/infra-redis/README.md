# ⚡ CBS Infrastructure: Redis Caching & Session Engine (`@/lib/infra-redis`)

A resilient, server-only caching, session persistence, and rate-limiting subsystem designed for the **Janata Core Banking Workbench**.

It accelerates repetitive core banking metadata lookups (compiled form specifications, inquiry layouts, branch catalogs, and navigation menus) while providing a high-availability session store protected by an automatic **circuit breaker** and **single-flight concurrency deduplication**.

---

## 📦 Subsystem Architecture

```text
src/lib/infra-redis/
├── client.ts       # ioredis connection pool, circuit breaker (open/closed/cooldown), atomic key operations
├── cache.ts        # Declarative domain spec cache policies, single-flight collapse, read-through API, auto-invalidation
├── session.ts      # Server session lifecycle (create, read, patch, branch update, initLogin reset, destroy) with inactivity guard
├── rate-limit.ts   # Fixed-window Redis pipeline rate limiter for login brute-force prevention
└── index.ts        # Server-only barrel exports ('server-only')
```

---

## 🏛️ Domain-Driven Caching Architecture

### 1. Specification & Metadata Caching Principles

To preserve absolute banking data integrity:

- **Dynamic operations, customer balances, transactions, and searches (`SBI`, `GRL`, `INQ`, `LIST`) are NEVER cached.**
- **Only immutable/semi-static specifications are cached** under canonical `CbsControlTable` domain policies:
  - `FORM_CONFIG` (`FORM.CONFIG`): Dynamic form layouts $\to$ `cbs:spec:form:<ID>`
  - `MODEL_CONFIG` (`MODEL.CONFIG`): Data model schemas $\to$ `cbs:spec:model:<ID>`
  - `INQUIRY_CONFIG` (`INQUIRY.CONFIG`): Tabular inquiry definitions $\to$ `cbs:spec:enq:<ID>`
  - `MENU_TREE` / `MENU` (`MENU.TREE`, `MENU`): Navigation trees $\to$ `cbs:menu:<TARGET>` / `cbs:menu:user:<USER_ID>`

### 2. Dual-Protocol Design (gRPC Today, REST-Ready Tomorrow)

Cache keys and policies resolve from **domain identity (`controlName` and canonical read verb `recordFunction: "S"`)**:

- **Today (gRPC)**: Wire verbs like `GFC`, `GMC`, and `GUM` are normalized to canonical `CbsControlTable` identities.
- **Tomorrow (REST)**: Standard HTTP `GET /api/proxy?controlName=FORM.CONFIG&recordId=ACCOUNT` with `recordFunction: "S"` matches the exact same domain policy with **zero code modifications**.

---

## 🛡️ Resilience & Production Engineering

### 1. Circuit Breaker ("Fail-Open" Resilience)

If Redis is unreachable or crashes during operation:

- The error trips the circuit breaker (`tripCircuit()`).
- During the cooldown window (`serverConfig.redis.cooldownMs` = 5,000ms), all cache operations **fail open** without throwing errors or halting the banking operator.
- Sessions automatically fall back to the in-memory `Map` (`__memorySessionStore`).
- The entire workbench remains 100% operational with zero Redis dependencies.

### 2. Single-Flight Concurrency Deduplication (`singleFlight`)

Prevents **cache stampedes ("thundering herd")** when 50+ tellers open the same form simultaneously on a cold morning:

- The first request initiates the database/gRPC fetch or compiler.
- All subsequent concurrent requests for the same key attach to the **same in-flight Promise**.
- Exactly 1 compilation or query hits the backend, resolving simultaneously for all callers.

### 3. Non-Blocking Pattern Deletions

Cache invalidation avoids blocking Redis with `KEYS *`. Instead, `cacheDelete()` runs cursor-based `SCAN ... COUNT 200` to delete matching keys in safe micro-batches.

### 4. Specification & Catalog Auto-Invalidation (`autoInvalidateOnMutation`)

When a developer or supervisor saves or authorizes changes in **Model Config** (`MODEL.CONFIG`), **Form Config** (`FORM.CONFIG`), **Inquiry Config** (`INQUIRY.CONFIG`), or **Menu Designer** (`MENU.TREE`):

- `/api/proxy` automatically executes `autoInvalidateOnMutation(envelope)`.
- Mutations (`PUT`, `AUT`, `DEL`, `REV`, `SMC`, `AMC`, `SFC`, `SMR`, `DTR`) trigger invalidation of the target model:
  - Form specifications: `cbs:spec:form:${TARGET}*`
  - Model specifications: `cbs:spec:model:${TARGET}*`
  - Inquiry specifications: `cbs:spec:enq:${TARGET}*`
  - Menu catalogs & user trees: `cbs:menu:${TARGET}*`, `cbs:menu:user*`
- Read sequence operations (such as `GNI` / Get New ID) are strictly ignored to prevent false eviction.
- Tellers receive updated layouts or menus immediately on their next form open.

---

## 🚀 API Reference

### 1. Read-Through Caching (`getOrSet`)

```typescript
import { getOrSet } from "@/lib/infra-redis";

// Fetches from Redis cache if available; otherwise executes fetcher and caches result
const compiledSpec = await getOrSet(
  "spec:form:ACCOUNT",
  async () => fetchFormFromBackend("ACCOUNT"),
  86400, // TTL in seconds (24 hours)
);
```

### 2. Resolving Cache Descriptors (`resolveCacheDescriptor`)

```typescript
import { resolveCacheDescriptor } from "@/lib/infra-redis";

const desc = resolveCacheDescriptor({
  requestType: "GET",
  controlName: "FORM.CONFIG",
  recordFunction: "S",
  recordId: "ACCOUNT",
});

if (desc) {
  console.log(desc.key); // "spec:form:ACCOUNT"
  console.log(desc.ttl); // 86400
}
```

### 3. Wildcard Cache Invalidation (`invalidateCache`)

```typescript
import { invalidateCache } from "@/lib/infra-redis";

// 1. Invalidate all form specs, inquiries, and menus for a specific model:
await invalidateCache("ACCOUNT");

// 2. Invalidate all CBS namespaced cache keys (cbs:*):
await invalidateCache();
```

### 4. Managing Server Sessions (`session.ts`)

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

// 2. Read Active Session:
const session = await getSession();

// 3. Branch Roaming:
await updateBranchCodeAndName("JB0101", "Principal Branch");

// 4. Clear First-Time Login:
await clearInitialLoginRequirement();

// 5. Logout:
await destroySession();
```

### 5. Login Rate Limiting (`rateLimit`)

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

## 🧪 Verification

Run the full CBS verification harness:

```bash
pnpm verify:all
```

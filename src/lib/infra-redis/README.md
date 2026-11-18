# ⚡ CBS Infrastructure: Redis Cache, Sessions & Rate Limit (`@/lib/infra-redis`)

Layer L1, server only (`import "server-only"`). It caches the core's semi-static specs (form, model and inquiry configs and menus), stores the operator's session behind an opaque HTTP-only cookie, and rate-limits login. It's independent of `DATA_SOURCE`: the mock and the live core are cached the same way. With `CACHE_ENABLED=false`, or while Redis is down, every part keeps working on per-process memory, and it switches back to Redis automatically when Redis returns.

---

## 📦 Files

| File            | Contents                                                                                                                                                                                                                                                                                                 |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client.ts`     | `ioredis` client, circuit breaker (`circuitOpen`, `tripCircuit`, `resetCircuit`), namespaced keys (`cacheKey`, `SPEC_CACHE_PATTERNS`), `cacheRead` (value / `null` absent / `undefined` unavailable), `cacheGet`, `cacheSet` (returns success), `cacheDelete` (pattern deletes use `SCAN`, never `KEYS`) |
| `cache.ts`      | Cache policies (`resolveCacheDescriptor`), read-through cache with request collapsing (`getOrSet`), invalidation (`invalidateCache`, `autoInvalidateOnMutation`)                                                                                                                                         |
| `session.ts`    | Session lifecycle: `createSession`, `getSession`, `getFromSession`, `updateSession`, `updateBranchCodeAndName`, `clearInitialLoginRequirement`, `destroySession`                                                                                                                                         |
| `rate-limit.ts` | `rateLimit(key)` / `clearRateLimit(key)`: fixed-window counter used by `/api/login`, keyed on the sign-on name                                                                                                                                                                                           |

All key names and TTLs come from `serverConfig.redis` in `@/lib/core-config/server`. Every key is prefixed with `REDIS_KEY_PREFIX` (default `cbs`).

---

## 🏛️ What is cached

`/api/proxy` calls `resolveCacheDescriptor()` for every request. It returns a key only for a **plain read of a spec**:

| Control (`CbsControlTable`)   | Key                                                      | TTL                       |
| ----------------------------- | -------------------------------------------------------- | ------------------------- |
| `CONFIG.FORM` (`FORM_CONFIG`) | `spec:form:<ID>`                                         | `SPEC_TTL_SECONDS` (3600) |
| `MODEL.CONFIG`                | `spec:model:<ID>`                                        | `SPEC_TTL_SECONDS`        |
| `INQUIRY` (`INQUIRY_CONFIG`)  | `spec:enq:<ID>`                                          | `SPEC_TTL_SECONDS`        |
| `MENU.TREE`, `MENU`           | `menu:<ID>`, or `menu:user:<userId>` when there is no ID | `MENU_TTL_SECONDS` (600)  |

Everything else returns `null` and goes straight to the core:

- mutations (`isCbsMutationRequest()`), lists (`L`), `INQ`, `SBI` and `GRL`, so balances, transactions and searches are never cached
- **maintenance reads** (record function `I`, `A`, `H`, `R` or `D`). These can return the pending (unauthorized) copy of a record, and the cache key doesn't include the record function, so caching them would leak drafts into normal `S` reads.

---

## 🔁 Invalidation

After every request that succeeds, `/api/proxy` calls `autoInvalidateOnMutation(envelope)`. It does nothing unless **both** of these are true:

1. the control is one of the cached configs above, and
2. the request is a mutation: `isCbsMutationRequest()`, or record function `I`, `A`, `D` or `R`. `GNI` (get new ID) is always ignored.

It then finds the target ID from the payload (`TABLENAME`, `formId`, `inquiryId` or `targetModel`, or else `recordId`), and `invalidateCache(id)` deletes that ID's form, model, inquiry and menu keys plus every user menu. The next screen that opens gets the new spec.

You can also invalidate by hand: `DELETE /api/cache` (header `x-cache-token`; the endpoint is **disabled** unless `CACHE_INVALIDATE_TOKEN` is set, and the token is compared in constant time), or `pnpm cache:clear` from a terminal. "Clear all" deletes only `spec:*` and `menu:*` (`SPEC_CACHE_PATTERNS`), never sessions or rate-limit counters, so it never signs anyone out. `pnpm cache:inspect` lists the cached keys.

When Redis reconnects after an outage, the client flushes `spec:*` and `menu:*` once: a config saved during the outage couldn't invalidate its old spec.

---

## 🛡️ Resilience rules

1. **Fail open.** A Redis error trips the circuit for `CACHE_COOLDOWN_MS` (5000). While the circuit is open, the cache is skipped and requests go straight to the core; nothing throws.
2. **One fetch per cold key.** `getOrSet()` collapses concurrent misses on the same key into one fetch, and every caller gets that result. Only values that pass `shouldCache` (default: not `null`) are stored.
3. **Redis is the source of truth for sessions whenever it's reachable.** A Redis miss means the session is gone (logged out, superseded or expired), so a copy elsewhere can never revive it. Memory holds only what Redis couldn't store (cache disabled or Redis down); such sessions move back to Redis on their first read after recovery, and expired memory entries are pruned on write. Memory sessions are lost on restart and aren't shared between instances. A user has one active session at a time; signing on elsewhere ends the older one.
4. **The rate limiter never fails open.** The window starts at the first attempt (`SET … EX NX`; retries don't extend it), it's keyed on the normalized sign-on name (not the client-supplied `X-Forwarded-For`), and it's cleared after a successful login. While Redis is unavailable, it counts in process memory (per instance).

---

## 🚀 Usage

How `/api/proxy` uses the cache:

```typescript
import { isApiSuccess } from "@/lib/data-schemas";
import { autoInvalidateOnMutation, getOrSet, resolveCacheDescriptor } from "@/lib/infra-redis";

const dispatchDecoded = async () =>
  decodeResponse(envelope.requestType, await dispatch(envelope, token));
const cacheDesc = resolveCacheDescriptor(envelope); // null when the request must not be cached
const response = cacheDesc
  ? await getOrSet(cacheDesc.key, dispatchDecoded, cacheDesc.ttl, isApiSuccess) // failures are never cached
  : await dispatchDecoded();

if (isApiSuccess(response)) await autoInvalidateOnMutation(envelope);
```

Reading the session in a route or server component:

```typescript
import { getSession } from "@/lib/infra-redis";

const session = await getSession(); // null when signed out
if (!session) redirect(clientConfig.routes.login);
```

---

## 🧪 Verification

```bash
pnpm verify:redis
```

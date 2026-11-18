# ⚡ CBS Infrastructure: Redis Cache, Sessions & Rate Limit (`@/lib/infra-redis`)

Layer L1, server only (`import "server-only"`). It caches the core's semi-static specs (form, model and inquiry configs and menus), stores the operator's session behind an opaque HTTP-only cookie, and rate-limits login. If Redis is down, every part keeps working: a circuit breaker makes the cache fail open, and sessions fall back to an in-memory store.

---

## 📦 Files

| File            | Contents                                                                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `client.ts`     | `ioredis` client, circuit breaker (`circuitOpen`, `tripCircuit`, `resetCircuit`), namespaced keys (`cacheKey`) and `cacheGet` / `cacheSet` / `cacheDelete` (pattern deletes use `SCAN`, never `KEYS`) |
| `cache.ts`      | Cache policies (`resolveCacheDescriptor`), read-through cache with request collapsing (`getOrSet`), invalidation (`invalidateCache`, `autoInvalidateOnMutation`)                                      |
| `session.ts`    | Session lifecycle: `createSession`, `getSession`, `getFromSession`, `updateSession`, `updateBranchCodeAndName`, `clearInitialLoginRequirement`, `destroySession`                                      |
| `rate-limit.ts` | `rateLimit(key)`: fixed-window counter, used by `/api/login`                                                                                                                                          |

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

You can also invalidate by hand: `DELETE /api/cache` (guarded by `CACHE_INVALIDATE_TOKEN`), or `pnpm cache:clear` from a terminal. `pnpm cache:inspect` lists the cached keys.

---

## 🛡️ Resilience rules

1. **Fail open.** A Redis error trips the circuit for `CACHE_COOLDOWN_MS` (5000). While the circuit is open, the cache is skipped and requests go straight to the core; nothing throws.
2. **One fetch per cold key.** `getOrSet()` collapses concurrent misses on the same key into one fetch, and every caller gets that result. Only values that pass `shouldCache` (default: not `null`) are stored.
3. **Sessions survive Redis outages.** `getSession()` falls back to an in-memory store in the server process when Redis doesn't return the session. That store is lost on restart and is not shared between server instances. A user has one active session at a time; signing on elsewhere ends the older one.
4. **The rate limiter also fails open.** When Redis is unavailable, `rateLimit()` allows the request. Login brute-force protection therefore depends on Redis being up.

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

# Production Operations

What to configure before go-live, and what to do after it: clearing the spec cache through the API, handling a Redis outage, unlocking a user, adding a microservice, and checking a release. Every command here exists in the repository; nothing on this page needs a code change.

---

## 1. Production settings

Set these in the server environment (never commit real values):

| Variable                  | Production value                           | Why                                                                                                                 |
| ------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `DATA_SOURCE`             | `grpc`                                     | Live Java core at `GRPC_HOST`. `static` is the offline mock.                                                        |
| `CACHE_ENABLED`           | `true`                                     | Sessions, login limits and the spec cache live in Redis, so they survive restarts and are shared between instances. |
| `REDIS_URL`               | your Redis                                 | Required when the cache is on.                                                                                      |
| `CACHE_INVALIDATE_TOKEN`  | long random value (`openssl rand -hex 32`) | Enables `DELETE /api/cache`. Empty = the endpoint is disabled.                                                      |
| `USE_HTTPS`               | `true` if users reach the app over HTTPS   | Marks the session cookie `Secure`. Leave `false` only on plain-HTTP networks.                                       |
| `LOGIN_LIMIT`             | for example `5`                            | Failed sign-on attempts allowed per sign-on name per 60 s.                                                          |
| `NEXT_PUBLIC_LOGOUT_TIME` | minutes, for example `10`                  | Idle sign-out; the server session lasts one minute longer.                                                          |
| `LOG_LEVEL`               | `info` or `warn`                           | Logs are JSON lines on stdout / stderr in production; PII is masked.                                                |
| `SERVICE_<NAME>_URL`      | one per microservice (see §6)              | Routes requests whose `servicePath` is NAME. Without it, those requests fail with `503`.                            |

> [!IMPORTANT]
> Run **one** instance if Redis is optional for you. With several instances behind a load balancer, Redis must be up: without it, sessions exist only in the instance that created them.

---

## 2. Clearing the spec cache (API endpoint)

The app caches form, model and inquiry configs for `SPEC_TTL_SECONDS` (default 1 h) and menus for `MENU_TTL_SECONDS` (default 10 min).

**You don't need to clear it** after saving a config in the app's own designers (`SC.FORM.CONFIG`, `SC.MODEL.CONFIG`, `SC.INQUIRY.CONFIG`, `SC.MENU.DESIGN`), which invalidate automatically, or after a Redis outage, because the app flushes specs when Redis reconnects.

**Clear it** when a config or menu was changed **directly in the Java core**, so operators see the change before the TTL runs out.

```bash
# One screen/model (ID prefix): its form, model, inquiry and menu keys + every user menu
curl -X DELETE "https://<host>/api/cache?control=ACCOUNT" -H "x-cache-token: $CACHE_INVALIDATE_TOKEN"

# Everything cached: every spec and menu key
curl -X DELETE "https://<host>/api/cache" -H "x-cache-token: $CACHE_INVALIDATE_TOKEN"
```

PowerShell: `Invoke-RestMethod -Method Delete -Uri "https://<host>/api/cache?control=ACCOUNT" -Headers @{ "x-cache-token" = $env:CACHE_INVALIDATE_TOKEN }`

| Response                     | Meaning                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| `200` `{ removed, control }` | Done. `removed` is the number of keys deleted (`0` is normal if nothing was cached). |
| `401`                        | Wrong or missing `x-cache-token`.                                                    |
| `403`                        | The endpoint is disabled: `CACHE_INVALIDATE_TOKEN` isn't set.                        |
| `400`                        | Invalid `control` (empty, or longer than 64 characters).                             |

Clearing **never** signs anyone out: it deletes only `spec:*` and `menu:*`, never sessions (`sess:`, `user:sess:`) or login counters (`rl:`). Every call is logged with the caller's IP.

From a shell with dev dependencies installed (the `cache:*` scripts run through `tsx`, a dev dependency) and `REDIS_URL` / `REDIS_KEY_PREFIX` exported: `pnpm cache:clear` does the same as "everything". `pnpm cache:inspect` lists **all** keys, sessions included, so treat its output as sensitive. On a production install without dev dependencies, use the API endpoint above or `redis-cli`.

---

## 3. When Redis is down

Nothing breaks for operators. What changes:

|             | Redis up                               | Redis down                                                                             |
| ----------- | -------------------------------------- | -------------------------------------------------------------------------------------- |
| Screens     | specs served from cache                | every spec read goes to the core (slower, still correct)                               |
| Sessions    | in Redis, shared by all instances      | in the memory of the instance that handled the sign-on; lost if that instance restarts |
| Login limit | shared counter in Redis                | per-instance counter in memory                                                         |
| Logs        | `[REDIS] Redis connected successfully` | one `[REDIS] Redis unavailable, failing open: …` warning                               |

Recovery is automatic: when Redis reconnects, sessions created during the outage move back to Redis on their next request, and stale specs are flushed. Nothing to restart.

There is no health endpoint. Monitor Redis itself, and alert on the `Redis unavailable` log line.

---

## 4. A user is locked out after failed sign-ons

The block lasts 60 seconds from the first failed attempt, and the sign-on page shows the remaining time (`429`, `Retry-After`). A successful sign-on resets the counter. To unlock at once (Redis up):

```bash
redis-cli DEL "cbs:rl:login:<SIGN-ON NAME IN UPPERCASE>"   # "cbs" = REDIS_KEY_PREFIX
redis-cli DEL "cbs:rl:cpw:<USER ID>"                      # password-change attempts (same 60 s rule)
```

With Redis down the counter is in the app's memory, so wait out the 60 seconds.

Repeated lockouts of the same sign-on name can mean someone is guessing that user's password: check the `AUTH_API` warnings for the source IPs.

---

## 5. Rotating the cache token

1. Generate a new value and set `CACHE_INVALIDATE_TOKEN` in the server environment.
2. Restart the app (configuration is read at start-up).
3. Update whatever calls `DELETE /api/cache` (scripts, CI jobs).

---

## 6. Adding a microservice

A request goes to the service named by its `servicePath` (from the model, form or inquiry config). Empty or `default` is the core at `GRPC_HOST`. For any other service, set one line and restart:

```env
# NAME = jar name = DB servicePath (letters and digits, any case)
SERVICE_FINXURM_URL=http://localhost:8282/finxurm/inq   # http(s)://  → REST: same flat request, JSON POST, Bearer token
SERVICE_FINXLOAN_URL=localhost:8383                     # host:port   → gRPC: same contract as the core
```

At start-up the log shows the routing table: `[GRPC] Services: default → grpc 172.18.18.66:50055, finxurm → rest http://localhost:8282/finxurm/inq`.

| Symptom                                                                                       | Cause                                                                            |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| The app doesn't start: `SERVICE_X is not recognised; use SERVICE_<NAME>_URL`                  | A leftover or misspelled key, for example the retired `SERVICE_URM_BASE_URL`     |
| The app doesn't start: `must be host:port (gRPC) or a full http(s):// endpoint URL`           | A bad address, such as a missing port or scheme                                  |
| Screen error `Service "finxurm" is not available` (503) and a `No route for service` log line | No `SERVICE_FINXURM_URL` line                                                    |
| `Service "finxurm" is unreachable` (503) or `timed out` (504)                                 | The jar is down, or slower than `GRPC_TIMEOUT_MS`                                |
| `returned HTTP … without a CBS response` (502)                                                | The jar answered, but not with the CBS envelope (`status`, `statusCode`, `data`) |

Login always goes to the core. Spec reads (forms, models, inquiries) from a microservice are not cached.

---

## 7. Checking a release

- Before deploying: `pnpm lint`, `pnpm typecheck`, `pnpm verify:all` and `pnpm build`.
- Against a staging core, with the app running on that machine and dev dependencies installed: `pnpm verify:api`. It signs on with `TEST_USERNAME` / `TEST_PASSWORD`, calls the core directly, and probes `http://localhost:3000/api/proxy`.
- By hand: sign on, open a form and an inquiry, pop a screen out and dock it back, and sign on as a record's inputter to confirm Authorize is disabled with the Four-Eyes tooltip.

Known limits (server-side Four-Eyes, core menu items this app can't open yet) are listed in the [Architecture & Security Audit Checklist](ARCHITECTURE_AUDIT_CHECKLIST.md) and the `cbs-command-and-navigation` skill.

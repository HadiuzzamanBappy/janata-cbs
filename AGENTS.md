<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Janata CBS Workbench — Agent Guide

A production core-banking frontend + BFF: Next.js 16 (App Router), React 19, Tailwind v4, Biome, Zustand, TanStack Query, Zod. The browser reaches the Java core only through `/api/proxy`, never gRPC or Redis.

## 0. How to work here

- **Smallest safe change.** Fix what was asked; don't refactor around it. Justify every new file. Before writing:
  1. **Does it need to exist?** Skip anything not asked for, and name what you skipped in one line.
  2. **Map the reach**: grep every caller of what you touch, plus fixtures, `mock/`, config, docs and the three compatibility boundaries (§1).
  3. **Reuse before writing**: an existing `src/lib` unit or component, then the platform, then an installed dependency. Never add a dependency for a few lines.
  4. **Fix the root cause once**, in shared code (the compiler, engine or `src/lib` unit), never per caller or per screen.
  5. **Moved or merged code keeps its validation and error handling.**
  6. **New logic that isn't trivial gets a test**: propose a case for the matching `verify:*` suite (suites need the owner, see below), never an ad-hoc assert or a new test framework.
- **Never commit or push** unless the owner asks. Leave changes in the working tree for review.
- **Commit message**: one line, `type(scope):short lowercase summary` (no space after the colon), matching `git log`, for example `fix(auth):redis sessions safe rate limits and server checked branch`. No body, no `Co-Authored-By` or AI attribution trailer.
- **Before amending or rewriting history**, check `git reflog`: the owner may have reset or committed in between. Never amend a commit you didn't make.
- **Stop and ask** before touching a compatibility boundary (§1), weakening a security check, or changing a `verify:*` suite.
- **Report honestly**: say what you verified, what you couldn't (for example, no live core), and what is left.

## 1. Quality gates (every task)

`pnpm lint:fix`, `pnpm typecheck` and `pnpm verify:all` (or the `verify:*` suite for each module you changed). All must be clean. There is no CI, so these gates are the only check before production.

Before saving any file:

- **DRY**: delegate to `src/lib` (access → `@/lib/cbs-access`, dirty → `@/lib/cbs-record`, hotkeys → `@/lib/cbs-hotkeys`).
- **Zero legacy in code**: no shims, deprecated aliases or dual params (`?id=`).
- **No dead code**: delete unused exports, imports, props, branches and files in the same change.
- **Logging**: `logger` from `@/lib/core-logger` (it masks PII), never `console.*`. Biome's `noConsole` enforces this; only `core-logger` and `scripts/` are exempt.
- **Production compatibility**: persisted browser data (`WorkbenchTab`, session, popup drafts), the core wire contract (`proto/service.proto`, request types, control and field names) and operator-facing commands, aliases and `/screen/...` URLs must stay compatible or ship a migration. **Flag any change to them to the owner.**
- **No magic strings**: enums from `@/types` (`CbsRecordFunction`, `CbsRecordStatus`, `CbsRequestType`, `CbsControlTable`, `CBS_SCREEN_MODES`, `CBS_IDLE_MODE`); routes and keys from `clientConfig`.
- **No fake IDs**: never `Date.now()`; record IDs come from input or the core (`GNI`).
- **Size budget**: components ≤ 300 lines (350 if cohesive); hooks, helpers and stores ≤ 250 (280). Split along real responsibilities only.

## 2. Commands

```bash
pnpm dev                # dev server
pnpm build              # production build
pnpm lint               # Biome check only (no writes)
pnpm lint:fix           # Biome format + safe fixes
pnpm typecheck          # tsc --noEmit
pnpm proto:gen          # regenerate src/lib/infra-grpc/generated/ (never hand-edit)
pnpm ui:add <name>      # add a shadcn/Base UI primitive (never hand-edit src/components/ui/)
pnpm cache:clear        # flush the Redis cache
pnpm cache:inspect      # list cached keys
pnpm fixture:clean      # normalize a mock/db/.rawResponse sample
pnpm knip               # unused files, exports and dependencies (Knip)
pnpm deprecated         # usages of @deprecated symbols (scripts/tools/check-deprecated.ts)
```

Verification suites are standalone `tsx` scripts in `scripts/verify/` (not Jest/Vitest; no per-case filter). Run one directly with `pnpm exec tsx scripts/verify/<file>.ts`.

| Suite              | Covers                                                | Suite            | Covers                                                                            |
| ------------------ | ----------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------- |
| `verify:all`       | the 16 below (no `api`); shows output only on failure | `verify:layers`  | ranks, barrels, client/server boundary (strict, no allowlist)                     |
| `verify:access`    | RIDASHL, Four-Eyes                                    | `verify:command` | grammar, aliases, RBAC                                                            |
| `verify:client`    | payload factories                                     | `verify:record`  | deltas, dirty state                                                               |
| `verify:form-spec` | form compiler                                         | `verify:inquiry` | inquiry spec                                                                      |
| `verify:schemas`   | Zod contracts                                         | `verify:parsers` | wire parsers                                                                      |
| `verify:config`    | env, services                                         | `verify:logger`  | PII redaction                                                                     |
| `verify:utils`     | formatters, storage, IDs                              | `verify:grpc`    | gRPC gateway                                                                      |
| `verify:redis`     | cache, sessions                                       | `verify:mock`    | offline core                                                                      |
| `verify:screen`    | screen, popups                                        | `verify:api`     | **live** core + dev server (`DATA_SOURCE=grpc`); run before shipping wire changes |

## 3. Invariants

1. **Layers**: `app → features → components → hooks → store → lib/cbs-*, core-utils → lib/infra-*, core-config, core-logger, data-parsers → types, data-schemas`. Defined in `LAYERS` (`scripts/verify/verify-layers.ts`). `src/lib` never imports store, hooks, components, features or app; it notifies upward via `registerCommandAdapter` / `notifyUser`. Import units only through `index.ts` (or `server.ts`); some barrels are at sub-feature level (`@/features/operations/forms`).
2. **Server boundary**: `infra-*`, `core-config/server.ts`, `env.ts` and `src/proxy.ts` are `server-only`. Validate everything from outside (route bodies, Server Action args, URL params, cross-window messages) with `data-schemas` + `.safeParse()`. Server Actions are public endpoints.
3. **Four-Eyes**: the inputter never authorizes their own record. Enforced **twice**: the UI disables Authorize (`evaluateCbsAccess`, the reason in a `<Tooltip>`), and the proxy loads the pending record before every authorize and refuses the maker with 403, or any record it can't read or that names no maker (`verifyFourEyes`). Never weaken either check.
4. **Navigation**: screens open only via `cbsCommand.execute("…")` or `data-cbs-command`, never `<Link href="/screen/…">` or `router.push()`.
5. **Mutations**: through `useIdempotentSend().sendMutation()` (adds the required UUIDv4 key). One toast per failure, raised by `cbs.send()`.
6. **Styling**: semantic tokens only (`bg-primary`, `border-border`), no numbered colours; `h-8 text-xs`, 12-column grid, `font-mono` amounts and IDs; `cn()` for classes.
7. **Next.js 16**: `cookies()`, `headers()`, `params` and `searchParams` are Promises; `await` them.

## 4. Architecture map

- **Runtime switches** (`.env.local` from `.env.example`), independent of each other: `DATA_SOURCE=static` uses the in-memory core in `mock/` (`@mock/core`, `@mock/db`; add a table + handler for new offline screens, then `verify:mock`), `grpc` uses `GRPC_HOST`. `CACHE_ENABLED=true` uses Redis at `REDIS_URL` for sessions, login limits and the spec cache. With it off, or with Redis down, those fall back to per-process memory, and Redis takes over again on reconnect. Production: `grpc` + cache on.
- **Request path**: `cbs.send(payload)` → `POST /api/proxy`. The proxy: session (401 / 403 on `initLogin`) → `cbsWirePayloadSchema.safeParse` → `verifyUserRecordAccess` (rights, 403) → save schema for config saves (`SAVE_DATA_SCHEMAS`) → `buildGrpcEnvelope` (user, branch from the session) → checks against the stored record, read fresh (`_lib/record-guards`: Four-Eyes on every authorize, the saved table and columns on a MODEL.CONFIG save) → for INQ, `resolveInquiryEnvelope` (controller, service, fixed selection and branch pin taken from the saved inquiry; the browser sends only the inquiry ID and filter values) → cache (`resolveCacheDescriptor` → `getOrSet`) → `dispatch()` (the core or a `SERVICE_<NAME>_URL` microservice over gRPC or REST, or mock; an unknown service is a 503) → decode once → `autoInvalidateOnMutation`. Other routes: `login`, `logout`, `session`, `change-password`, `cache` (token-guarded). `src/proxy.ts` is the session guard and lets `/screen/*` through for the popup lock screen.
- **Screens**: `resolveScreen()` (`src/features/workbench/registry.tsx`): alias → `BESPOKE_SCREENS` → `INQ` prefix → `OpsInquiry` → otherwise `OpsForm`. Forms and inquiries come from the core's config (`MODEL.CONFIG`, `CONFIG.FORM`, `INQUIRY`), compiled by `lib/cbs-form-spec` / `lib/cbs-inquiry-spec` and drawn by the `cbs-*-engine` components. Fix rendering in the compiler or engine, never per screen. A bespoke screen needs `MASTER_COMMAND_DEFINITIONS` + `BESPOKE_SCREENS`.
- **Workbench**: `panel` mode = tabs in `WorkbenchShell` at `/dashboard`; `window` mode = popups at `/screen/[id]`, rebuilt from URL + staged draft, synced over `BroadcastChannel` (`CBS_SCREEN_MESSAGE`). Only the main shell runs the idle watcher.
- **Stores**: `session`, `workbench`, `alert` (Zustand, per provider) via `CbsAppStoreProvider`, mounted in `WorkbenchShell` and each popup. The theme is next-themes, in `app/layout.tsx`.
- **Docs**: `docs/devs` and `docs/manual` render at `/devs` and `/manual`. Update them when behaviour changes. Each `src/lib` unit and engine has a README.

## 5. Rules & skills (read when the task touches the area)

- `.agents/rules/`: `00-core-pillars` (invariants, compatibility boundaries) · `01-architecture-layers` (ranks, barrels, boundary) · `02-nextjs-and-react19` · `03-cbs-domain-security` (validation, RIDASHL, Four-Eyes) · `04-styling-and-tokens`.
- `.agents/skills/`: `cbs-access-control` · `cbs-client-wire-protocol` · `cbs-command-and-navigation` · `cbs-compact-ui-and-layout` · `cbs-form-and-record-lifecycle` · `cbs-verification-suite` · `documentation-authoring`.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Janata CBS Workbench — a Next.js (App Router, React 19) frontend/BFF for a Java Core Banking System. It renders dynamic, schema-driven banking screens and talks to the Java backend only through a server-side gRPC proxy; the browser never touches gRPC, Redis, or the database directly. See [README.md](README.md) for the full feature/scope description (GMC dynamic forms, RIDASHL permissions, Four-Eyes maker-checker, CBS command gateway, multitab workbench).

## Commands

```bash
pnpm dev              # dev server
pnpm build            # production build
pnpm start            # run production build
pnpm lint             # biome check
pnpm lint:fix         # biome check --write
pnpm format           # biome format --write
pnpm format:check     # biome format, no write
pnpm typecheck        # tsc --noEmit
pnpm ui:add <name>    # add a shadcn/ui primitive

pnpm proto-gen        # regenerate src/lib/infra-grpc/generated from .proto sources

pnpm verify:all       # run every verify:* suite below in sequence
pnpm verify:access    # RIDASHL rights + Four-Eyes (src/lib/cbs-access)
pnpm verify:command   # CBS command grammar/alias/RBAC (src/lib/cbs-command)
pnpm verify:client    # wire request factories (src/lib/cbs-client)
pnpm verify:record    # record status transitions (src/lib/cbs-record)
pnpm verify:matrix    # env config matrix / mock fixtures / wire parsers
pnpm verify:utils     # currency/account-mask/date formatters (src/lib/core-utils)
pnpm verify:services  # infra service layers + mock fallback handlers
pnpm verify:mock      # mock-service dispatch/login/process paths

pnpm cache:clear       # flush Redis cache (scripts/cache-clear.ts, connects directly via env, no app imports)
pnpm cache:inspect     # inspect Redis cache contents
pnpm fixture:clean     # normalize fixtures used by mock/offline mode
```

`verify:*` are **not** a test framework — each is a standalone `tsx` script in `scripts/` using a hand-rolled `assert(name, condition)` logger that prints `[PASS]`/`[FAIL]` and exits non-zero on failure. There is no single-test-by-name runner; run the specific `verify:<module>` script for the area you touched, or read the script to call a narrower function directly.

## Architecture

### Request flow: client → proxy → gRPC/REST → Java core (or mock)

- `src/lib/cbs-client/transport/proxy-client.ts` — client-side fetch wrapper; this is the **only** way client code may reach the backend.
- `src/app/api/proxy/route.ts` — the single BFF endpoint. Validates the session (`getSession()` from `infra-redis`), enforces RIDASHL via `parseAccessibilityRights` for I/A/D/R funcs, resolves branch code (payload → cookie → session → central fallback), builds a `GrpcEnvelope`, and calls `dispatch()`.
- `src/lib/infra-grpc/dispatch.ts` — classifies financial vs. nonfinancial and REST vs. gRPC per `service.protocol`, then routes through `infra-grpc/client.ts` (`grpcProcess`/`loginProcess`, a pooled `GrpcServiceClient` on `globalThis.__grpcClientPool`). Everything here is `import "server-only"`.
- **Offline/static mode**: when `appConfig.dataSource === "static"`, `dispatch()`/`client.ts` short-circuit straight to `@mock/core` (`mock/core`, with `mockDispatch`/`mockProcess`/`mockLogin`). Don't confuse this with `src/lib/infra-services/`, which is a separate set of real-backend REST client wrappers used elsewhere.
- `src/proxy.ts` is **live**: Next.js 16 renamed Middleware to Proxy, so this file is the request middleware (there is intentionally no `middleware.ts`). It does a cookie-presence check only — redirects to login when the session cookie is missing, and destroys the session if the user leaves the forced change-password flow (`initLoginCookie`). Its matcher excludes `/api`, so API routes rely on `getSession()` in the route handler. Real session validation is the server-side `getSession()` redirect in `src/app/(workbench)/dashboard/layout.tsx`.

### Unified screen loader

`resolveScreen()` in [src/features/workbench/registry.tsx](src/features/workbench/registry.tsx) dispatches, in order: (1) `getCanonicalScreenKey()` from `@/lib/cbs-command` resolves aliases against a `BESPOKE_SCREENS` map of hardcoded system screens (menu designer, user groups, report studio, etc.); (2) commands starting with `INQ`/`INQUIRY` render `InquiryScreen`; (3) everything else falls through to the dynamic `FormScreen` (GMC engine). **To add a new bespoke screen you must register it in both `BESPOKE_SCREENS` here and as a canonical command in `src/lib/cbs-command/registry/catalog.ts`** — the alias map is built from that catalog, not from the registry file.

### RIDASHL access & Four-Eyes (`src/lib/cbs-access/`)

`parseAccessibilityRights()` normalizes a raw RIDASHL string/array into `CbsRecordFunction[]`. `evaluateCbsAccess()` is the pure Four-Eyes/status evaluator: authorize requires status `INA` and inputter ≠ current user; reverse requires status `AU`; delete is blocked once a record reaches `AU`. The record status enum (`CbsRecordStatus`: NEW/INA/AU/HLD/REV/DEL) lives in `src/types/cbs.ts`. Components consume this via the `useCbsAccess(context)` hook, which reads the current user from `useSessionStore`. Never reimplement maker-checker logic inline in a component — go through this module.

### CBS command gateway (`src/lib/cbs-command/`)

`engine/grammar.ts::parseCbsCommand` implements the terminal grammar (trailing comma = auth-level-0 auto-auth, `APP,VERSION`, `APP FUNC RECORDID`, `INQ ...`, `SETTINGS:`, `ACTION:`). `registry/catalog.ts::MASTER_COMMAND_DEFINITIONS` is the single source of truth for every command; `registry/alias.ts` derives alias/title maps from it at module load. Public facade is the `cbsCommand` object exported from `src/lib/cbs-command/index.ts`.

### Config, caching, state

- `src/lib/core-config/env.ts` parses `process.env` through a Zod `envSchema` (`src/lib/data-schemas/env-schema.ts`) at module load and fails fast on invalid env; `server.ts`/`client.ts` derive `appConfig`/`clientConfig` from it.
- `src/lib/infra-redis/client.ts` wraps a global `ioredis` singleton in a circuit breaker (`circuitOpen`/`tripCircuit`, cooldown-based) that fails **open** (never throws) on Redis errors. `cache.ts::getOrSet` provides read-through caching with single-flight dedup.
- `src/store/` — Zustand stores: `session-store.ts`, `workbench-store.ts` (open tabs, capped at `clientConfig.workbench.maxOpenTabs`, persisted), `alert-store.ts`. They're composed by `root-provider.tsx::CbsAppStoreProvider` (Theme → Session → Workbench → Alert), which is mounted in the workbench shell/`screen/[id]` tree — **not** in the root `src/app/layout.tsx` (which only wraps Theme + Tooltip providers). Don't expect session/workbench state outside the workbench route group.

### Dynamic form & inquiry engines

- `src/features/operations/forms/ops-form.tsx` (exported as `FormScreen`) composes `useFormSchema` (fetches GMC metadata), `useFormPersistence` (ties into workbench tab state), and `useFormState`, all wrapped in `FormKernelProvider` from `src/features/form-engine`.
- `src/features/operations/inquiries/ops-inquiry.tsx` mirrors this for inquiry screens using `src/features/inquiry-engine`.
- Treat `form-engine`/`inquiry-engine` as the generic rendering kernels and `operations/forms`/`operations/inquiries` as the CBS-specific wiring layer on top of them.

### Import boundaries (enforced by Biome, not just convention)

`biome.json`'s `style.noRestrictedImports` bans importing `@/features/<x>/components` directly for exactly these seven feature barrels: `auth`, `command`, `docs`, `operations`, `settings`, `system`, `workbench`. Always import from the feature's public `index.ts` (e.g. `@/features/workbench`) instead. `pnpm lint` will fail on a direct `.../components` import for these.

The broader layer rule is convention only, and Biome does not enforce it. Dependencies flow one way: `app` → `features` → `components` → `store` → `lib/cbs-*` & `lib/core-utils` → `lib/infra-*` & `lib/core-config` → `types` & `lib/data-schemas`. `src/lib` must never import `@/store`, `@/components`, `@/features` or `@/app`. When lib code needs to notify app state, it goes through the adapter bus (`registerCommandAdapter` in `src/lib/cbs-command/executor/adapter.ts`).

## Repo rules (`.agents/`)

Full rules are in `.agents/rules/*.md`, and domain skills are in `.agents/skills/*/SKILL.md` (access control, wire protocol, command/navigation, form/record lifecycle, verification suite). Claude Code does not auto-load these files, so read the relevant one before working in that area. `.agents/hooks.json` runs `pnpm biome check --write <files>` and `pnpm typecheck` after edits for other agents. Run both yourself after changing code. The rules that matter most day to day:

- **No magic strings.** Get routes from `appConfig.routes`. Declare storage/cookie keys in `appConfig.storageKeys` / `appConfig.auth`. Use the enums in `@/types/cbs` / `cbs-access` / `cbs-record` for statuses and functions, never literals like `"AU"` or `"I"`. Resolve branch/user from `useSessionStore`.
- **Navigation between CBS screens goes through `cbsCommand.execute("...")`**, never `<Link href="/screen/...">` or `router.push()`.
- **No legacy shims.** The app is not in production. When a contract changes, update every call site, and delete dead code instead of aliasing it.
- **Relocate on touch.** Move shared/domain types you touch into `src/types/` (exported from `src/types/index.ts`) or `src/lib/data-schemas/`, and move route/key/business constants into `src/lib/core-config/`.
- **Types:** no `any`, `@ts-ignore`, or non-null `!`. Use `unknown` plus Zod `.safeParse()` at route-handler/Server-Action boundaries, with schemas in `src/lib/data-schemas/`.
- **Size limits:** component files ≤ 300 lines, logic/utility files ≤ 200 lines.
- **Naming:** files use kebab-case, components and types PascalCase (types `readonly`), primitive constants UPPER_SNAKE_CASE, config singletons camelCase (`appConfig`).
- **Form performance:** field edits stay in local state. The workbench tab store receives only debounced (400ms) or blur snapshots plus `isDirty`, never one update per keystroke.
- **Detached windows:** popped-out screens run under `src/app/(workbench)/screen/[id]/`. Mutations broadcast on `BroadcastChannel("cbs_workbench_bus")` so parent tabs refetch.
- **Styling:** use Tailwind v4 semantic tokens (`bg-primary`, `text-muted-foreground`, `border-border`…) and never numbered palette colors (`bg-blue-600`). Combine classes with `cn()` from `@/lib/core-utils`. Base UI triggers use `render={<X />}`, not `asChild`. Forms use the 12-column grid with compact density (`h-9 text-xs`, IDs/dates in `font-mono`).
- **Next 16:** `cookies()`, `headers()`, `params` and `searchParams` are async and must be awaited.
- **Docs:** `docs/devs/` is the developer portal and `docs/manual/` is the end-user manual, which must contain no technical jargon. Both are served by the `src/app/(docs)` route group, so don't add parallel docs routes. Mermaid diagrams use no hardcoded fills.

# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

This repo is co-maintained with Google Antigravity. **`AGENTS.md` and `.agents/` are the shared source of
truth.** This file imports them and adds Claude-specific, code-verified enforcement detail. Change a rule
in `AGENTS.md` / `.agents/`, and add only Claude-specific or verified-reality notes here.

@AGENTS.md

## Always-On Rules (`.agents/rules/`)

@.agents/rules/00-core-pillars.md
@.agents/rules/01-architecture-layers.md
@.agents/rules/02-nextjs-and-react19.md
@.agents/rules/03-cbs-domain-security.md
@.agents/rules/04-styling-and-tokens.md

## 1. Quality Gates (all must pass before you say "done")

```bash
pnpm lint:fix        # Biome. Only expected output: 1 max-size warning on mock/db/.rawResponse/grpc/GRL-Branch.json
pnpm typecheck       # tsc --noEmit (strict, noUnusedLocals/Parameters, zero `any`)
pnpm verify:<suite>  # the suite for the module you touched (see AGENTS.md §2)
pnpm verify:all      # 16 offline suites, including verify:layers
```

- Suites are standalone `tsx` scripts in `scripts/verify/`. There's no Jest/Vitest, no watch mode, no filter.
- `verify:api` is **not** in `verify:all`. It needs `DATA_SOURCE=grpc`, a reachable core, and `pnpm dev`.
  Offline failures of it are not regressions.
- `verify:layers` is **strict**: any layer inversion, barrel bypass or client/server leak fails it. There is no
  allowlist. Fix the import.

## 2. Layer Map & Forbidden Imports (enforced by `pnpm verify:layers`)

| Rank | Path (under `src/`)                                                        | May import | Must NEVER import                                                              |
| ---- | -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------ |
| L0   | `types/`, `lib/data-schemas/`                                              | L0 only    | anything else internal                                                         |
| L1   | `lib/core-config/`, `lib/core-logger/`, `lib/data-parsers/`, `lib/infra-*` | L0–L1      | `lib/cbs-*`, `lib/core-utils`, L3+                                             |
| L2   | `lib/cbs-*`, `lib/core-utils/`                                             | L0–L2      | `@/store`, `@/hooks`, `@/components` (incl. `ui/toast`), `@/features`, `@/app` |
| L3   | `store/`                                                                   | L0–L3      | `@/hooks`, `@/components`, `@/features`, `@/app`                               |
| L3.5 | `hooks/` (bridges store → lib, e.g. `useCbsAccess`)                        | L0–L3.5    | `@/components`, `@/features`, `@/app`                                          |
| L4   | `components/`                                                              | L0–L4      | `@/features`, `@/app` (static assets like `@/app/icon.png` are allowed)        |
| L5   | `features/`                                                                | L0–L5      | `@/app`                                                                        |
| L6   | `app/`, `proxy.ts`                                                         | all        | n/a                                                                            |

- **Upward signals from `lib/`** go through the adapter bus in `src/lib/cbs-command/executor/adapter.ts`:
  call `notifyUser({ title, description, type })` for toasts (bound to the UI by `AppNotifier` in
  `components/layout`). Use `registerCommandAdapter` for other slots. Its disposer removes only the slots it
  registered. Never import UI (`@/components/ui/toast`) or React hooks from `lib/`. A `lib` helper that needs
  session or access state takes it as a parameter, as `resolveCbsActionBar({ access })` does.
- **Barrels:** Code outside a unit imports only the unit root, or `<unit>/server` for server-only exports
  (filesystem/backend, guarded by `import "server-only"`, e.g. `@/features/docs/server`). Units are
  `components/<name>` (except `ui/`) and `features/<name>`. For the **feature groups** `features/operations/*`
  and `features/system/*`, each sub-feature is the unit (e.g. `@/features/system/form-config`).
- **Enforcement:** Biome `overrides` in `biome.json` flag layer inversions as you edit, for `@/` imports.
  `verify:layers` is authoritative: it also catches relative imports, barrel bypasses, and client/server leaks.
- **Server boundary:** a `"use client"` file must never import `@/lib/infra-grpc`, `@/lib/infra-redis`,
  `@/lib/core-config/server`, `@grpc/*`, or `ioredis`. Every `lib/infra-grpc|infra-redis` module starts with
  `import "server-only";`. Browser → backend only via `@/lib/cbs-client` → `/api/proxy`. Route handlers
  validate bodies with `.safeParse()` from `@/lib/data-schemas`.

## 3. Centralization: where every constant lives

| Need                                       | Use                                                       | Defined in                                           |
| ------------------------------------------ | --------------------------------------------------------- | ---------------------------------------------------- |
| Page / API routes                          | `clientConfig.routes.*`, `clientConfig.routes.api.*`      | `src/lib/core-config/client.ts`                      |
| Storage, cookie, broadcast keys            | `clientConfig.storage.*` (e.g. `.broadcast.workbenchBus`) | `src/lib/core-config/client.ts`                      |
| Server env (gRPC, Redis, TTLs)             | `serverConfig.*` (server-only)                            | `src/lib/core-config/server.ts`                      |
| Record functions (RIDASHL / mode codes)    | `CbsRecordFunction.*`                                     | `src/types/access.ts`                                |
| Record statuses (`AU`, `UA`, …)            | `CbsRecordStatus.*`                                       | `src/types/status.ts`                                |
| Screen modes / type                        | `CBS_IDLE_MODE`, `CBS_SCREEN_MODES`, `CbsScreenMode`      | `src/types/screen.ts`                                |
| Status colors (success / warning / info)   | `text-success`, `bg-warning/10`, `border-info/40`, …      | `src/app/globals.css` (`--success/--warning/--info`) |
| User notifications from `lib/`             | `notifyUser()`                                            | `src/lib/cbs-command/executor/adapter.ts`            |
| Access decisions (`isReadOnly`, Four-Eyes) | `useCbsAccess()` → `evaluateCbsAccess()`                  | `src/hooks/use-cbs-access.ts`, `src/lib/cbs-access/` |
| Dirty detection                            | `evaluateDirty`                                           | `src/lib/cbs-record/baseline.ts`                     |
| Hotkeys                                    | `useCbsHotkeys`                                           | `src/lib/cbs-hotkeys/`                               |
| Screen navigation / aliases                | `cbsCommand.execute()`, `cbsCommand.resolveAlias()`       | `src/lib/cbs-command/index.ts`                       |
| Class merging                              | `cn()`                                                    | `@/lib/core-utils`                                   |

`router.push(clientConfig.routes.*)` is fine for **auth/shell routes** (login, dashboard, change-password).
Only CBS **screen** navigation must go through `cbsCommand.execute`.

## 4. Styling & Mode Conventions (drift cleared 2026-11-16; keep it that way)

- **Colors:** never use palette classes (`text-emerald-500`, `bg-sky-500/15`). Map by meaning:
  success → `success`, caution → `warning`, neutral identity/info → `info`, destructive → `destructive`.
  **Selection, hover, drop-target and active-tab states use `primary`**, so they follow the theme accent.
  Tokens adapt per theme, so don't add `dark:` color overrides.
- **Modes:** compare against `CBS_IDLE_MODE` / `CbsRecordFunction.*` and statuses against `CbsRecordStatus.*`.
  Never compare against raw `"IDLE"`, `"I"`, `"S"`, `"AU"` or `"UA"` strings.
- **Assets:** reference Next metadata files (e.g. `src/app/icon.png`) by static import (`appIcon.src`). Never
  hand-write their URL: Next serves them at hashed paths (`/icon?<generated>`).
- `src/proxy.ts` carries `import "server-only"`. Next's middleware/proxy layer resolves it to an empty module,
  and the Turbopack production build is verified.

## 5. Do-Not-Edit / Generated Paths

- `src/lib/infra-grpc/generated/` comes from `pnpm proto:gen` (`proto/service.proto`, needs `protoc`). Regenerate it; don't hand-edit it.
- `src/components/ui/` holds shadcn/Base UI primitives (`pnpm ui:add`), which Biome ignores. Don't restyle them in place.
- The `<!-- BEGIN/END:nextjs-agent-rules -->` block in `AGENTS.md` is owned by `next dev`. It never touches this file.
- `.env.local` contains real endpoints/tokens. Never print its values or commit it.

## 6. Runtime & Environment

- **Offline (default):** `DATA_SOURCE=static`, `CACHE_ENABLED=false` → in-memory mock core (`mock/`, aliases
  `@mock/core`, `@mock/db`). No Redis/gRPC needed, and Redis isn't installed locally.
- **Live:** `DATA_SOURCE=grpc`, `CACHE_ENABLED=true`, `GRPC_HOST`, `REDIS_URL`. See `.env.example`.
- **Windows 11.** Prefer the Bash tool (Git Bash). PowerShell 5.1 lacks `&&`. Biome enforces LF, and
  `core.autocrlf=false`. `core.symlinks=false`, so `.claude/skills/*` are pointer files to `.agents/skills/*`, not symlinks.

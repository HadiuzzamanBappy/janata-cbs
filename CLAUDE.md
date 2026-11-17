# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Claude Code Workflow

- **Quality Gates:** Always run `pnpm lint:fix` and `pnpm typecheck` before ending a task, plus the `verify:*` suite for each module you changed (or `pnpm verify:all`).
- **No test framework:** `verify:*` commands are standalone `tsx` scripts in `scripts/verify/` (not Jest or Vitest), one file per module, with no per-case filtering. To run one suite directly, use `pnpm exec tsx scripts/verify/<file>.ts`. `verify:all` runs 16 suites in order, including `verify:layers`, and hides a suite's output unless it fails.
- **`verify:layers`** is the import-graph audit. It checks layer ranks, barrel-only imports, that `"use client"` files never pull in server modules, and that every `lib/infra-*` file starts with `import "server-only"`. It has no allowlist: fix the import.
- **`verify:api` is not part of `verify:all`.** It calls the live backend, using `GRPC_HOST` from `.env.local`, and probes `/api/proxy`, so it needs a running core and dev server.
- **Barrels:** import a unit through its `index.ts` (or `server.ts` for server-only exports). Some barrels sit at the sub-feature level, for example `@/features/operations/forms` and `@/features/system/menu-designer`. Never deep-import `.../components/...`. Biome's `noRestrictedImports` (in `biome.json`) catches layer inversions while you edit, and `verify:layers` catches deep imports.

## Local Runtime Modes

Copy `.env.example` to `.env.local`. `DATA_SOURCE` controls every backend connection (forms, menus, inquiries, branches, login):

- `DATA_SOURCE=static` + `CACHE_ENABLED=false`: offline mode with no dependencies. `isStaticMode()` in `src/lib/infra-grpc/client.ts` sends `dispatch()`/login to the in-memory simulator in `mock/` instead of gRPC.
- `DATA_SOURCE=grpc` + `CACHE_ENABLED=true`: live Java core at `GRPC_HOST`, with Redis at `REDIS_URL`.

`mock/` lives outside `src/` and is imported as `@mock/core` (handlers, `database-router.ts`, response factory) and `@mock/db` (tables named after the real CBS tables: `SC_MODEL_CONFIG`, `SC_FORM_CONFIG`, `SC_INQUIRY_CONFIG`, `SC_MENU_TREE`, `AC_ACCOUNT`, `FT_FUNDS_TRANSFER`, …). If you add a screen or table that should work offline, add its mock table and handler, then run `pnpm verify:mock`.

## Request Lifecycle (client → core)

1. The client uses request factories in `src/lib/cbs-client` (`payloads/`, `queries/`, `transport/`). They are TanStack Query based, and they `POST` only to `/api/proxy`.
2. `src/app/api/proxy/route.ts`:
   - loads the Redis session (`getSession`), returning 401 if there is none and 403 if `initLogin` is set
   - checks the body with Zod (`cbsWirePayloadSchema.safeParse`)
   - checks RIDASHL/Four-Eyes on the server (`verifyUserRecordAccess`)
   - builds a `GrpcEnvelope` (branch and user come from the session, never from the client)
   - runs a read-through cache (`resolveCacheDescriptor` → `getOrSet`) around `dispatch()` (gRPC, or mock in static mode)
   - on success, calls `autoInvalidateOnMutation`
   - decodes the response with `decodeProtobufValue` / `parseInquiryRecords` (for `INQ`)
3. The other API routes are `login`, `logout`, `session`, `change-password`, and `cache` (token-guarded invalidation). `src/proxy.ts` is the Next 16 replacement for middleware and acts as the session/redirect guard. `/screen/*` is let through on purpose so popups can render an in-place lock screen.
4. The gRPC contract is `proto/service.proto`. Stubs are generated into `src/lib/infra-grpc/generated/` with `pnpm proto:gen`; never hand-edit them.

## Screen Resolution & Workbench

- Every banking screen is opened by a command string, e.g. `ACCOUNT I 1001`, `INQ GET.EMP.INFO`, or `SC.MENU.DESIGN`. `resolveScreen()` in `src/features/workbench/registry.tsx` resolves it in this order:
  1. `resolveCommandAlias()`, then the `BESPOKE_SCREENS` map (system/admin screens in `src/features/system/*`)
  2. an `INQ`/`INQUIRY` prefix → `OpsInquiry`
  3. anything else → `OpsForm`
- Forms and inquiries are schema-driven: specs come from `MODEL.CONFIG` / `CONFIG.FORM` / inquiry config over the wire. They are compiled by `lib/cbs-form-spec` / `lib/cbs-inquiry-spec` and rendered by `components/cbs-form-engine` / `components/cbs-inquiry-engine`. Fix rendering bugs in the spec compiler or engine, not per screen.
- To add a bespoke screen, register its canonical key in `BESPOKE_SCREENS` and add aliases in `lib/cbs-command` (see the `cbs-command-and-navigation` skill).
- The workbench has two modes:
  - `panel` mode: tabs in `useWorkbenchStore`, inside `WorkbenchShell` at `/dashboard`
  - `window` mode: detached popups at `/screen/[id]`
- Popups rebuild their tab from URL params plus sessionStorage drafts (`getWorkbenchDraft`). They sync session and dock events over a `BroadcastChannel` (`getWorkbenchBus`, `CBS_SCREEN_MESSAGE`). Only the main shell runs the idle-timeout watcher.
- Zustand stores (`session`, `workbench`, `alert`, `theme`) are exported from `@/store` and provided by `CbsAppStoreProvider`.

## Docs

`docs/devs/` (developer portal) and `docs/manual/` (operator manual) are Markdown files rendered in the app at `/devs/*` and `/manual/*` by `src/features/docs`. When you change behaviour they describe, update them, following the `documentation-authoring` skill.

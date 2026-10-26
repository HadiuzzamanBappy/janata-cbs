<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Janata CBS Workbench — Agent Guide

Janata CBS is an enterprise core banking frontend/BFF built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Biome**. It communicates with the Java banking core exclusively through a server-side gRPC proxy (`/api/proxy`); the browser never touches gRPC, Redis, or internal databases directly.

---

## 1. Quality Gates (Mandatory Before Completing Tasks)

Every code change must pass these checks with zero errors:
```bash
pnpm lint:fix        # Biome formatting and lint fixes
pnpm typecheck       # TypeScript strict compilation check (tsc --noEmit)
pnpm verify:all      # Standalone CBS domain invariant test suite
```
_Never commit code with type errors, linter warnings, or failing verification suites._

### 1.1 Pre-Edit File Checklist

Before saving edits to any file, ensure:
- [ ] **DRY Check**: No duplicate logic (e.g., `isReadOnly` delegates to `@/lib/cbs-access`).
- [ ] **Zero Legacy**: No backward-compatibility shims, legacy query params (`?id=`), or deprecated aliases.
- [ ] **Zero Magic Strings**: Mode strings and action codes use `CbsRecordFunction.*` and `CBS_SCREEN_MODES`.
- [ ] **No Fake IDs**: No `Date.now()` timestamp ID generation.
- [ ] **Size Budget**: Components $\le 300$ lines, hooks/helpers $\le 200$ lines.

---

## 2. Command Reference

### Development & Build

```bash
pnpm dev              # Start local development server
pnpm build            # Production build
pnpm lint:fix         # Auto-format and lint code with Biome
pnpm typecheck        # Full TypeScript compiler check
pnpm proto:gen        # Regenerate gRPC stubs from .proto definitions
pnpm ui:add <name>    # Add a base component primitive
```

### Domain Verification Harnesses (`scripts/verify/`)

These are standalone `tsx` verification scripts (not Jest/Vitest). Run the suite matching the area you modified:
```bash
pnpm verify:all       # Runs all 9 sub-suites sequentially
pnpm verify:access    # RIDASHL rights + Four-Eyes maker-checker
pnpm verify:command   # Terminal command grammar, aliases, RBAC
pnpm verify:client    # Wire request factories & payload contracts
pnpm verify:record    # Record delta mutations & status transitions
pnpm verify:form-spec # GMC form schema specifications & compiler
pnpm verify:matrix    # Env config matrix, mock fixtures, wire parsers
pnpm verify:utils     # Currency, account-masking, date formatters
pnpm verify:services  # Infra service layer & mock fallback handlers
pnpm verify:mock      # In-memory mock core engine & dispatch
```

### Cache & Tools

```bash
pnpm cache:clear      # Flush Redis cache (scripts/cache/cache-clear.ts)
pnpm cache:inspect    # Inspect Redis cache keys
pnpm fixture:clean    # Normalize mock data fixtures
```

---

## 3. Core Architectural Invariants

1. **Unidirectional Layer Hierarchy:**
   Dependencies flow strictly one way. Lower layers must **never** import from higher layers:
   $$\text{app} \longrightarrow \text{features} \longrightarrow \text{components} \longrightarrow \text{store} \longrightarrow \text{lib/cbs-_} \longrightarrow \text{lib/infra-_} \longrightarrow \text{types \& data-schemas}$$
   `src/lib` must **NEVER** import from `@/store`, `@/components`, `@/features`, or `@/app`. Upward notifications use the Adapter Bus (`registerCommandAdapter`).

2. **Strict Server Boundary (`"server-only"`):**
   Backend drivers (`@grpc/grpc-js`, `ioredis`) live on the server only. The client reaches the backend strictly through `/api/proxy` via request factories in `@/lib/cbs-client`. All boundary payloads must be validated with Zod `.safeParse()`.

3. **Four-Eyes Principle (Maker-Checker):**
   A user who inputted or modified a transaction (`Maker`) can **never** authorize that same transaction (`Checker`). Block authorization in UI with a clear `<Tooltip>` explanation.

4. **Zero Magic Strings:**
   - Routes come from `appConfig.routes` (in `@/lib/core-config`).
   - Action codes and statuses come from canonical enums (`@/types/cbs`).
   - User identity and active branch resolve dynamically from `useSessionStore`.

5. **Screen Navigation via Command Gateway:**
   Never use `<Link href="/screen/...">` or `router.push()` to switch banking screens. Use `cbsCommand.execute("COMMAND ...")`.

6. **Styling with Semantic Tokens:**
   Use Tailwind v4 semantic classes (`bg-primary`, `text-muted-foreground`, `border-border`). Never hardcode numbered colors (`bg-blue-600`). Forms use the 12-column grid with compact banking density (`h-9 text-xs`, monospace financial values).

7. **Next.js 16 Asynchronous APIs:**
   `cookies()`, `headers()`, `params`, and `searchParams` are async Promises and must be `await`ed.

---

## 4. Deep-Dive Rules & Skills Index

When working in specific domain areas, refer to the focused runbooks in `.agents/`:

- **Rules (`.agents/rules/`):**
  - [00-core-pillars.md](file:///.agents/rules/00-core-pillars.md) — The 9 core engineering invariants.
  - [01-architecture-layers.md](file:///.agents/rules/01-architecture-layers.md) — Layer import boundaries and rules.
  - [02-nextjs-and-react19.md](file:///.agents/rules/02-nextjs-and-react19.md) — Next.js 16 App Router & React 19 standards.
  - [03-cbs-domain-security.md](file:///.agents/rules/03-cbs-domain-security.md) — RIDASHL access model & Four-Eyes matrix.
  - [04-styling-and-tokens.md](file:///.agents/rules/04-styling-and-tokens.md) — Semantic design tokens & layout guidelines.

- **Skills (`.agents/skills/`):**
  - `cbs-access-control` — RIDASHL capability evaluation and button states.
  - `cbs-client-wire-protocol` — BFF proxy client and wire request factories.
  - `cbs-command-and-navigation` — Command syntax, screen aliases, and bespoke screen registration.
  - `cbs-form-and-record-lifecycle` — Two-tier form state (prevent keystroke thrashing) & delta payloads.
  - `cbs-verification-suite` — Test runbook and regression triage.
  - `documentation-authoring` — Architecture docs and end-user manual authoring standards.

# 01: Architectural Hierarchy & Layer Boundaries

Dependencies flow strictly top to bottom. A file may import its **own rank or lower**, never a higher one. The authoritative table is `LAYERS` in `scripts/verify/verify-layers.ts`. This page explains it; if the two ever disagree, the script wins, and this page must be fixed.

```text
L6    src/app/, src/proxy.ts                         routes, layouts, API route handlers, request guard
L5    src/features/                                  screens, designers, docs portal
L4    src/components/                                engines (form, inquiry), screen scaffold, layout, ui/
L3.5  src/hooks/                                     shared client hooks (use-cbs-access, use-idle-timeout, …)
L3    src/store/                                     Zustand stores + providers
L2    src/lib/cbs-*, src/lib/core-utils/             headless banking logic and utilities
L1    src/lib/infra-*, core-config/, core-logger/,   server infrastructure, config, logging, wire parsers
      data-parsers/
L0    src/types/, src/lib/data-schemas/              enums, contracts, Zod schemas
```

## Layer Import Invariants

1. **L0 (`src/types/`, `src/lib/data-schemas/`)**: imports only `zod` and other L0 modules. No runtime logic beyond schemas, enums and small pure predicates.
2. **L1 (`infra-*`, `core-config`, `core-logger`, `data-parsers`)**: imports L0–L1. `infra-grpc` and `infra-redis` are server-only (see the boundary rules below).
3. **L2 (`cbs-*`, `core-utils`)**: imports L0–L2. Pure logic, with no React components and no store. **`src/lib` never imports `@/store`, `@/hooks`, `@/components`, `@/features` or `@/app`.** Upward communication goes through the adapter bus (`registerCommandAdapter`, `notifyUser` in `@/lib/cbs-command`).
4. **L3 (`src/store/`)**: imports L0–L3. Stores are created per provider (`useLazyStore` / `useScopedStore` in `scoped-store.ts`) and read only inside client components under `CbsAppStoreProvider`.
5. **L3.5 (`src/hooks/`)**: imports L0–L3.5. React hooks that combine stores with `lib` logic, for example `useCbsAccess`.
6. **L4 (`src/components/`)**: imports L0–L4. Must remain screen-agnostic presentation engines (Form, Inquiry), layout scaffolding, or UI primitives. Never imports `src/features/` or `src/app/` (static assets excepted). Screen-specific banking workflows belong in L5.
7. **L5 (`src/features/`)**: imports L0–L5. Sibling features import each other only through their barrels.
8. **L6 (`src/app/`, `src/proxy.ts`)**: may import anything below. Route handlers (`src/app/api/**/route.ts`) run on the server and may consume L1 server-only modules. All client pages (`"use client"`) in `src/app/` remain bound by the Client Boundary rule.

## Barrels

Every unit is imported through its public barrel: `index.ts`, or `server.ts` for server-only exports. Units are `lib/<x>`, `store`, `hooks`, `components/<x>` (except `ui/`) and `features/<x>` (or `features/<group>/<x>` when the group has no index). Deep imports such as `@/features/X/components/...`, `@/lib/data-schemas/form-engine-schema` or `@/store/session/session-provider` are rejected. To share something across units, export it from the barrel.

- **Acyclic barrels**: Sibling imports must never form circular dependencies across barrels. Decouple cross-feature cycles using adapter buses or lifting state to prevent runtime TDZ (`undefined`) crashes.
- **Zero side-effects**: Barrels (`index.ts`) must contain pure re-exports only; never execute top-level code on module evaluation to preserve Next.js tree-shaking.
- **Code-split screens**: Heavy bespoke screens in L5 should be lazy-loaded in the screen registry (`registry.tsx`) via `next/dynamic` or dynamic `import()` to avoid initial bundle bloat. Dynamic imports obey the same layer ranks.

## Server / client boundary

- **Sealed server modules**: every file in `src/lib/infra-grpc/` and `src/lib/infra-redis/` starts with `import "server-only"` (also true of `src/proxy.ts` and `core-config/server.ts` / `env.ts`).
- **Client files** (`"use client"`) never import `@/lib/infra-grpc`, `@/lib/infra-redis`, `@/lib/core-config/server`, `@grpc/*` or `ioredis`.
- `src/lib/infra-grpc/generated/` (from `pnpm proto:gen`) and `src/components/ui/` (vendored shadcn) are excluded from the audit. Never hand-edit either.

## Enforcement

- `pnpm verify:layers` checks ranks, barrels, the client boundary and server sealing. It's strict: there's no allowlist, so fix the import.
- Biome's `noRestrictedImports` (in `biome.json`) flags layer inversions while you edit.

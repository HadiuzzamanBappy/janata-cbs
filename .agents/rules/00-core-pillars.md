# 00: Core Engineering Invariants & Banking Pillars

All generated code in Janata CBS must conform strictly to these core engineering invariants:

## 1. Unidirectional Dependency Rule (No Layer Inversion)

$$\text{Level 6 (App)} \longrightarrow \text{Level 5 (Features)} \longrightarrow \text{Level 4 (Components)} \longrightarrow \text{Level 3 (Store)} \longrightarrow \text{Level 2 (Client Lib)} \longrightarrow \text{Level 1 (Core/Infra)} \longrightarrow \text{Level 0 (Contracts)}$$
- A lower level must **NEVER** import from a higher level.
- Specifically: `src/lib` must **NEVER** import from `@/store`, `@/components`, `@/features`, or `@/app`.
- Upward notifications from `src/lib` to application state MUST use the adapter bus (`registerCommandAdapter`).

## 2. Zero Magic Strings & Centralized Registry

- **Zero Inline Paths**: Never hardcode route strings like `"/api/login"`. Use `appConfig.routes` (in `@/lib/core-config`).
- **Zero Raw Action Codes**: Never use raw string literals like `"S"`, `"I"`, `"AU"`, or `"NEW"`. Always use canonical enums from `@/types/cbs` or `@/lib/cbs-access` / `@/lib/cbs-record`.
- **Zero Hardcoded Context**: Active branch codes, user credentials, and session tokens must resolve dynamically from `useSessionStore`.
- **Storage Invariants**: All keys for `localStorage`, `sessionStorage`, or cookies must be declared in `appConfig.storageKeys` or `appConfig.auth`.

## 3. Server/Client Isolation Boundary

- Backend infrastructure drivers (`@grpc/grpc-js`, `ioredis`, internal services) must remain sealed behind `import "server-only"`.
- The browser client **NEVER** speaks gRPC directly. It communicates exclusively via Next.js Route Handlers (`/api/...`) or Server Actions with strict Zod validation at the boundary.

## 4. Dual Workspace Contract (Tabs vs. Detached Popups)

- **Internal Tabs (`panel` mode)**: Managed by `WorkbenchStore` in-memory. Switching tabs is instantaneous and preserves form draft state.
- **Detached Windows (`window` mode)**: When popped out via `window.open()`, the popup runs as an autonomous Next.js screen instance under `src/app/(workbench)/screen/[id]/page.tsx`.
- **Cross-Window Synchronization**: Record mutations broadcast via `BroadcastChannel("cbs_workbench_bus")` to refresh open parent tabs without conflict.

## 5. High-Performance Form State (No Keystroke Thrashing)

- Banking screens contain 50+ dynamic fields. Keystrokes must **never** trigger global Zustand re-renders.
- **Two-Tier Form State**:
  1. **Tier 1 (Local Component State)**: Fast, local field editing via local state or form hook refs.
  2. **Tier 2 (Global Tab Store Sync)**: The tab store only receives **debounced snapshots (400ms)** or **blur events**, plus a lightweight boolean `isDirty: true`.

## 6. Zero Dead Code, Zero Legacy Shims & 1:1 WYSIWYG Data

- **No Backward Compatibility Burden**: The app is not in production. Do **NOT** keep deprecated shims, legacy aliasing, fallback adapter wrappers, or obsolete types. Update all call sites cleanly.
- **1:1 WYSIWYG Fidelity**: In-memory state and wire data structures match 1:1 (`PROP: [...]` true recursive tree, no artificial flattening/re-nesting).
- **Zero Dead Code**: Delete unused imports, orphaned types, unreachable branches, and abandoned utility files immediately.
- **Strict Naming**: Files/folders in `kebab-case`, components/types in `PascalCase` (types sealed with `readonly`), primitives/enums in `UPPER_SNAKE_CASE`, config singletons in `camelCase` (`appConfig`), hooks prefixed with `use`.
- **File Lengths**: Keep standard leaf components focused (≤300 lines where feasible); large enterprise screens, designer canvases, and metamodel dictionaries are permitted to be larger when cohesive.

## 7. Core Banking Security & Domain Rules

- **Four-Eyes Principle (Maker-Checker)**: A record inputter (`Maker`) can NEVER authorize their own record (`Checker !== Maker`).
- **Append-Only Schema Evolution**: Committed properties in the database can never be deleted; they can only be marked `STATUS: "ARCHIVED"`. Only uncommitted draft properties may be deleted.
- **Banking Entitlements (`RIDASHL`)**: Always verify user capabilities via `useCbsAccess()` before rendering action buttons.
- **Command Gateway**: Screen navigation occurs exclusively via `cbsCommand.execute("COMMAND ...")`, never via raw `<Link>` or `router.push()`.

## 8. High-Density Zero-Fluff UI

- **Eliminate Clutter**: No marketing taglines, verbose helper paragraphs, or redundant secondary labels.
- **Self-Explanatory Layouts**: Clear domain labels, sensible grouping, 12-column grid hierarchy, compact controls (`h-9 text-xs`, IDs/dates in `font-mono`).
- **Tooltips for Assistance**: Use compact icon tooltips (`<Tooltip>`) or the validation drawer—never static canvas filler.

## 9. Tri-Experience Optimization & Zero Breakage (UX / DX / AX)

- **UX**: Keyboard-first interaction (F-keys, command gateway, tab indexing), zero layout shifts.
- **DX**: Pure TypeScript with zero `any`, unidirectional layers, Biome compliance (`pnpm lint:fix`).
- **AX (Agent Experience)**: Deterministic contracts, schema-driven metadata (`MODEL.CONFIG` / `FORM.CONFIG`), and explicit type boundaries.
- **Zero Breakage**: All verification suites (`pnpm verify:all`, `pnpm typecheck`) must pass cleanly after every task.

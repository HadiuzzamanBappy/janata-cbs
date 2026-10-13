# 00: The 7 Pillars of Core Engineering Invariants

To guarantee that no architectural decisions need to be backtracked, all generated code must conform strictly to these 7 pillars:

## 1. Unidirectional Dependency Rule (No Layer Inversion)
$$\text{Level 6 (App)} \longrightarrow \text{Level 5 (Features)} \longrightarrow \text{Level 4 (Components)} \longrightarrow \text{Level 3 (Store)} \longrightarrow \text{Level 2 (Client Lib)} \longrightarrow \text{Level 1 (Core/Infra)} \longrightarrow \text{Level 0 (Contracts)}$$
- **Strict Constraint**: A lower level must **NEVER** import from a higher level.
- **Specifically**: `src/lib` must **NEVER** import from `@/store`, `@/components`, `@/features`, or `@/app`.
- **Adapter Bus Pattern**: All upward notifications from `src/lib` to application state MUST use the adapter bus (`registerCommandAdapter`).

## 2. Zero Magic Strings & Centralized Registry
- **Zero Inline Paths**: Never hardcode route strings like `"/api/login"`, `"/dashboard"`, or `"/screen"`. All routes must come strictly from `appConfig.routes` (in `@/lib/core-config`).
- **Zero Raw Action Codes**: Never compare against raw string literals like `"S"`, `"I"`, `"AU"`, or `"NEW"`. Always use canonical enums from `@/types/cbs` or `@/lib/cbs-access` / `@/lib/cbs-record`.
- **Zero Hardcoded Context**: Active branch codes, user credentials, and session tokens must resolve dynamically from `useSessionStore`, never as hardcoded literals.
- **Storage Invariants**: All keys for `localStorage`, `sessionStorage`, or cookies must be declared in `appConfig.storageKeys` or `appConfig.auth`.

## 3. Server/Client Isolation Boundary
- Infrastructure drivers (`@grpc/grpc-js`, `ioredis`, backend services) must remain sealed behind `import "server-only"`.
- The browser client **NEVER** speaks gRPC directly. It communicates exclusively via Next.js Route Handlers (`/api/...`) or Server Actions with strict Zod validation at the boundary.

## 4. Dual Workspace Contract (Internal Tabs vs. Detached Popups)
- **Internal Tabs (`panel` mode)**: Managed by `WorkbenchStore` in-memory. Switching tabs is instantaneous and maintains dirty form draft state.
- **Detached Windows (`window` mode)**: When popped out via `window.open()`, the popup runs as an autonomous Next.js screen instance under `src/app/(workbench)/screen/[id]/page.tsx`.
- **Cross-Window Synchronization**: If an action in a popup alters a record, cross-window notification is broadcasted via `BroadcastChannel("cbs_workbench_bus")` to automatically refresh open parent tabs without stale data conflicts.

## 5. High-Performance Form State (No Keystroke Thrashing)
- Banking screens contain up to 60+ dynamic fields. Keystrokes must **never** trigger global Zustand re-renders on every character.
- **Two-Tier Form State**:
  1. **Tier 1 (Local Component State)**: Fast, local uninhibited field editing via local state or local refs.
  2. **Tier 2 (Global Tab Store Sync)**: The tab store only receives **debounced snapshots (400ms)** or **blur events**, plus a lightweight boolean `isDirty: true`.

## 6. Zero Dead Code, Zero Legacy Shims & Rigid Naming Standards
- **No Backward Compatibility Burden**: The app is not in production. Do **NOT** keep deprecated shims, legacy aliasing, fallback adapter wrappers, or obsolete types. If a contract changes, update all call sites cleanly across the codebase.
- **Zero Dead Code**: Delete unused imports, orphaned types, unreachable branches, and abandoned utility files immediately.
- **Strict Naming Conventions**:
  - **Files & Folders**: Strictly `kebab-case` (e.g. `cbs-screen-mode.ts`, `workbench-shell.tsx`).
    *(Preserve Next.js special files: `page.tsx`, `layout.tsx`, `route.ts`, and route groups `(auth)`, `[id]`)*.
  - **React Components**: Strictly `PascalCase` for component declarations inside files (e.g. `export function WorkbenchShell()`).
  - **Types & Interfaces**: Strictly `PascalCase` with self-documenting semantic names. Sealed with `readonly`.
  - **Constants & Enums**: Strictly `UPPER_SNAKE_CASE` for primitives and tuples. Structured config singletons use `camelCase` (e.g. `appConfig`).
  - **Functions & Hooks**: Strictly `camelCase`. Custom hooks must always prefix with `use`.

## 7. Immediate Extraction & Relocation Invariant (The Boy Scout Relocation Rule)
Whenever any file is touched or refactored:
- **Misplaced Types / Interfaces**: If an interface or type represents a domain entity, shared contract, or boundary model, **immediately extract it to `src/types/`** (or `src/lib/data-schemas/`). Export it from `src/types/index.ts` and update call sites.
- **Scattered Constants & Configurations**: If a literal string or number represents a route, endpoint, storage key, fallback value, or business parameter, **immediately migrate it to `src/lib/core-config/`** (`appConfig`).
- **Prohibited Cross-Boundary References**: If a lower layer file (e.g., in `src/lib/infra-services/` or `src/lib/cbs-*`) references data from a higher layer (e.g., `src/store/`, `src/features/`, `src/components/`, or `src/app/`), **halt the direct import immediately**. Decouple it via parameters or `registerCommandAdapter`.
- **No Half-Way Shims**: Do **NOT** leave duplicate copies or deprecation aliases in the original file. Update all consumers directly.

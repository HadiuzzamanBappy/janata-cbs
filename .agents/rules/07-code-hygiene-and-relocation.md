# 07: Code Hygiene, Boy Scout Relocation & Naming Standards

## 1. The Boy Scout Relocation Rule (Immediate Relocation Invariant)
Whenever any file is touched or refactored:
- **Misplaced Types / Interfaces**:
  - If a type or interface represents a domain entity, shared contract, or boundary model (not purely internal JSX props for that single file), **immediately extract it to `src/types/`** (or `src/lib/data-schemas/`).
  - Export it through `src/types/index.ts` and update call sites.
- **Scattered Constants & Configurations**:
  - If a literal string or number represents a route, endpoint, storage key, or business constant, **immediately migrate it to `src/lib/core-config/`** (`appConfig`).
- **Prohibited Cross-Boundary References**:
  - If a lower layer file (e.g. `src/lib/cbs-*` or `src/lib/infra-*`) imports from a higher layer (`@/store`, `@/features`, `@/components`, or `@/app`), decouple it on the spot using the Adapter Bus (`registerCommandAdapter`) or pass the parameter into the function call.
- **Zero Half-Way Shims**:
  - Do NOT leave backward-compatibility shims (`export const OLD = NEW`) in refactored files. Update all call sites across the codebase cleanly.

## 2. Naming Standards
- **Files & Folders:** Strictly `kebab-case` (e.g. `cbs-screen-mode.ts`, `workbench-shell.tsx`).
  *(Exception: Next.js reserved files like `page.tsx`, `layout.tsx`, `route.ts`, and dynamic routes `(auth)`, `[id]`)*.
- **Components:** Strictly `PascalCase` function declarations inside files (e.g. `export function ScreenLoader(...)`).
- **Types & Interfaces:** Strictly `PascalCase` sealed with `readonly` (e.g. `CbsScreenMode`, `RecordDeltaSummary`).
- **Constants & Enums:** Strictly `UPPER_SNAKE_CASE` for primitives and constant tuples. Config objects use `camelCase` (e.g. `appConfig`).
- **Functions & Hooks:** Strictly `camelCase`. Hooks must begin with `use` (e.g. `useCbsAccess`, `useIdleTimeout`).

## 3. Strict Type Safety & File Lengths
- **Zero `any`:** Never use `any`, `@ts-ignore`, or non-null assertions (`!`). Use `unknown` and validate via Zod if the shape is uncertain.
- **Component File Limit:** React component files MUST NOT exceed 300 lines. Extract sub-components when approaching this limit.
- **Utility File Limit:** Logic and utility files MUST NOT exceed 200 lines. Break complex logic into smaller cohesive modules.

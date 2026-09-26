# 📋 Master Expert Code Review & Domain Audit Checklist

This is the **Master Single Source of Truth Code Review & Audit Checklist** for the Janata CBS Core Banking Workbench (`finx-ui`). 

It unifies **General Next.js/React Best Practices** with **Janata CBS Core Banking Architecture Standards** to guide all code reviews, refactorings, and feature migrations.

---

## 🏛️ Core Architecture Principles

1. **The 3-Tier Core Banking Boundary (BFF Architecture)**:
   ```
   [ Browser (Client) ] ── (Zod + fetch) ──> [ Next.js BFF (/api/proxy) ] ── (gRPC) ──> [ Java Core Backend ]
   ```
2. **Encapsulated Domain Layout**:
   Every feature domain must live inside `src/features/<domain-name>/`:
   - `index.ts`: Public API export barrier for the domain.
   - `schema.ts`: Zod request & response payload schemas.
   - `actions.ts`: Server Actions marked with `"use server"`.
   - `hooks/use-<domain>.ts`: Custom React hooks for local state.
   - `components/`: Sub-components encapsulated *only* for this feature (max 300 lines each).

---

## 🔍 Master 12-Phase Audit Checklist

### 1. 🔒 Security, BFF & Server Boundaries
- [ ] **`import "server-only"` Guards**: All server-side infrastructure files (`gRPC` clients, Redis session handlers, DB dispatchers) MUST include `import "server-only"` on Line 1.
- [ ] **No Direct gRPC or Redis in Browser**: Zero imports of `@grpc/grpc-js`, `ts-proto`, or `ioredis` in client components (`"use client"`).
- [ ] **Single BFF Gateway (`/api/proxy`)**: Client components communicate *strictly* via `fetch('/api/proxy')` or Server Actions. Direct external backend calls from browser are prohibited.
- [ ] **Server-Side Authorization**: Validate session tokens (`getSession()`) at the server API boundary before processing transactions. Never rely solely on UI button visibility.
- [ ] **Secret Isolation**: Never expose JWT secrets, backend connection strings, or server environment variables to the browser bundle.

---

### 2. 🛡️ Data Validation & TypeScript Rules
- [ ] **Strict Zod Boundary Parsing**:
  - Request payloads must be parsed via Zod (`Schema.parse(payload)`) before proxy dispatch.
  - Raw dynamic responses (`GMC`, `MNU`) must pass Zod schema parsing before UI rendering.
- [ ] **Zero `any` Types**: TypeScript strict mode is strictly enforced (`no `any``). Use generic type parameters (`T = unknown`) or `Record<string, unknown>`.
- [ ] **Explicit Nullability**: Make optional/nullable fields explicit using TypeScript `?` or `| null`.

---

### 3. 🖼️ Workspace Navigation & Command Governance
- [ ] **No Next.js `<Link>` for Workspace Navigation**: Internal banking screen transitions must **never** use standard Next.js `<Link href="...">` tags. Use the global Workspace Command Dispatcher (`dispatchCommand` / `screen-launcher`).
- [ ] **Single ComponentLoader**: All dynamic component resolution must route through `src/features/workspace/components/component-loader.tsx`.
- [ ] **Tab State & Draft Preservation**: Component form inputs must be saved to `useWorkbenchStore` tab state, preserving user drafts across tab switches.
- [ ] **Window Mode Smart Reuse**: Opening an existing module in `window` pop-out mode re-focuses the existing window instance rather than spawning duplicates.

---

### 4. 🎨 Banking UI, High-Density Spacing & Accessibility
- [ ] **High-Density Compact Spacing**: Use `size="sm"` / `size="xs"` on controls and tight padding (`p-2`, `gap-2`, `space-y-3`) to maximize screen real estate for banking tellers.
- [ ] **Zero-Flash Dark Mode**: CSS colors must use OKLCH semantic design tokens (`var(--surface)`, `var(--fg-muted)`). `<head>` blocking script prevents dark mode theme flashes on load.
- [ ] **Shadcn Primitive Mapping**: Reuse standard `shadcn/ui` primitives (`<Dialog>`, `<Button>`, `<Input>`, `<Select>`, `<DatePicker>`, `<Skeleton>`, `<Alert>`).
- [ ] **12-Column Responsive Form Grid**: Dynamic forms must render inside a 12-column grid (`col-span-12`, `sm:col-span-6`, `sm:col-span-4`, `sm:col-span-3`).
- [ ] **Header Typography**: Section titles use natural Title Case (`Account Details`), reserving `uppercase` strictly for data table header rows (`<TableRow className="uppercase">`).

---

### 5. ⚡ Component Optimization & Performance
- [ ] **Server Components by Default**: Use React Server Components (RSC) unless interactive client state (`useState`, `useEffect`, `onClick`) genuinely requires `"use client"`.
- [ ] **Derived State over Effects**: Remove state that can be computed during rendering. Avoid unnecessary `useEffect` hooks.
- [ ] **Memoization Safety**: Wrap functions or objects declared in render scope and used in `useEffect` dependency arrays in `useCallback` / `useMemo`.
- [ ] **Single-Flight Deduplication**: Use `singleFlight` or cached read-through fetchers (`getOrSet`) to collapse duplicate cold-cache hits.

---

### 6. 🧹 Code Quality, Line Limits & Final Cleanup
- [ ] **Strict Line Limits**:
  - UI Component files: **Max 300 lines**. (Extract sub-components into `src/features/<domain>/components/` or `src/components/layout/components/` if exceeded).
  - Utility/Action/Config files: **Max 200 lines**.
- [ ] **Zero Dead Code**: Remove commented-out code snippets, unused imports, unreachable branches, and `console.log()` debug statements.
- [ ] **Clean Naming & Kebab-Case Files**: All filenames must be lowercase `kebab-case` (e.g. `domain-audit-checklist.md`, `app-topbar.tsx`).
- [ ] **Verification Standard**:
  ```bash
  pnpm lint
  pnpm typecheck
  pnpm build
  ```

---

## 🎯 The Core Principle

> **Don't rewrite working code just to make it different. Simplify where complexity has no value, enforce strict 3-tier BFF security boundaries, reuse existing shadcn/ui primitives, and preserve behavior unless there is a concrete reason to change it.**
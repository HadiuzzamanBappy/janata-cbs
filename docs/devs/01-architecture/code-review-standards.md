# 📋 Master Code Review Standards & Quality Checklist

## 1. Executive Summary & Purpose
This document establishes the master 12-phase code review and domain audit standards for the Janata CBS Core Banking Workbench (`finx-ui`). 

It unifies Next.js App Router best practices with Core Banking security, high-density UI constraints, and domain-driven design principles. All code contributions, refactorings, and pull requests **MUST** pass this checklist prior to merge.

---

## 2. The Master 12-Phase Audit Checklist

### Phase 1: 🔒 Security, BFF & Server Boundaries
- [ ] **`import "server-only"` Guards:** Server infrastructure modules (`src/lib/core/*`) MUST include `import "server-only"` on Line 1.
- [ ] **No Direct gRPC or Redis in Client:** Zero imports of `@grpc/grpc-js`, `ts-proto`, or `ioredis` inside `"use client"` components.
- [ ] **Single BFF Gateway:** Client components MUST communicate exclusively via `fetch('/api/proxy')` or Server Actions (`"use server"`). Direct external API calls from the browser are prohibited.
- [ ] **Server-Side Authorization:** Validate session cookies at the server gateway before dispatching backend commands. Never rely solely on UI button disabling.

### Phase 2: 🛡️ Data Validation & Type Safety
- [ ] **Strict Zod Boundary Parsing:** Input payloads MUST be parsed via Zod (`Schema.parse(payload)`) before proxy dispatch; raw dynamic backend responses (`GMC`, `MNU`) MUST pass Zod validation before UI rendering.
- [ ] **Zero `any` Types:** TypeScript strict mode is enforced (`no 'any'`). Use generics (`T = unknown`) or explicit types.
- [ ] **Explicit Nullability:** Optional or nullable fields must be explicitly typed using TypeScript `?` or `| null`.

### Phase 3: 🖼️ Workspace Navigation & Command Governance
- [ ] **No Next.js `<Link>` for Workspace Navigation:** Internal banking screen transitions MUST use the global Workspace Command Dispatcher (`dispatchCommand` / `screen-launcher`), NEVER standard Next.js `<Link>` tags.
- [ ] **Single ComponentLoader:** All dynamic component resolution MUST route through `src/features/workspace/components/component-loader.tsx`.
- [ ] **Tab Draft Preservation:** Form field inputs MUST sync to `useWorkbenchStore` tab state, preserving user drafts across tab switches.

### Phase 4: 🎨 Banking UI, High-Density Spacing & Accessibility
- [ ] **High-Density Compact Spacing:** Use `size="sm"` / `size="xs"` controls and tight padding (`p-2`, `gap-2`, `space-y-3`) to maximize screen real estate for banking tellers.
- [ ] **Zero-Flash Dark Mode:** CSS colors MUST use OKLCH semantic design tokens (`var(--surface)`, `var(--fg-muted)`). `<head>` blocking script prevents dark mode theme flashes on load.
- [ ] **12-Column Responsive Form Grid:** Dynamic forms MUST render within a 12-column grid (`col-span-12`, `sm:col-span-6`, `sm:col-span-4`, `sm:col-span-3`).

### Phase 5: ⚡ Component Optimization & Performance
- [ ] **Server Components by Default:** Keep components as React Server Components (RSC) unless interactive client state (`useState`, `useEffect`, `onClick`) genuinely requires `"use client"`.
- [ ] **Derived State over Effects:** Remove state that can be computed during rendering. Avoid unnecessary `useEffect` hooks.
- [ ] **Memoization Safety:** Wrap functions or objects declared in render scope and used in `useEffect` dependency arrays in `useCallback` / `useMemo`.

### Phase 6: 🧹 Code Quality, Line Limits & Cleanup
- [ ] **Strict Line Limits:**
  - UI Component files: **Max 300 lines**.
  - Utility / Action / Config files: **Max 200 lines**.
- [ ] **Zero Dead Code:** Remove commented-out code, unused imports, debug `console.log()` statements, and dead code branches.
- [ ] **Kebab-Case Filenames:** All filenames MUST use lowercase `kebab-case`.

---

## 3. Mandatory Review Verification Workflow

Before submitting a Pull Request or declaring a task complete:

```bash
# 1. Typecheck the entire workspace
pnpm typecheck

# 2. Run linter and formatting audit
pnpm lint

# 3. Verify standalone production build
pnpm build
```

---

## 4. Affected Documentation Updates
When modifying review standards or code quality rules, update:
- [docs/01-architecture/code-review-standards.md](file:///d:/Work/React/cbs/finx-ui/docs/01-architecture/code-review-standards.md)
- [AGENTS.md](file:///d:/Work/React/cbs/finx-ui/AGENTS.md)

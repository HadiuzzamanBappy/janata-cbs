# Developer Profile & Coding Standards (`finxui-ref`)

This document defines the core developer principles, coding style, and architecture rules for the `finxui-ref` Core Banking System.

---

## 1. Core Engineering Philosophy

- **Usability & Ergonomics First**: Build for high-density, real-world bank teller & officer workflows. Prioritize unconstrained screen space (`w-full flex-1`), universal window indexing, and zero unnecessary visual clutter.
- **Multi-Instance Execution**: Support opening multiple concurrent instances of the same screen/menu item. Every click MUST spawn a new independent workspace tab with clean titles and universal tab position badges (`1`, `2`, `3`...).
- **Future-Proof Database Schema Alignment**: Design UI state and search registries as structured JSON schemas ready for DB seeding, role-based access control (RBAC), and dynamic API hydration.
- **Strict Component Isolation**: Keep atomic UI primitives in `src/components/ui/` pure and standardized. Keep business logic, store integrations, and RBAC filtering inside dedicated feature components (e.g., `global-search.tsx`, `app-topbar.tsx`).

---

## 2. Type Safety & Quality (Zero Tolerance)

- **Strict TypeScript**: NEVER use `any` or `@ts-ignore`. Use explicit interfaces or generics.
- **Zero Build Warnings/Errors**: Code edits MUST pass both `pnpm typecheck` (`noUnusedLocals: true`, `noUnusedParameters: true`) and `pnpm build` cleanly with exit code 0.
- **Standardized Base UI Integrations**: Use Base UI's `render={<Component />}` prop pattern for triggers (`DropdownMenuTrigger`, `TooltipTrigger`, `DialogClose`) to preserve exact TypeScript signatures.

---

## 3. State Management & Architecture

- **Zustand Global State**: Use Zustand for global client state (sessions, active branch roaming, workbench tabs, alerts). Avoid prop-drilling.
- **Next.js App Router (Next 16)**: Use `"use client"` directives only on interactive client components. Keep server/client module boundaries clean.
- **Destructive Action Confirmation**: Always guard destructive state resets (such as *Close All Tabs*) with explicit confirmation dialogs (`<Dialog />`).

---

## 4. UI Styling & Typography Standards

- **Tailwind v4 & Theme Variable System**: Style using Tailwind v4 classes with OKLCH theme variables defined in `src/app/globals.css`.
- **Platform-Wide Typography Consistency**: Maintain readable typography across all navigation elements (`text-sm font-medium` for menu items, tabs, and titles; `text-xs font-mono` for codes, shortcuts, and badges).
- **CTA Icon Box Uniformity**: All topbar action buttons MUST use uniform icon box styling (`size-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0`).
- **Flush Layout Grid**: Ensure vertical and horizontal alignment across sidebar and topbar headers (`h-16` / 64px header height).

---

## 5. Explicit User Clarification & Zero Assumptions

- **Ask Preference on Incomplete Context**: Whenever user commands, context, or design choices are incomplete or underspecified, AI Agents MUST stop and ask the user for their explicit preference before proceeding. NEVER assume design decisions or make biased guesses.
- **Zero Hallucination & Empirical Evidence**: Enforce exact technical implementation based strictly on verified source code and standard CLI outputs. Never infer variable names, signatures, or third-party wrappers.

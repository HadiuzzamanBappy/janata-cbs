# 🛡️ Enterprise Code Review & Architectural Compliance Runbook

This document defines the mandatory **5-Point Code Review Checklist** and the **Hierarchical Audit Order** for the `janata-cbs` core banking workbench. 

Every developer, code reviewer, and AI agent MUST enforce these guidelines to guarantee Next.js App Router compliance, Bulletproof React Domain-Driven Design (DDD), absolute server-side security, and zero architectural degradation.

---

## 🧭 Master Hierarchical Audit Order

When reviewing or refactoring any module in the repository, follow this strict bottom-up hierarchy:

```text
STEP 1: Infrastructure & Server-Only Layer (`src/lib/`)
 ├── 1.1 `src/lib/core/` (gRPC client, Redis, Sessions, Dispatcher, Cache)
 ├── 1.2 `src/lib/config/` (Environment variables & Constants validation)
 └── 1.3 `src/lib/schema/` (Zod schemas & Server data fetchers)

STEP 2: State Management & Client Hooks (`src/store/` & `src/hooks/`)
 ├── 2.1 `src/store/` (Zustand Stores: Session, Workbench, Alerts)
 └── 2.2 `src/hooks/` (Shared Client Utility Hooks)

STEP 3: Domain-Driven Feature Modules (`src/features/`)
 ├── 3.1 `src/features/auth/` (Authentication domain)
 ├── 3.2 `src/features/engine/` (Dynamic Form Platform Engine)
 ├── 3.3 `src/features/workspace/` (Tab Loader, Window Manager & Component Registry)
 └── 3.4 `src/features/settings/` (User Preferences)

STEP 4: Global Presentation & UI Layer (`src/components/`)
 ├── 4.1 `src/components/ui/` (shadcn primitive design tokens)
 ├── 4.2 `src/components/providers/` (React Context Providers)
 ├── 4.3 `src/components/feedback/` (Loaders, Dialogs, Error Boundaries)
 └── 4.4 `src/components/layout/` (App Shell, Sidebar, Topbar, Tabbar)

STEP 5: Routing, Middleware & BFF Gateways (`src/app/` & `src/proxy.ts`)
 ├── 5.1 `src/proxy.ts` (Next.js Middleware proxy & route protection)
 ├── 5.2 `src/app/api/` (BFF Route Handlers)
 └── 5.3 `src/app/(auth)/` & `src/app/(workbench)/` (App Pages & Layouts)
```

---

## 📋 The 5-Point File Review Checklist

Every single file evaluated must pass all 5 checkpoints below:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 1. SCOPE & DOMAIN PURITY (Folder Responsibility Alignment)             │
│ 2. SERVER vs. CLIENT BOUNDARY (Security Guarding & Bundle Leak Control) │
│ 3. SINGLE RESPONSIBILITY & MODULARITY (Strict Line Limits)            │
│ 4. STRICT TYPE SAFETY & VALIDATION (Zero `any` & Zod Envelopes)         │
│ 5. DEPENDENCY & BARREL RULES (Public Barrels & Path Aliases)           │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Checkpoint 1: 🎯 Scope & Domain Purity
- **Rule:** The file's logic must strictly match the folder it resides in.
- **Enforcement Rules:**
  - `src/components/` MUST be 100% domain-agnostic (no feature logic or gRPC concepts allowed).
  - Business logic MUST reside strictly inside `src/features/<domain>/`.
  - API gateways (`src/app/api/`) MUST only handle HTTP routing and delegate logic to `src/lib/core/` or `src/features/`.

---

### Checkpoint 2: 🔒 Server vs. Client Boundary Guard
- **Rule:** Server code must never leak to the client bundle; client code must explicitly declare its context.
- **Enforcement Rules:**
  - **Server Files (`src/lib/core/*`, API routes, server services):** MUST contain `import "server-only";` at line 1 if they handle secrets, cookies, Redis, or gRPC connections.
  - **Client Files (`src/components/*`, `src/features/*/components/*`):** MUST contain `"use client";` at line 1 if they use React hooks (`useState`, `useEffect`), DOM event handlers (`onClick`), or browser APIs.
  - **Forbidden:** Client components importing Node modules (`net`, `crypto`, `ioredis`, `@grpc/grpc-js`).

---

### Checkpoint 3: 📏 Single Responsibility & Modularity
- **Rule:** Keep files small, focused, and testable.
- **Strict Size Limits:**
  - UI / Feature Components: **Maximum 300 lines**
  - Utilities / Services / Schemas: **Maximum 200 lines**
- **Refactor Trigger:** If a file exceeds these limits, split sub-components or extract utility hooks immediately.

---

### Checkpoint 4: 🛡️ Type Safety & Validation
- **Rule:** Prevent runtime type crashes in financial transactions.
- **Enforcement Rules:**
  - **Zero `any`:** `any` is strictly prohibited. Dynamic backend payloads must use `unknown` combined with TypeScript type narrowing or Zod parsing.
  - **Boundary Validation:** All external HTTP or gRPC payloads entering the application MUST be validated against Zod schemas (`src/lib/schema/` or `src/features/*/schemas.ts`).

---

### Checkpoint 5: 🔗 Dependency & Public Barrels
- **Rule:** Imports must be clean, maintainable, and non-cyclical.
- **Enforcement Rules:**
  - Always use configured path aliases (`@/components`, `@/features`, `@/lib`, `@/store`).
  - Cross-feature imports MUST route through the feature's `index.ts` public barrel file.
  - **Forbidden:** Deep relative feature imports like `import { Form } from "../../features/engine/components/dynamic-form"`.

---

## 🛠️ Verification Commands

Run these automated commands before approving any code or committing changes:

```bash
# 1. Biome Strict Linting & Any Checking
pnpm lint

# 2. Strict TypeScript Type Check
pnpm typecheck

# 3. Format Verification
pnpm format
```

# 📁 Domain-Driven Design (DDD) Folder Architecture & Colocation Rules

## 1. Executive Summary & Purpose
This document defines the official, military-grade folder structure for `finx-ui`. It enforces the **Bulletproof React** / Feature-Sliced Domain-Driven Design (DDD) pattern customized for Next.js 16 App Router.

This structure ensures clean separation of concerns, strict boundary isolation, zero cyclic dependencies, and predictable file locations for both human developers and AI coding agents.

---

## 2. The Master Directory Tree

```text
src/
├── app/                           # Next.js App Router (Thin routing & API gateways)
│   ├── (auth)/                    # Unauthenticated route group (login, change-password)
│   ├── (workbench)/               # Authenticated workspace route group (dashboard, screen/[id])
│   └── api/                       # BFF Gateway endpoints (proxy, session, branches, menu)
│
├── components/                    # Pure, Domain-Agnostic UI Components
│   ├── ui/                        # Low-level primitives (shadcn/ui buttons, dialogs, inputs)
│   ├── layout/                    # Application shell (app-header, app-sidebar, app-tabbar)
│   ├── feedback/                  # Generic UI feedback (confirm-dialog, error-boundary)
│   └── providers/                 # React Context Providers (theme-provider, session-provider)
│
├── features/                      # Domain-Driven Design Feature Modules (Business Logic)
│   ├── auth/                      # Authentication domain (login forms, password change)
│   ├── engine/                    # Dynamic Form Rendering Engine (FormGrid, ControlRenderer)
│   ├── inquiries/                 # Inquiry screens & data tables (INQ, GIR, SIR)
│   ├── reporting/                 # Report studio & report viewer modules
│   ├── system-config/             # Form builder, model configuration & menu designer
│   └── workspace/                 # Workspace shell, tab management & ComponentLoader
│
├── lib/                           # Core Infrastructure & Backend Tools
│   ├── core/                      # 'server-only' services (grpc.ts, redis-client.ts, dispatch.ts)
│   ├── grpc/                      # Protocol Buffer generated stubs (service.ts, struct.ts)
│   ├── schema/                    # Zod payload validators & API response envelope parsers
│   └── config/                    # Validated environment configs (env.ts, constants.ts)
│
├── store/                         # Zustand Global State Stores
│   ├── workbench-store.ts         # Workspace tabs, active screen state & window pop-outs
│   ├── session-store.ts           # Active officer session & branch state
│   └── alert-store.ts             # Global alert & modal dialog state
│
└── types/                         # Global TypeScript Ambient Definitions
    ├── index.ts                   # APIResponse envelope & ICommand definitions
    └── images.d.ts                # Image module definitions
```

---

## 3. Feature Colocation Rules (`src/features/<domain>/`)

Every business capability lives inside its dedicated domain directory under `src/features/`.

### Standard Feature Folder Layout
```text
src/features/<domain-name>/
├── index.ts                       # Public API barrel export (ONLY exported symbols accessible outside)
├── types.ts                       # Domain-specific TypeScript interfaces & types
├── schemas.ts                     # Zod request & response validation schemas
├── actions.ts                     # Domain Server Actions marked with "use server"
├── hooks/                         # Domain-specific React hooks (e.g. useInquiry.ts)
└── components/                    # Domain-specific React components (Max 300 lines per file)
```

### Feature Boundary Rules
1. **NO Cross-Feature Imports:** A feature under `src/features/auth/` **MUST NOT** import directly from `src/features/inquiries/`. 
2. **Public API Barrier (`index.ts`):** External code (pages or components) importing from a feature MUST import from `@/features/<domain>` (the barrel export), NEVER from deep internal files like `@/features/<domain>/components/sub-item.tsx`.
3. **Shared Utility Promotion:** If logic or UI is required by more than one feature, it MUST be promoted to `src/components/` or `src/lib/`.

---

## 4. Strict File Size & Cleanliness Rules

- **UI Component Files:** **MUST NOT** exceed **300 lines**. Large components must be split into sub-components under `src/features/<domain>/components/`.
- **Utility / Action Files:** **MUST NOT** exceed **200 lines**.
- **Naming Conventions:** All filenames **MUST** use lowercase `kebab-case` (e.g., `component-loader.tsx`, `redis-session.ts`).

---

## 5. Verification & Anti-Patterns

### Anti-Patterns to Avoid
- ❌ Creating monolithic 500+ line component files.
- ❌ Deep relative imports across feature boundaries (e.g. `import { x } from '../../auth/components/login-form'`).
- ❌ Placing domain business logic inside generic `src/components/ui/` primitives.

### Verification Commands
```bash
# Check for type errors and invalid feature imports
pnpm typecheck

# Run Biome linter to enforce code style and formatting
pnpm lint
```

---

## 6. Affected Documentation Updates
When modifying directory layouts or colocation rules, the following files MUST be updated:
- [docs/01-architecture/folder-structure.md](file:///d:/Work/React/cbs/finx-ui/docs/01-architecture/folder-structure.md)
- [AGENTS.md](file:///d:/Work/React/cbs/finx-ui/AGENTS.md)
- [README.md](file:///d:/Work/React/cbs/finx-ui/README.md)

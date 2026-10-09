# 📁 Domain-Driven Design (DDD) Folder Architecture & Colocation Rules

## 1. Executive Summary & Purpose
This document defines the official, production folder structure for `finxui-ref`. It enforces a **Domain-Driven Design (DDD)** / Feature-Sliced architecture customized for the Next.js 16 App Router (React 19).

This structure ensures clean separation of concerns, strict boundary isolation, zero cyclic dependencies, server-only safety, and predictable file locations for both human engineers and AI coding agents.

---

## 2. The Master Directory Tree (File-Level)

```text
finxui-ref/
├── .agents/                               # Antigravity agent configuration, skills & guardrails
│   ├── rules/                             # Architectural & styling rules (00-06, 99)
│   ├── skills/                            # Autonomous workflows (migrate-legacy, scaffold, grpc)
│   └── hooks.json                         # Automation event hooks
├── docs/                                  # Project documentation & operational manuals
│   ├── devs/                              # Developer guides (refactor, architecture, engine, apis)
│   └── manual/                            # Banking officer end-user operation guides
├── fixtures/                              # Static mock models and testing fixtures
│   ├── branches.ts, command.ts, enquiries.ts, menu.ts, specs.ts, users.ts
│   └── index.ts
├── proto/                                 # Protocol Buffer definitions
│   └── service.proto                      # gRPC CBS backend interface definitions
├── public/                                # Static client assets
├── scripts/                               # CLI & maintenance scripts
│   ├── cache-clear.ts                     # Redis cache clearing tool
│   └── proto-gen.ts                       # ts-proto code generation script
├── src/
│   ├── app/                               # Next.js App Router (Thin routing & API gateways)
│   │   ├── (auth)/                        # Unauthenticated route group
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (workbench)/                   # Authenticated workspace route group
│   │   │   ├── dashboard/                 # Overview dashboard (layout, error, page)
│   │   │   └── screen/[id]/               # Dynamic screen loader view (page, error, loading)
│   │   ├── [docs]/[[...slug]]/            # Built-in developer documentation portal
│   │   ├── api/                           # BFF Gateway & Route Handlers
│   │   │   ├── branches/route.ts          # Branch listings
│   │   │   ├── cache/route.ts             # Cache invalidation & status
│   │   │   ├── change-password/route.ts   # Password modification handler
│   │   │   ├── controls/route.ts          # UI form control schema endpoint
│   │   │   ├── login/route.ts             # Session creation
│   │   │   ├── logout/route.ts            # Session destruction
│   │   │   ├── menu/route.ts              # CBS navigation hierarchy
│   │   │   ├── model/[cmd]/route.ts       # Dynamic command execution endpoint
│   │   │   ├── proxy/route.ts             # Secure backend forwarding proxy
│   │   │   └── session/route.ts           # Session validation & heartbeat
│   │   ├── globals.css                    # Tailwind v4 theme & OKLCH color variables
│   │   ├── global-error.tsx               # Root exception boundary
│   │   ├── layout.tsx                     # Root HTML shell with zero-flash theme script
│   │   ├── not-found.tsx                  # 404 page
│   │   └── page.tsx                       # Root landing / redirect
│   │
│   ├── components/                        # Domain-Agnostic Reusable UI
│   │   ├── feedback/                      # ConfirmDialog, EmptyState, ErrorBoundary
│   │   ├── layout/                        # App shell components
│   │   │   ├── header/                    # BranchSwitcher, ThemeToggle, UserMenu
│   │   │   ├── tabs/                      # TabItem, TabWindowMenu
│   │   │   ├── app-alert.tsx              # Global toast/alert banners
│   │   │   ├── app-search.tsx             # Quick command search
│   │   │   ├── app-sidebar.tsx            # Left collateral menu navigation
│   │   │   ├── app-tabbar.tsx             # Multi-tab workspace strip
│   │   │   ├── app-timeout-watcher.tsx    # Inactivity watcher & auto-lock
│   │   │   ├── app-topbar.tsx             # Main header bar
│   │   │   └── workbench-shell.tsx        # Top-level workspace layout frame
│   │   └── ui/                            # shadcn/ui base primitives (button, dialog, input, etc.)
│   │
│   ├── features/                          # Domain-Driven Feature Slices
│   │   ├── auth/                          # Authentication & User Management
│   │   │   ├── components/                # login-form.tsx, change-password.tsx
│   │   │   ├── hooks/                     # use-user-rights.ts
│   │   │   ├── index.ts, schemas.ts, types.ts
│   │   ├── docs/                          # Built-in Doc Portal Feature
│   │   │   ├── components/                # doc-portal-layout, doc-sidebar, doc-search, mermaid, pdf/
│   │   │   ├── utils/                     # doc-file-reader.ts, pdf-compiler.ts
│   │   │   ├── actions.ts, config.ts, index.ts, types.ts
│   │   ├── screens/                       # Dynamic CBS Screen Subsystems
│   │   │   ├── enquiries/                 # Enquiry inquiry & table screens
│   │   │   │   ├── components/            # enquiry-screen, enquiry-table, enquiry-filters, header, skeleton
│   │   │   │   ├── index.ts, schemas.ts, types.ts
│   │   │   ├── forms/                     # Dynamic 12-column GMC form engine
│   │   │   │   ├── components/            # form-screen, form-grid, field-factory, actions/
│   │   │   │   ├── hooks/                 # use-form-schema.ts, use-form-state.ts
│   │   │   │   ├── utils/                 # schema-parser.ts
│   │   │   │   ├── index.ts, schemas.ts, types.ts
│   │   │   ├── utils/                     # menu-parser.ts
│   │   │   ├── launcher.ts                # Command launcher & window/tab router
│   │   │   ├── loader.tsx                 # Unified dynamic ComponentLoader
│   │   │   ├── registry.tsx               # Screen component registry
│   │   │   ├── index.ts, schemas.ts, types.ts
│   │   └── settings/                      # Officer preferences & workstation settings
│   │       ├── components/                # appearance, deactivate, profile, security, dialog
│   │       ├── index.ts, schemas.ts, types.ts
│   │
│   ├── hooks/                             # Application-wide React Hooks
│   │   ├── use-idle-timeout.ts            # Idle inactivity detection
│   │   ├── use-local-storage.ts           # Client persistence
│   │   └── use-mobile.ts                  # Responsive viewport detection
│   │
│   ├── lib/                               # Core Infrastructure & Backend Services
│   │   ├── config/                        # command-definitions, constants, env
│   │   ├── core/                          # commands, services orchestration
│   │   ├── grpc/                          # Server-only gRPC client, dispatch & generated stubs
│   │   │   ├── generated/                 # ts-proto generated TypeScript interfaces
│   │   │   ├── client.ts, dispatch.ts, struct.ts
│   │   ├── redis/                         # Redis cache, session & rate-limiting with circuit breakers
│   │   ├── services/                      # BFF services (branch, control, menu, model)
│   │   └── utils/                         # Client-safe formatters (account, currency, date, export, cn)
│   │
│   ├── store/                             # Zustand State Management
│   │   ├── alert/                         # Alert store & AlertProvider
│   │   ├── session/                       # Session store & SessionProvider
│   │   ├── workbench/                     # Tab & workspace management store & WorkbenchProvider
│   │   ├── theme-provider.tsx             # Dark/Light theme provider
│   │   └── index.ts
│   │
│   ├── types/                             # Global TypeScript declarations
│   └── proxy.ts                           # Next.js custom rewrite / forwarder helper
│
├── .env.example                           # Template environment configuration
├── .env.local                             # Local configuration (gRPC host, Redis, secrets)
├── biome.json                             # Biome formatter & linter configuration
├── components.json                        # shadcn/ui configuration
├── next.config.ts                         # Next.js compiler & server config
├── package.json                           # Dependencies & scripts
└── tsconfig.json                          # Strict TypeScript compiler options
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
├── actions.ts                     # Domain Server Actions marked with "use server" (optional)
├── hooks/                         # Domain-specific React hooks (e.g., use-form-schema.ts)
├── components/                    # Domain-specific React components (Max 300 lines per file)
└── utils/                         # Feature-specific parsing and transformation helpers
```

### Feature Boundary Rules
1. **NO Cross-Feature Deep Imports:** A feature under `src/features/auth/` **MUST NOT** import directly from `src/features/screens/forms/components/...`.
2. **Public API Barrier (`index.ts`):** External code (pages or layouts) importing from a feature MUST import from `@/features/<domain>` (the barrel export), NEVER from deep internal files.
3. **Shared Utility Promotion:** If logic or UI is required by more than one feature, it MUST be promoted to `src/components/` or `src/lib/`.
4. **Server-Only Boundary:** Core infrastructure modules (`src/lib/grpc/`, `src/lib/redis/`) import `server-only` to guarantee secrets and heavy Node.js modules are never bundled to the client browser.

---

## 4. Strict File Size & Cleanliness Rules

- **UI Component Files:** **MUST NOT** exceed **300 lines**. Large components must be split into sub-components under `src/features/<domain>/components/`.
- **Utility / Action Files:** **MUST NOT** exceed **200 lines**.
- **Naming Conventions:** All filenames **MUST** use lowercase `kebab-case` (e.g., `field-factory.tsx`, `menu-service.ts`, `workbench-store.ts`).

---

## 5. Verification & Anti-Patterns

### Anti-Patterns to Avoid
- ❌ Creating monolithic 500+ line component files.
- ❌ Deep relative imports across feature boundaries (e.g. `import { x } from '../../auth/components/login-form'`).
- ❌ Placing domain business logic inside generic `src/components/ui/` primitives.
- ❌ Initiating direct gRPC or database calls from client-rendered components.

### Verification Commands
```bash
# Check for type errors and invalid feature imports
pnpm typecheck

# Run Biome linter to enforce code style and formatting
pnpm lint
```

---

## 6. Affected Documentation Updates
When modifying directory layouts or colocation rules, the following files MUST be kept in sync:
- [docs/devs/01-architecture/folder-structure.md](file:///d:/CBS/In_house/finx/finxui-ref/docs/devs/01-architecture/folder-structure.md)
- [AGENTS.md](file:///d:/CBS/In_house/finx/finxui-ref/AGENTS.md)
- [README.md](file:///d:/CBS/In_house/finx/finxui-ref/README.md)


# Ultimate Enterprise Next.js BFF Architecture (Janata CBS)

This document defines the rigid, unbiased, military-grade folder architecture for the `janata-cbs` project. It adheres to the official Next.js App Router best practices and the industry-standard "Bulletproof React" (Feature-Sliced) Domain-Driven Design (DDD) pattern.

This structure is mandatory. It ensures infinite scalability, absolute security for backend secrets, and clean separation of concerns.

---

## The Master Architecture Tree

```text
janata-cbs/
├── AGENTS.md                          # Agent entry point & instructions
├── .agents/                           # Custom skills and domain rules
│   ├── project.md
│   ├── rules/
│   ├── workflows/
├── .env.example                       # Environment variable template
├── .env                               # Local runtime environment settings
├── package.json                       # Dependencies & build scripts
├── pnpm-lock.yaml                     # Locked package tree
├── tsconfig.json                      # Strict TypeScript compiler options
├── biome.json                         # Biome linter & formatter rules (strict any enforcement)
├── next.config.ts                     # Standalone output, security headers, typedRoutes
├── proto/                             # Raw .proto backend contracts
│   └── service.proto                  # Core banking gRPC service definitions
├── fixtures/                          # Sanitized GMC, menu & user schemas (offline mocks)
│   ├── users.ts                       # Static mock user accounts
│   ├── menu.ts                        # Static menu fallback data
├── scripts/                           # Utility tooling
│   └── proto-gen.ts                   # Output generator for gRPC stubs
├── docs/                              # Architectural documentation & runbooks
│   ├── ultimate-folder-architecture.md
│   ├── legacy-src-checklist.md
│   ├── refractor-checklist.md
│   └── future-architecture-upgrades.md
└── src/
    ├── proxy.ts                       # Next.js Middleware proxy & route protection helper
    ├── app/                           # Next.js App Router (Thin routing & API gateways)
    │   ├── layout.tsx                 # Root layout (zero-flash theme + global providers)
    │   ├── globals.css                # OKLCH design tokens & Tailwind v4 CSS utilities
    │   ├── page.tsx                   # Entry point redirect
    │   ├── not-found.tsx              # Generic 404 fallback page
    │   ├── global-error.tsx           # Global error boundary fallback page
    │   ├── favicon.ico / icon.png     # Application icons
    │   ├── (auth)/                    # Route group: Unauthenticated Auth pages
    │   │   ├── layout.tsx
    │   │   ├── login/
    │   │   │   └── page.tsx           # Login screen host
    │   │   └── change-password/
    │   │       └── page.tsx           # First-time password change screen host
    │   ├── (workbench)/               # Route group: Authenticated Workspace pages
    │   │   ├── dashboard/
    │   │   │   ├── layout.tsx
    │   │   │   ├── error.tsx
    │   │   │   └── page.tsx           # Officer dashboard / home
    │   │   └── screen/[id]/
    │   │       ├── loading.tsx
    │   │       ├── error.tsx
    │   │       └── page.tsx           # Dynamic GMC form screen host
    │   └── api/                       # BFF Server Gateways (Backend-For-Frontend)
    │       ├── branches/route.ts      # Branch list endpoint
    │       ├── cache/route.ts         # Redis cache invalidation endpoint
    │       ├── login/route.ts         # User login endpoint
    │       ├── logout/route.ts        # User logout endpoint
    │       ├── menu/route.ts          # Navigation menu schema endpoint
    │       ├── model/[cmd]/route.ts   # Dynamic form schema fetcher
    │       ├── session/route.ts       # Active user session manager endpoint
    │       └── proxy/route.ts         # Sole secure gateway to Java gRPC backend
    │
    ├── components/                    # Pure, Domain-Agnostic UI Components
    │   ├── ui/                        # Low-level primitive design tokens (shadcn/ui)
    │   │   ├── button.tsx, dialog.tsx, input.tsx, sidebar.tsx, etc.
    │   ├── layout/                    # Application Shell structural components
    │   │   ├── app-header.tsx, app-sidebar.tsx, app-tabbar.tsx, app-topbar.tsx
    │   │   ├── app-search.tsx, app-settings.tsx, theme-toggle.tsx, workbench-shell.tsx
    │   ├── feedback/                  # Generic status & feedback components
    │   │   ├── confirm-dialog.tsx, empty-state.tsx, error-boundary.tsx
    │   │   ├── global-alert-system.tsx, screen-loader.tsx
    │   └── providers/                 # React Context Providers
    │       ├── alert-provider.tsx, session-provider.tsx
    │       ├── theme-provider.tsx, workbench-provider.tsx
    │
    ├── features/                      # Domain-Driven Design (DDD) Feature Modules
    │   ├── auth/                      # Authentication domain module
    │   │   ├── index.ts               # Public API barrel export
    │   │   ├── actions.ts             # Server actions (logout/password reset)
    │   │   ├── schemas.ts             # Auth validation Zod schemas
    │   │   ├── types.ts               # Auth domain types
    │   │   └── components/            # LoginForm, ChangePassword
    │   ├── engine/                    # Platform: Dynamic Form Rendering Engine
    │   │   ├── index.ts               # Public API barrel export
    │   │   ├── types.ts               # Engine types & FormRendererProps
    │   │   ├── components/            # DynamicForm, FieldFactory, FormRenderer
    │   │   ├── hooks/                 # useFormState, useSchema
    │   │   └── schema/                # schema-parser.ts, schemas.ts (Zod GMC parser)
    │   ├── workspace/                 # Application Workspace & Shell Managers
    │   │   ├── index.ts               # Public API barrel export
    │   │   ├── types.ts               # Workspace state & tab types
    │   │   ├── components/            # ComponentLoader, ComponentRegistry
    │   │   ├── menu/                  # menu-parser.ts, schemas.ts (Menu parser)
    │   │   └── utils/                 # screen-launcher.ts (Window pop-outs)
    │   └── settings/                  # User Options & Preference Controls
    │       ├── index.ts               # Public API barrel export
    │       ├── schemas.ts, types.ts
    │       └── components/            # AppearanceTab, ProfileTab, SecurityTab
    │
    ├── hooks/                         # Shared React Client Hooks
    │   ├── use-local-storage.ts       # LocalStorage sync hook
    │   └── use-mobile.ts              # Responsive viewport detection hook
    │
    ├── lib/                           # Core Infrastructure & Backend Tools Layer
    │   ├── utils.ts                   # Classname merger (`cn`)
    │   ├── config/                    # Validated environment variables (`env.ts`, `constants.ts`)
    │   ├── core/                      # `server-only` locked infrastructure services
    │   │   ├── grpc.ts                # gRPC client connection pool & auth headers
    │   │   ├── redis-client.ts        # ioredis client with circuit breaker
    │   │   ├── redis-session.ts       # Opaque cookie & Redis session manager
    │   │   ├── dispatch.ts            # Dynamic network request dispatcher
    │   │   ├── cache.ts               # Multi-level spec & menu cache
    │   │   ├── rate-limit.ts          # Login IP rate limiter
    │   │   └── services.ts            # Backend microservice registry
    │   ├── grpc/                      # Compiled Protocol Buffer Stubs
    │   │   └── generated/             # AUTO-GENERATED STUBS BY PROTO-GEN
    │   │       ├── service.ts         # Main gRPC service definitions & binary codecs
    │   │       └── google/protobuf/   # Google protobuf struct helpers
    │   └── schema/                    # High-level data retrieval helpers
    │       ├── get-branches.ts, get-menu.ts, get-model.ts
    │
    ├── store/                         # Zustand Global State Stores
    │   ├── alert-store.ts             # Global confirmation dialog & alert state
    │   ├── session-store.ts           # Active officer session & branch state
    │   └── workbench-store.ts         # Tab workspace, active screens & window state
    │
    └── types/                         # Global TypeScript Ambient Definitions
        ├── index.ts                   # APIResponse envelope & ICommand definitions
        └── images.d.ts                # Static asset type declarations
```

---

## Detailed Architectural Breakdown & Enforcements

### Root-Level Configurations & Tooling
- **`.agents/` & `AGENTS.md`**: Dedicated configurations and entry points for AI agents. Contains workflows, project rules, and checklists to guarantee deterministic and robust assistance.
- **`next.config.ts`**: The sole configuration entry for Next.js, enforcing standalone outputs, security headers, and strictly typed routes.
- **`fixtures/`**: Contains static, sanitized mock data (e.g., `GMC` schemas) used when `MODEL_SOURCE=static`. Critical for offline development and e2e testing.
- **`proto/`**: The pure source of truth for `.proto` definitions. This directory serves as the input for `ts-proto` code generation.
- **`scripts/`**: Houses utility scripts like `proto-gen.ts` for stub generation and custom audit/grep checks.

### 1. `src/app/` - The Routing Layer
**Rule:** The `app/` directory is strictly for URL routing and API gateways. Pages must stay thin.
- **`(workbench)/`**: The primary authenticated application workspace.
- **`api/`**: The Backend-For-Frontend (BFF) gateways.
  - `proxy/route.ts`: Acts as the secure, authenticated single gateway for backend calls, translating HTTP payloads to internal gRPC requests.

### 2. `src/components/` - The Global UI Layer
**Rule:** Global UI components MUST be pure and domain-agnostic. No domain logic or feature imports are allowed here.
- **`ui/`**: Pure, dumb components generated by `shadcn/ui` (e.g., buttons, dialogs, inputs).
- **`layout/`**: Structural application pieces like the headers, sidebars, and tab bars.
- **`feedback/`**: Reusable generic state indicators (error boundaries, toast wrappers, skeletons).
- **`providers/`**: Global React Context providers (theme, store injection).

### 3. `src/features/engine/` - The Dynamic Rendering Platform
**Rule:** The engine is isolated from domain code and global stores. It purely processes raw data schemas into renderable forms.
- **`components/`**: Houses `FormGrid`, `ControlRenderer`, and `DynamicForm`.
- **`schema/`**: Transforms raw `GMC` backend payloads via Zod into a normalized, server-runnable UI model.

### 4. `src/features/` - The Domain Layer (Strict Colocation)
**Rule:** Everything related to a specific business capability must reside in its respective `features/<name>/` folder. A feature NEVER imports from another feature.
- **`workspace/`**: Contains shell logic, window managers, tab states, menu schemas, and `ComponentLoader.tsx`.

### 5. `src/lib/` - The Infrastructure Layer
**Rule:** All core backend connections (gRPC clients, Redis) MUST reside in `src/lib/core/` and start with the `import "server-only"` directive to prevent secret leaks to the client bundle.
- **`core/`**: Server-only executors (`grpc-client.ts`, `redis-client.ts`, `redis-session.ts`, `dispatch.ts`).
- **`schema/`**: Central Zod schemas for proxy request/response envelopes and validation allowlists.
- **`config/`**: Validated environment variables (`env.ts`).

### 6. Global Store & Types
- **`src/store/`**: Global Zustand factories (`workbench-store.ts`, `session-store.ts`, `alert-store.ts`).
- **`src/types/`**: Domain types and global declarations (`images.d.ts`).

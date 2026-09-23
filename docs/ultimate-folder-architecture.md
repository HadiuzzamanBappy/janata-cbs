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
├── .env.example                       # Every env var template (no secrets)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── biome.json                         # Biome linter & formatter rules
├── next.config.ts                     # Standalone output, security headers, typedRoutes
├── proto/                             # .proto sources for ts-proto
│   └── service.proto                  # Core banking gRPC service definitions
├── fixtures/                          # Sanitized menu + GMC schemas (offline mocks)
├── scripts/                           # Tooling (proto-gen.ts, audit greps)
├── docs/                              # Architectural documentation & runbooks
│   ├── ultimate-folder-architecture.md
│   ├── legacy-src-checklist.md
│   ├── refractor-checklist.md
│   └── future-architecture-upgrades.md
└── src/
    ├── proxy.ts                       # Middleware proxy helper
    ├── app/                           # App Router routes (thin pages)
    │   ├── layout.tsx                 # Root layout (zero-flash theme + providers)
    │   ├── globals.css                # OKLCH design tokens & CSS utilities
    │   ├── page.tsx                   # Entry redirect
    │   ├── not-found.tsx
    │   ├── global-error.tsx
    │   ├── (auth)/                    # Route group: Authentication
    │   │   ├── layout.tsx
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   └── change-password/
    │   │       └── page.tsx
    │   ├── (workbench)/               # Route group: Authenticated workspace
    │   │   ├── dashboard/
    │   │   │   └── page.tsx           # Officer dashboard / home
    │   │   └── screen/[id]
    │   │       └── page.tsx           # Dynamic screen engine host
    │   └── api/                       # BFF Server Gateways
    │       └── proxy/
    │           └── route.ts           # Sole secure gateway to Java gRPC
    │
    ├── components/                    # Generic presentation components
    │   ├── ui/                        # primitive design tokens (shadcn/ui)
    │   │   ├── button.tsx
    │   │   ├── dialog.tsx
    │   │   ├── input.tsx
    │   │   └── sidebar.tsx
    │   ├── layout/                    # Header, sidebar, tab-bar
    │   │   ├── app-header.tsx
    │   │   ├── app-sidebar.tsx
    │   │   └── tab-bar.tsx
    │   ├── feedback/                  # Toasts, boundaries, empty states
    │   │   └── toast.tsx
    │   └── providers/                 # Theme & state context providers
    │       ├── theme-provider.tsx
    │       └── workbench-provider.tsx
    │
    ├── features/                      # Domain-driven feature modules
    │   ├── auth/                      # Login & authentication logic
    │   ├── engine/                    # Platform: Schema → dynamic form engine
    │   │   ├── types.ts
    │   │   ├── components/            # FormGrid, ControlRenderer, DynamicForm
    │   │   ├── hooks/
    │   │   └── schema/
    │   ├── workspace/                 # Workspace tab/window managers
    │   │   ├── types.ts
    │   │   ├── components/            # ComponentLoader
    │   │   ├── menu/                  # Menu parsing & normalization
    │   │   └── utils/                 # Window pop-out management
    │   └── settings/                  # User options & theme controls
    │
    ├── lib/                           # Infrastructure layer
    │   ├── utils.ts                   # Classname utility (`cn`)
    │   ├── config/                    # Environment validation (`env.ts`)
    │   ├── core/                      # `server-only` guarded services
    │   │   ├── grpc-client.ts         # gRPC client connection
    │   │   ├── redis-client.ts        # ioredis client with circuit breaker
    │   │   ├── redis-session.ts       # Session management
    │   │   └── dispatch.ts            # Network dispatch strategy
    │   └── schema/                    # Zod schemas (auth, screen payloads)
    │       ├── auth.schema.ts
    │       └── screen.schema.ts
    │
    ├── store/                         # Zustand global state stores
    │   ├── workbench-store.ts
    │   ├── session-store.ts
    │   └── alert-store.ts
    │
    └── types/                         # TypeScript ambient type definitions
        ├── index.ts
        └── images.d.ts
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

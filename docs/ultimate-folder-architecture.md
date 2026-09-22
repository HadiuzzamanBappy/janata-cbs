# Ultimate Enterprise Next.js BFF Architecture

This document defines the rigid, unbiased, military-grade folder architecture for the `finxui-ref` project. It adheres to the official Next.js App Router best practices and the industry-standard "Bulletproof React" (Feature-Sliced) Domain-Driven Design (DDD) pattern.

This structure is mandatory. It ensures infinite scalability, absolute security for backend secrets, and clean separation of concerns.

---

## The Master Architecture Tree

```text
finx-ui/
├── AGENTS.md                          # agent entry point
├── .agents/
│   ├── project.md
│   ├── rules/
│   ├── workflows/
├── .env.example                       # every env var, no secrets
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── biome.json
├── next.config.ts                     # standalone output, security headers, typedRoutes
├── vitest.config.ts
├── playwright.config.ts
├── Dockerfile                         # multi-stage, non-root
├── proto/                             # .proto sources for ts-proto
├── fixtures/                          # sanitized menu + GMC schemas (tests and MODEL_SOURCE=static)
├── e2e/                               # Playwright specs
├── scripts/                           # proto-gen, audit greps
├── docs/
│   ├── architecture.md
│   └── runbook.md
├── public/
│   └── fonts/                         # local fonts for next/font/local
└── src/
    ├── instrumentation.ts             # logger init, onRequestError, SIGTERM cleanup
    ├── middleware.ts                  # cookie check only + config.matcher + /api → 401 JSON
    │
    ├── app/                           # routes only. Pages stay thin
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx
    │   ├── not-found.tsx
    │   ├── global-error.tsx
    │   ├── (auth)/
    │   │   └── login/
    │   │       └── page.tsx
    │   ├── (workbench)/               # Route group purely for organizing authenticated routes
    │   │   ├── dashboard/
    │   │   │   ├── layout.tsx         # server: verifySession() → <WorkbenchShell/> (Strictly here to prevent layout bleed)
    │   │   │   └── page.tsx           # server page → client host
    │   │   └── screen/
    │   │       └── [id]/
    │   │           ├── page.tsx       # Standalone popup window (no dashboard shell inherited)
    │   │           ├── loading.tsx
    │   │           └── not-found.tsx
    │   └── api/
    │       ├── login/
    │       │   └── route.ts
    │       ├── logout/
    │       │   └── route.ts
    │       ├── session/
    │       │   └── route.ts
    │       ├── proxy/
    │       │   └── route.ts           # the only gateway to gRPC
    │       ├── health/
    │       │   └── route.ts
    │       └── client-log/
    │           └── route.ts           # optional: sanitized browser errors
    │
    ├── components/
    │   ├── ui/                        # shadcn primitives. No domain imports
    │   │   ├── button.tsx
    │   │   ├── dialog.tsx
    │   │   └── input.tsx
    │   ├── layout/                    # topbar, tab-bar, sidebar, workbench-shell
    │   │   ├── topbar.tsx
    │   │   ├── tab-bar.tsx
    │   │   ├── sidebar.tsx
    │   │   └── workbench-shell.tsx
    │   ├── feedback/                  # error-boundary, empty/error state, skeletons, confirm-dialog
    │   │   ├── error-boundary.tsx
    │   │   ├── empty-state.tsx
    │   │   ├── skeletons.tsx
    │   │   └── confirm-dialog.tsx
    │   └── providers/                 # theme, store provider
    │       ├── theme-provider.tsx
    │       └── store-provider.tsx
    │
    ├── engine/                        # platform: schema → form. No domain, no global store
    │   ├── schema/                    # raw GMC → Zod → normalized UI model (server-runnable)
    │   ├── form/                      # per-form store, validators, server-error mapping
    │   ├── renderer/                  # form-renderer, field-registry, 12-col layout map
    │   ├── fields/                    # one file per field type
    │   └── dynamic-form.tsx           # composition + safe submit
    │
    ├── features/                      # domain code. Never imports another feature
    │   ├── auth/                      # login UI, schemas
    │   ├── workspace/                 # shell logic
    │   │   ├── component-loader.tsx   # per-screen error boundary
    │   │   ├── tab-manager.ts
    │   │   ├── window-manager.ts
    │   │   ├── menu/                  # menu model Zod schema, normalize, filter
    │   │   └── sync/                  # BroadcastChannel: channel.ts, messages.ts
    │   │       ├── channel.ts
    │   │       └── messages.ts
    │   ├── inquiries/
    │   │   ├── components/
    │   │   ├── schemas.ts
    │   │   └── types.ts
    │   ├── reporting/
    │   │   ├── components/
    │   │   ├── schemas.ts
    │   │   └── types.ts
    │   └── system-config/
    │       ├── components/
    │       ├── schemas.ts
    │       └── types.ts
    │
    ├── lib/
    │   ├── core/                      # server-only, every file starts with import "server-only"
    │   │   ├── grpc-client.ts         # one channel per process
    │   │   ├── dispatch.ts
    │   │   ├── redis.ts
    │   │   ├── session.ts
    │   │   ├── model-source.ts        # grpc | static (static throws in production)
    │   │   ├── errors.ts
    │   │   ├── logger.ts
    │   │   └── audit.ts
    │   ├── schema/                    # Zod: proxy request/response envelope, allowlists
    │   ├── config/                    # env.ts (validated), routes.ts, constants.ts, permissions.ts
    │   │   ├── env.ts
    │   │   ├── routes.ts
    │   │   ├── constants.ts
    │   │   └── permissions.ts
    │   └── utils/                     # pure only
    │       ├── cn.ts
    │       ├── format-money.ts
    │       ├── format-date.ts
    │       └── mask.ts
    │
    ├── grpc/                          # generated. Never edited, never imported by client code
    ├── hooks/                         # global UI hooks only
    │   ├── use-media-query.ts
    │   └── use-local-storage.ts
    ├── store/                         # Zustand factories: workbench, alerts, session (no token)
    │   ├── use-workbench-store.ts
    │   ├── use-alert-store.ts
    │   └── use-session-store.ts
    └── types/                         # domain types
        └── global.d.ts
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
  - `_registry/screens.ts`: The central registry mapping commands to lazy-loaded feature screens. This is the **only** file in the project permitted to import every feature domain.
- **`api/`**: The Backend-For-Frontend (BFF) gateways.
  - `proxy/route.ts`: Acts as the secure, authenticated single gateway for complex backend calls, translating HTTP payloads to internal gRPC requests.
  - `login/route.ts`, `logout/route.ts`, `session/route.ts`: Core authentication and cookie lifecycle handlers.

### 2. `src/components/` - The Global UI Layer
**Rule:** Global UI components MUST be pure and domain-agnostic. No domain logic or feature imports are allowed here.
- **`ui/`**: Pure, dumb components typically generated by `shadcn/ui` (e.g., buttons, dialogs, inputs).
- **`layout/`**: Structural application pieces like the `WorkbenchShell`, sidebars, and topbars.
- **`feedback/`**: Reusable generic state indicators (error boundaries, empty states, skeletons, confirm dialogs).
- **`providers/`**: Global React Context providers (theme, store injection).

### 3. `src/engine/` - The Dynamic Rendering Platform
**Rule:** The engine is isolated from domain code and global stores. It purely processes raw data schemas into renderable forms.
- **`schema/`**: Transforms raw `GMC` backend payloads via Zod into a normalized, server-runnable UI model.
- **`form/`**: Manages per-form state, local validators, and server-error mapping mechanisms.
- **`renderer/`**: The core form rendering loop mapping fields to the 12-column layout grid.
- **`fields/`**: Isolated implementations for each individual field type.
- **`dynamic-form.tsx`**: The top-level compositional component ensuring safe submission, parsing, and orchestration.

### 4. `src/features/` - The Domain Layer (Strict Colocation)
**Rule:** Everything related to a specific business capability must reside in its respective `features/<name>/` folder. A feature NEVER imports from another feature.
- **`workspace/`**: Contains the shell logic, window managers, tab states, menu schemas, and the crucial `component-loader.tsx` which provides per-screen error boundaries.
- **Feature Structure**: Each domain (e.g., `inquiries`, `auth`, `reporting`) is an isolated mini-app with its own `components/`, `schemas.ts`, and `types.ts`. If a feature is deleted, its entire ecosystem is removed cleanly without leaving dead code.

### 5. `src/lib/` - The Infrastructure Layer
**Rule:** All core backend connections (gRPC clients, Redis, Database) MUST reside in `src/lib/core/` and start with the `import "server-only"` directive to mathematically prevent secret leaks to the client bundle.
- **`core/`**: Server-only executors. Holds the singleton `grpc-client.ts`, `redis.ts`, `dispatch.ts`, and the `model-source.ts` strategy.
- **`schema/`**: Central Zod schemas for proxy request/response envelopes and system-wide allowlists.
- **`config/`**: Validated environment variables (`env.ts`), constants, routes, and permissions.
- **`utils/`**: Pure, stateless helper functions (e.g., class mergers like `cn`, date/money formatters).

### 6. Global Hooks & Store
- **`src/hooks/`**: Reusable, UI-specific client hooks only (e.g., `use-media-query`, `use-local-storage`).
- **`src/store/`**: Global Zustand factories. **Rule:** Only state that crosses multiple domains (e.g., active workspace tabs, global alerts, user session identity) belongs here. Per-feature state must stay in `features/`.

### 7. Global Types & Generated Code
- **`src/grpc/`**: Generated TypeScript output from `.proto` files. **Rule:** Never manually edit these files. They are automatically managed by `scripts/proto-gen.ts`.
- **`src/types/`**: Domain types and global declarations (e.g., `global.d.ts`).

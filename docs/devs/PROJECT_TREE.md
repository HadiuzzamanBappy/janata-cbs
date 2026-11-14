# Janata CBS Architecture & Project Tree Reference

> **System Profile:** Enterprise Core Banking Solution (CBS) Frontend & BFF  
> **Framework & Engine:** Next.js 16 (App Router) + React 19 + TypeScript (Strict) + Tailwind CSS v4 + Biome  
> **Target Scale:** 150 to 1,000 Dynamic Model Fields, Multi-Tab MDI Shell, Multi-Window Detached Popups with BroadcastChannel Sync  
> **Domain Invariants:** Pure TypeScript Subsystems, Unidirectional Layering, RIDASHL Security Matrix & Maker-Checker Four-Eyes Enforcement  
> **Purpose of this Document:** High-level architectural orientation for developers and AI agents. Focuses on **architectural anchors, subsystem boundaries, and entrypoints** rather than fragile micro-components.

---

## 1. High-Level Architectural Map & Layer Boundaries

```text
app ──> features ──> components ──> store ──> lib/cbs-* ──> lib/infra-* ──> types & data-schemas
```

1. **Strict Layer Directionality:**
   - Higher layers consume lower layers. Lower layers (`src/lib`, `src/types`, `src/store`) **never** import from `@/components`, `@/features`, or `@/app`.
   - Upward notifications from headless subsystems to React/UI use decoupled event adapters (e.g., `registerCommandAdapter`).
2. **Server/Client Boundary (`"server-only"`):**
   - Direct Redis (`ioredis`), gRPC (`@grpc/grpc-js`), and environment secrets live exclusively in server route handlers (`src/app/api/` and `src/lib/infra-*`).
   - Browser client interacts exclusively via the typed BFF proxy (`/api/proxy` via `@/lib/cbs-client`).
3. **Core Subsystem Anchors:**
   - **Form Engine (`src/features/form-engine`):** Headless 2-tier state kernel (`form-kernel-store.ts`) separating draft typing from record diffing. Supports arbitrary root layout ordering (independent fields, card containers, tab groups in any order).
   - **Inquiry Engine (`src/features/inquiry-engine`):** Dynamic parameter builder, real-time filtering, tabular data presentation, and PDF/Excel export.
   - **Visual Designers (`src/features/system/*`):** Drag-and-drop form canvas (`form-config`), query designer (`inquiry-config`), metamodel dictionary (`model-config`), and navigation tree hierarchy builder (`menu-designer`).

---

## 2. Architectural Anchor Tree

```text
janata-cbs/
├── .env.example / .env.local                  # Environment variable contract & local secrets
├── AGENTS.md                                  # Mandatory agent rules, quality gates & invariants
├── biome.json                                 # Biome linter, formatter & import sorting configuration
├── package.json                               # Dependencies & verification scripts
├── tsconfig.json                              # TypeScript strict configuration & module path aliases
│
├── .agents/                                   # Domain Skills & Architectural Runbooks
│   ├── rules/                                 # Invariant rules (pillars, layers, react19, security, tokens)
│   └── skills/                                # Domain skills (access-control, wire-protocol, form-lifecycle, etc.)
│
├── docs/                                      # Enterprise Documentation & Manuals
│   ├── devs/                                  # Developer deep-dive guides (study plans, checklists, project tree)
│   └── manual/                                # Core banking business & operator manuals
│
├── mock/                                      # Offline Core Banking Simulator & Database Fixtures
│   ├── core/                                  # In-Memory Banking Protocol Simulator (@mock/core)
│   │   ├── handlers/                          # Protocol verb handlers (query, mutation, inquiry, menu, model)
│   │   ├── auth-simulator.ts                  # Mock operator authentication & JWT issuer
│   │   ├── database-router.ts                 # Dynamic table router resolving canonical DB tables
│   │   └── response-factory.ts                # Canonical CBS wire envelope factories
│   └── db/                                    # Simulated Core Banking In-Memory Tables (@mock/db)
│       ├── rawResponse/                       # Raw core JSON snapshots (formConfig, inquiryResult, menuTree, etc.)
│       └── [TABLES].ts                        # Canonical tables (AC_ACCOUNT, CUST_CUSTOMER, SC_FORM_CONFIG, etc.)
│
├── proto/                                     # Protobuf Definitions for Core Banking gRPC Host
│   └── service.proto                          # Wire protocol buffer schema for CBS core service
│
├── scripts/                                   # Standalone Tooling & Verification Harnesses
│   ├── cache/                                 # Redis cache maintenance scripts (clear, inspect)
│   ├── tools/                                 # Generator utilities (proto-gen, fixture-normalize)
│   └── verify/                                # 13 Automated Verification Suites (pnpm verify:all)
│       ├── verify-all.ts                      # Master runner executing all 13 domain test suites
│       └── verify-*.ts                        # Dedicated suites (access, client, command, form-spec, record, etc.)
│
└── src/                                       # Janata CBS Application Source Code
    ├── proxy.ts                               # Route session validation & security middleware
    │
    ├── app/                                   # Next.js 16 App Router (Layouts, Pages & BFF Endpoints)
    │   ├── (auth)/                            # Public operator authentication (login, change-password)
    │   ├── (docs)/                            # In-app markdown documentation portal (devs, manual)
    │   ├── (workbench)/                       # Core Banking Multi-Tab Workstation (MDI)
    │   │   ├── dashboard/                     # Operator overview dashboard & quick widgets
    │   │   └── screen/[id]/                   # Dynamic screen host (e.g. CUST.PROFILE, AC.OPEN)
    │   └── api/                               # Server-Side Backend-For-Frontend (BFF) Routes
    │       ├── proxy/route.ts                 # Canonical gRPC Gateway Proxy Route
    │       ├── login/route.ts                 # Operator authentication & session cookie minting
    │       ├── logout/route.ts                # Session revocation & cookie cleanup
    │       ├── session/route.ts               # Active session & branch context resolver
    │       ├── change-password/route.ts       # Authenticated password update endpoint
    │       └── cache/route.ts                 # Server cache invalidation endpoint
    │
    ├── components/                            # Reusable UI Primitives & CBS Scaffolding
    │   ├── cbs-command/                       # Global Command Gateway Bar (Ctrl+K, grammar parser, navigation modal)
    │   ├── cbs-screen/                        # Standard Banking Screen Layout & Lifecycle Scaffolding
    │   │   ├── header/                        # Action bars (active/idle actions, record-lookup-bar, validation checklist)
    │   │   ├── hooks/                         # Screen lifecycle hooks (use-cbs-persistence, use-guarded-action, use-record-lookup)
    │   │   ├── states/                        # Standard states (cbs-idle-state, cbs-error-state, cbs-system-skeleton)
    │   │   ├── tabs/                          # Standard metadata tabs (cbs-audit-tab, cbs-json-viewer-tab)
    │   │   └── cbs-screen-scaffold.tsx        # Outer container standardizing header, content & footer
    │   ├── cbs-settings/                      # Workstation Preferences Dialog (Appearance, profile, security, deactivation)
    │   ├── feedback/                          # Modal dialogs, empty states & error boundaries
    │   ├── layout/                            # Shell scaffolding (workbench-shell, app-sidebar, app-tabbar, timeouts)
    │   │   ├── sidebar/                       # Navigation tree, branch switcher & theme toggle
    │   │   └── tabs/                          # MDI Multi-tab bar & detached multi-window controls
    │   └── ui/                                # Atomic Design System Primitives (Tailwind v4 semantic tokens)
    │
    ├── features/                              # Domain Application Engines & Bespoke Screens
    │   ├── auth/                              # Operator login & password management flows
    │   ├── docs/                              # In-app Markdown/Mermaid docs viewer & PDF compiler
    │   ├── form-engine/                       # Headless Atomized Form Kernel (150-1000 fields)
    │   │   ├── components/                    # form-renderer, field-atom, field-grid, field-row, object-field
    │   │   │   ├── containers/                # Grouping layout containers (card-container, tab-group-container)
    │   │   │   └── widgets/                   # High-density typed inputs (amount, date, rate, select, text, etc.)
    │   │   ├── store/                         # Headless 2-tier state kernel (form-kernel-store.ts)
    │   │   └── hooks/                         # use-field-options, use-model-lookup, use-multi-value
    │   ├── inquiry-engine/                    # Dynamic Enquiry & Report Rendering Engine
    │   │   ├── components/                    # inquiry-renderer, inquiry-grid, inquiry-filter-bar, pagination
    │   │   ├── store/                         # Isolated inquiry state store (inquiry-store.ts)
    │   │   └── hooks/                         # use-inquiry-execution, use-inquiry-filters, use-inquiry-export
    │   ├── operations/                        # Generic screens (cbs-form-screen, cbs-inquiry-screen)
    │   ├── system/                            # Banking System Administration & Visual Designers
    │   │   ├── form-config/                   # Visual Form Designer (GMC Screen Config Studio)
    │   │   │   ├── components/designer/       # DnD canvas, field palette, property inspector, 12-col grid
    │   │   │   ├── hooks/                     # use-form-config, use-fc-field-movement, use-fc-persistence
    │   │   │   └── sys-form-config.tsx        # Form Designer screen entrypoint
    │   │   ├── inquiry-config/                # Inquiry Designer Studio (SC_INQUIRY_CONFIG)
    │   │   │   ├── components/                # Column configurator, filter builder, actions, preview
    │   │   │   ├── hooks/                     # use-inquiry-config, use-ic-column-ops, use-ic-filter-ops
    │   │   │   └── sys-inquiry-config.tsx     # Inquiry Designer screen entrypoint
    │   │   ├── menu-designer/                 # Menu Designer Studio (SC_MENU_TREE)
    │   │   │   ├── components/canvas/         # Visual tree canvas, sidebar preview, node inspector
    │   │   │   ├── hooks/                     # use-menu-designer, use-canvas-dnd, use-md-tree-ops
    │   │   │   └── sys-menu-designer.tsx      # Menu Designer screen entrypoint
    │   │   └── model-config/                  # Metamodel Dictionary Studio (SC_MODEL_CONFIG)
    │   │       ├── components/property/       # Property list, inspector, sub-properties, lookups
    │   │       ├── hooks/                     # use-model-config, use-mc-property-ops, use-mc-actions
    │   │       └── sys-model-config.tsx       # Metamodel Studio screen entrypoint
    │   └── workbench/                         # MDI Dynamic Screen Loader & Component Registry
    │       ├── loader.tsx                     # Dynamic screen component resolver & runtime loader
    │       └── registry.tsx                   # Central registry mapping Screen IDs to UI components
    │
    ├── hooks/                                 # Global React Hooks (use-container-width, use-idle-timeout, use-mobile)
    │
    ├── lib/                                   # Headless CBS Core Banking Subsystems (Pure TypeScript)
    │   ├── cbs-access/                        # Banking Entitlements (RIDASHL) & Four-Eyes Security Matrix
    │   ├── cbs-client/                        # Canonical Typed Wire Protocol Client SDK & Payload Factories
    │   ├── cbs-command/                       # Terminal Command Grammar, Aliases & Dispatcher Engine
    │   ├── cbs-form-spec/                     # Form Schema Compiler & 12-Column Grid Coordinate Engine
    │   ├── cbs-hotkeys/                       # Terminal Banking Keyboard Shortcuts Engine (F2, F5, F8, F10)
    │   ├── cbs-record/                        # Deep Mutation Delta Engine (Touch-only commit payloads)
    │   ├── cbs-screen/                        # Screen Lifecycle, Persistence Orchestrator & BroadcastChannel Bus
    │   ├── core-config/                       # Isomorphic Configuration & Environment Secrets
    │   ├── core-logger/                       # Banking-Grade Structured Logger & PII Redaction
    │   ├── core-utils/                        # Pure Formatting (currency, date, account-mask, formula, id)
    │   ├── data-parsers/                      # Wire Decoders & Protobuf Unpackers
    │   ├── data-schemas/                      # Zod Runtime Schemas & Domain Invariant Contracts
    │   ├── infra-grpc/                        # Server-Only HTTP/2 gRPC Transport ("server-only")
    │   └── infra-redis/                       # Server-Only Redis Session & Cache ("server-only")
    │
    ├── store/                                 # Global Client State Management (Zustand & Context)
    │   ├── alert/                             # Global toast & notification alerts store
    │   ├── session/                           # Operator session, clearance & branch context store
    │   ├── theme/                             # Workstation theme, accent color & density store
    │   ├── workbench/                         # MDI Multi-tab state (open tabs, active tab, pinned, dirty)
    │   └── root-provider.tsx                  # Master composite provider wrapping all global stores
    │
    └── types/                                 # Canonical Core Banking TypeScript Contracts
        ├── access.ts                          # RIDASHL permission strings & Four-Eyes clearance levels
        ├── protocol.ts                        # CBS wire envelope, payload structure & gRPC status codes
        ├── screen.ts                          # Screen metadata, action codes, and navigation models
        └── status.ts                          # Transaction lifecycle statuses (Draft, Pending, Authorized)
```

---

## 3. Subsystem Cross-Reference Guide

| Domain Subsystem              | Architectural Location                                                                                                                                                               | Primary Role & Invariants                                                 |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------ |
| **Authentication & Session**  | [`src/features/auth/`](file:///d:/Work/React/cbs/janata-cbs/src/features/auth), [`src/store/session/`](file:///d:/Work/React/cbs/janata-cbs/src/store/session)                       | Operator login, credentials change, session cookie management.            |
| **Access Rights & Four-Eyes** | [`src/lib/cbs-access/`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-access)                                                                                                     | Pure TS evaluation of RIDASHL capabilities and Maker $\neq$ Checker rule. |
| **Command Gateway**           | [`src/components/cbs-command/`](file:///d:/Work/React/cbs/janata-cbs/src/components/cbs-command), [`src/lib/cbs-command/`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-command) | Terminal syntax parser, aliases, and screen navigation router.            |
| **BFF Wire Client**           | [`src/lib/cbs-client/`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-client), [`src/app/api/proxy/`](file:///d:/Work/React/cbs/janata-cbs/src/app/api/proxy)                     | Typed request payload factories dispatched strictly via `/api/proxy`.     |
| **Form Engine Kernel**        | [`src/features/form-engine/`](file:///d:/Work/React/cbs/janata-cbs/src/features/form-engine), [`src/lib/cbs-form-spec/`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-form-spec) | Zero-lag 150–1000 field rendering with 2-tier state & 12-col grid.        |
| **Record Delta Mutations**    | [`src/lib/cbs-record/`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-record)                                                                                                     | Baseline snapshot vs modified state diffing for touch-only commits.       |
| **Inquiry Engine**            | [`src/features/inquiry-engine/`](file:///d:/Work/React/cbs/janata-cbs/src/features/inquiry-engine)                                                                                   | Tabular enquiry execution, real-time filtering, PDF/Excel generation.     |
| **Visual Form Designer**      | [`src/features/system/form-config/`](file:///d:/Work/React/cbs/janata-cbs/src/features/system/form-config)                                                                           | Visual DnD layout builder supporting root fields, cards, and tab groups.  |
| **Menu Hierarchy Designer**   | [`src/features/system/menu-designer/`](file:///d:/Work/React/cbs/janata-cbs/src/features/system/menu-designer)                                                                       | Visual navigation tree builder and hierarchy reordering.                  |
| **Metamodel Dictionary**      | [`src/features/system/model-config/`](file:///d:/Work/React/cbs/janata-cbs/src/features/system/model-config)                                                                         | Data dictionary schema definitions, datatypes, and foreign lookups.       |
| **Screen Lifecycle**          | [`src/components/cbs-screen/`](file:///d:/Work/React/cbs/janata-cbs/src/components/cbs-screen), [`src/lib/cbs-screen/`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-screen)     | Standard action headers, persistence workflows, cross-tab bus sync.       |
| **MDI Workbench Shell**       | [`src/components/layout/`](file:///d:/Work/React/cbs/janata-cbs/src/components/layout), [`src/store/workbench/`](file:///d:/Work/React/cbs/janata-cbs/src/store/workbench)           | Multi-tab bar, detached popup windows, and navigation sidebar.            |
| **Mock Core Simulator**       | [`mock/core/`](file:///d:/Work/React/cbs/janata-cbs/mock/core), [`mock/db/`](file:///d:/Work/React/cbs/janata-cbs/mock/db)                                                           | Offline simulated core banking protocol handlers and DB fixtures.         |
| **Verification Test Suite**   | [`scripts/verify/`](file:///d:/Work/React/cbs/janata-cbs/scripts/verify)                                                                                                             | 13 standalone TSX verification runners guaranteeing domain invariants.    |

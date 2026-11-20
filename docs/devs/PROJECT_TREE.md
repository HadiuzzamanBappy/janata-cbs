# Janata CBS Architecture & Project Tree Reference

> **System Profile:** Enterprise Core Banking Solution (CBS) Frontend & BFF  
> **Framework & Engine:** Next.js 16 (App Router) + React 19 + TypeScript (Strict) + Tailwind CSS v4 + Biome  
> **Target Scale:** 150 to 1,000 Dynamic Model Fields, Multi-Tab MDI Shell, Multi-Window Detached Popups with BroadcastChannel Sync  
> **Domain Invariants:** Pure TypeScript Subsystems, Unidirectional Layering, RIDASHL Security Matrix & Maker-Checker Four-Eyes Enforcement  
> **Purpose of this Document:** High-level architectural orientation for developers and AI agents. Focuses on **architectural anchors, subsystem boundaries, and entrypoints** rather than fragile micro-components.

---

## 1. High-Level Architectural Map & Layer Boundaries

```text
app → features → components → hooks → store → lib/cbs-*, core-utils → lib/infra-*, core-config, core-logger, data-parsers → types, data-schemas
```

1. **Strict Layer Directionality:**
   - Higher layers consume lower layers (the ranks enforced by `pnpm verify:layers` are the `LAYERS` table in `scripts/verify/verify-layers.ts`). Lower layers (`src/lib`, `src/types`, `src/store`) **never** import from `@/components`, `@/features`, or `@/app`.
   - Upward notifications from headless subsystems to React/UI use decoupled event adapters (e.g., `registerCommandAdapter`).
2. **Server/Client Boundary (`"server-only"`):**
   - Direct Redis (`ioredis`), gRPC (`@grpc/grpc-js`), and environment secrets live exclusively in server route handlers (`src/app/api/` and `src/lib/infra-*`).
   - Browser client interacts exclusively via the typed BFF proxy (`/api/proxy` via `@/lib/cbs-client`).
3. **Core Subsystem Anchors:**
   - **Form Engine (`src/components/cbs-form-engine`):** Renders compiled form specs; form values stay with the screen (`useCbsPersistence`). Supports arbitrary root layout ordering (independent fields, card containers, tab groups in any order).
   - **Inquiry Engine (`src/components/cbs-inquiry-engine`):** Config-driven filter bar, result table, client-side paging and sorting, and row commands. Export (CSV, HTML, XML) and print live in the inquiry header (`src/components/cbs-screen/header`).
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
│   ├── devs/                                  # Developer portal (roadmap, audit checklist, project tree, alignment plan)
│   └── manual/                                # Core banking business & operator manuals
│
├── mock/                                      # Offline Core Banking Simulator & Database Fixtures
│   ├── core/                                  # In-Memory Banking Protocol Simulator (@mock/core)
│   │   ├── handlers/                          # Protocol verb handlers (query, mutation, inquiry, menu, model)
│   │   ├── index.ts                           # Public entry: mockDispatch / mockProcess / handleLogin (used when DATA_SOURCE=static)
│   │   ├── database-router.ts                 # Dynamic table router resolving canonical DB tables
│   │   └── response-factory.ts                # Canonical CBS wire envelope factories
│   └── db/                                    # Simulated Core Banking In-Memory Tables (@mock/db)
│       ├── .rawResponse/                      # Raw core JSON snapshots (formConfig, inquiryResult, menuTree, etc.)
│       └── [TABLES].ts                        # Canonical tables (AC_ACCOUNT, CUST_CUSTOMER, SC_FORM_CONFIG, etc.)
│
├── proto/                                     # Protobuf Definitions for Core Banking gRPC Host
│   └── service.proto                          # Wire protocol buffer schema for CBS core service
│
├── scripts/                                   # Standalone Tooling & Verification Harnesses
│   ├── cache/                                 # Redis cache maintenance scripts (clear, inspect)
│   ├── tools/                                 # Generator utilities (proto-gen, fixture-normalize)
│   └── verify/                                # 17 verification suites (16 offline via pnpm verify:all, plus verify:api)
│       ├── verify-all.ts                      # Master runner executing the 16 offline suites
│       └── verify-*.ts                        # Dedicated suites (access, client, command, form-spec, record, etc.)
│
└── src/                                       # Janata CBS Application Source Code
    ├── proxy.ts                               # Route session validation & security middleware
    │
    ├── app/                                   # Next.js 16 App Router (Layouts, Pages & BFF Endpoints)
    │   ├── (auth)/                            # Public operator authentication (login, change-password)
    │   ├── (docs)/                            # In-app markdown documentation portal (devs, manual)
    │   ├── (workbench)/                       # Core Banking Multi-Tab Workstation (MDI)
    │   │   ├── dashboard/                     # Main shell: renders the open workbench tabs (panel mode)
    │   │   └── screen/[id]/                   # Detached popup window for one screen (window mode)
    │   └── api/                               # Server-Side Backend-For-Frontend (BFF) Routes
    │       ├── proxy/route.ts                 # Canonical gRPC Gateway Proxy Route
    │       ├── login/route.ts                 # Operator authentication & session cookie minting
    │       ├── logout/route.ts                # Session revocation & cookie cleanup
    │       ├── session/route.ts               # Active session & branch context resolver
    │       ├── change-password/route.ts       # Authenticated password update endpoint
    │       ├── cache/route.ts                 # Token-guarded cache invalidation (DELETE)
    │       └── _lib/                          # Shared route helpers (buildGrpcEnvelope, response helpers)
    │
    ├── components/                            # Reusable UI Primitives & CBS Scaffolding
    │   ├── cbs-command/                       # Global Command Gateway Bar (Ctrl+K, grammar parser, navigation modal)
    │   ├── cbs-form-engine/                   # Headless Dynamic Form Presentation Engine (FormRenderer, FormPreview)
    │   │   ├── components/                    # form-renderer, field-grid, field-row, object-field
    │   │   │   ├── containers/                # Grouping layout containers (card-container, tab-group-container)
    │   │   │   └── widgets/                   # High-density typed inputs (amount, date, rate, select, text, etc.)
    │   │   └── hooks/                         # use-field-options, use-model-lookup, use-multi-value
    │   ├── cbs-inquiry-engine/                # Inquiry rendering (InquiryTable, InquiryFilterBar) + runInquiry()
    │   │   ├── components/                    # inquiry-table, inquiry-filter-bar, pagination, row actions
    │   │   └── hooks/                         # use-inquiry-pagination, use-inquiry-sort
    │   ├── cbs-menu/                          # Universal UI Navigation Menu Renderer (CbsMenuTree, CbsMenuTreeItem)
    │   │   ├── components/                    # cbs-menu-tree, cbs-menu-tree-item
    │   │   ├── hooks/                         # use-cbs-menu (active tree query)
    │   │   └── utils.ts                       # Tree traversal, active child matching & command resolution
    │   ├── cbs-screen/                        # Standard Banking Screen Layout & Lifecycle Scaffolding
    │   │   ├── header/                        # Action bars (active/idle actions, record-lookup-bar, validation checklist)
    │   │   ├── hooks/                         # Screen lifecycle hooks (use-cbs-persistence, use-guarded-action, use-record-lookup)
    │   │   ├── states/                        # Standard states (cbs-idle-state, cbs-error-state, cbs-system-skeleton)
    │   │   ├── tabs/                          # Standard metadata tabs (cbs-audit-tab, cbs-json-viewer-tab)
    │   │   └── cbs-screen-scaffold.tsx        # Outer container standardizing header, content & footer
    │   ├── cbs-settings/                      # Workstation Preferences Dialog (Appearance, profile, security, deactivation)
    │   ├── feedback/                          # Confirm dialog, empty state, error boundary
    │   ├── layout/                            # Shell scaffolding (workbench-shell, app-sidebar, app-tabbar, timeouts)
    │   │   ├── sidebar/                       # Navigation tree, branch switcher & theme toggle
    │   │   └── tabs/                          # MDI Multi-tab bar & detached multi-window controls
    │   └── ui/                                # Atomic Design System Primitives (Tailwind v4 semantic tokens)
    │
    ├── features/                              # Pure Banking Domain Screens & Workflows
    │   ├── auth/                              # Operator login & password management flows
    │   ├── docs/                              # In-app Markdown/Mermaid docs viewer & PDF compiler
    │   ├── operations/                        # Generic screens (forms/ops-form.tsx, inquiries/ops-inquiry.tsx)
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
    │   │   │   ├── components/canvas/         # Catalog, tree canvas, node inspector, menu-tree/ subcomponents
    │   │   │   ├── fields/                    # Declarative form specs (md-general-fields, md-inspector-fields)
    │   │   │   ├── hooks/                     # use-menu-designer, use-canvas-dnd, use-md-tree-ops
    │   │   │   └── sys-menu-designer.tsx      # Menu Designer screen entrypoint
    │   │   └── model-config/                  # Metamodel Dictionary Studio (SC_MODEL_CONFIG)
    │   │       ├── components/property/       # Property list, inspector, sub-properties, lookups
    │   │       ├── hooks/                     # use-model-config, use-mc-property-ops, use-mc-actions
    │   │       └── sys-model-config.tsx       # Metamodel Studio screen entrypoint
    │   └── workbench/                         # MDI Dynamic Screen Loader & Component Registry
    │       ├── loader.tsx                     # ScreenLoader: renders a tab or popup screen
    │       ├── registry.tsx                   # resolveScreen(): alias → BESPOKE_SCREENS → INQ → OpsForm
    │       └── standalone-screen.tsx          # Popup host: rebuilds the tab from URL + draft, docks back
    │
    ├── hooks/                                 # Shared hooks (use-cbs-access, use-idle-timeout, use-single-tab, use-activity-reporter, use-container-width, use-mobile)
    │
    ├── lib/                                   # Headless CBS Core Banking Subsystems (Pure TypeScript)
    │   ├── cbs-access/                        # Banking Entitlements (RIDASHL) & Four-Eyes Security Matrix
    │   ├── cbs-client/                        # Canonical Typed Wire Protocol Client SDK & Payload Factories
    │   ├── cbs-command/                       # Terminal Command Grammar, Aliases & Dispatcher Engine
    │   ├── cbs-form-spec/                     # Form Schema Compiler & 12-Column Grid Coordinate Engine
    │   ├── cbs-hotkeys/                       # Screen keys (F2, F5–F8, F10, Esc) and Ctrl+K
    │   ├── cbs-inquiry-spec/                  # Inquiry columns, filter serialization, row command templates
    │   ├── cbs-record/                        # Deep Mutation Delta Engine (Touch-only commit payloads)
    │   ├── cbs-screen/                        # Screen Lifecycle, Persistence Orchestrator & BroadcastChannel Bus
    │   ├── core-config/                       # Isomorphic Configuration & Environment Secrets
    │   ├── core-logger/                       # Banking-Grade Structured Logger & PII Redaction
    │   ├── core-utils/                        # cn, currency, date, export (CSV/HTML/XML), id, cbsStorage, string
    │   ├── data-parsers/                      # Wire Decoders & Protobuf Unpackers
    │   ├── data-schemas/                      # Zod Runtime Schemas & Domain Invariant Contracts
    │   ├── infra-grpc/                        # Server-Only HTTP/2 gRPC Transport ("server-only")
    │   └── infra-redis/                       # Server-Only Redis Session & Cache ("server-only")
    │
    ├── store/                                 # Global Client State Management (Zustand & Context)
    │   ├── alert/                             # Confirmation dialog store
    │   ├── session/                           # Operator session, clearance & branch context store
    │   ├── theme/                             # Theme provider (next-themes) and accent hook
    │   ├── workbench/                         # Workbench tabs (open tabs, active tab, drafts, dirty)
    │   ├── scoped-store.ts                    # useLazyStore / useScopedStore
    │   └── root-provider.tsx                  # CbsAppStoreProvider (mounted by the shell and each popup)
    │
    └── types/                                 # Canonical Core Banking TypeScript Contracts
        ├── access.ts                          # RIDASHL record functions, labels, controlled functions
        ├── protocol.ts                        # CBS wire envelope, payload structure & gRPC status codes
        ├── screen.ts                          # Screen metadata, action codes, and navigation models
        └── status.ts                          # Transaction lifecycle statuses (Draft, Pending, Authorized)
```

---

## 3. Subsystem Cross-Reference Guide

| Domain Subsystem              | Architectural Location                                      | Primary Role & Invariants                                                 |
| :---------------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------ |
| **Authentication & Session**  | `src/features/auth/`, `src/store/session/`                  | Operator login, credentials change, session cookie management.            |
| **Access Rights & Four-Eyes** | `src/lib/cbs-access/`                                       | Pure TS evaluation of RIDASHL capabilities and Maker $\neq$ Checker rule. |
| **Command Gateway**           | `src/components/cbs-command/`, `src/lib/cbs-command/`       | Terminal syntax parser, aliases, and screen navigation router.            |
| **BFF Wire Client**           | `src/lib/cbs-client/`, `src/app/api/proxy/`                 | Typed request payload factories dispatched strictly via `/api/proxy`.     |
| **Form Engine**               | `src/components/cbs-form-engine/`, `src/lib/cbs-form-spec/` | Spec-driven rendering on a 12-col grid; values stay with the screen.      |
| **Record Delta Mutations**    | `src/lib/cbs-record/`                                       | Baseline snapshot vs modified state diffing for touch-only commits.       |
| **Inquiry Engine**            | `src/components/cbs-inquiry-engine/`                        | Inquiry execution, filtering, paging and row commands.                    |
| **Visual Form Designer**      | `src/features/system/form-config/`                          | Visual DnD layout builder supporting root fields, cards, and tab groups.  |
| **Menu Hierarchy Designer**   | `src/features/system/menu-designer/`                        | Visual navigation tree builder and hierarchy reordering.                  |
| **Metamodel Dictionary**      | `src/features/system/model-config/`                         | Data dictionary schema definitions, datatypes, and foreign lookups.       |
| **Screen Lifecycle**          | `src/components/cbs-screen/`, `src/lib/cbs-screen/`         | Standard action headers, persistence workflows, cross-tab bus sync.       |
| **MDI Workbench Shell**       | `src/components/layout/`, `src/store/workbench/`            | Multi-tab bar, detached popup windows, and navigation sidebar.            |
| **Mock Core Simulator**       | `mock/core/`, `mock/db/`                                    | Offline simulated core banking protocol handlers and DB fixtures.         |
| **Verification Test Suite**   | `scripts/verify/`                                           | 17 standalone TSX verification runners guaranteeing domain invariants.    |

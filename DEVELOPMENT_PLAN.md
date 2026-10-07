# FinX Core Banking UI — Feature Architecture & Development Plan

## 1. Executive Summary & Vision

This document records the implemented modular, clean architecture for **FinX-UI** (Core Banking System Client).
It establishes a strict separation of concerns:
1. **Universal CBS Runtime Engines** (`src/features/screens/`): Interpreters dynamically rendering forms and inquiry grids from backend JSON schemas.
2. **Bespoke Administrative Screens** (`src/features/system/`): Interactive visual canvases (Visual Menu Designer, Report Studio, COB Batch Pipeline, RBAC User Security).
3. **Shared CBS Primitives** (`src/features/screens/shared/`): Unified CBS UI components (`<CbsFormHeader />`, `<CbsIdleState />`, `<CbsAuditFooter />`, action toolbars).
4. **Central CBS Micro-Client Gateway** (`src/lib/cbs-client/`): Single source of truth for all CBS backend wire request types, control tables, payload builders, and network transport.
5. **App Utilities & Modals** (`src/features/auth/`, `src/features/settings/`, `src/features/docs/`): Decoupled application shell features.

---

## 2. Implemented Clean Architecture (`src/`)

```
src/
├── features/
│   ├── screens/                    # 1. CORE RUNTIME CBS ENGINES & DISPATCHER
│   │   ├── forms/                  #    Dynamic Form Engine (JSON Schema -> Field Grid)
│   │   │   ├── components/         #    form-grid, field-factory, actions/
│   │   │   ├── hooks/              #    use-form-state, use-form-schema, use-form-persistence
│   │   │   └── utils/              #    record-finder, record-normalizer
│   │   │
│   │   ├── inquiries/              #    Dynamic Inquiry Grid Engine (JSON Schema -> Table & Filter Bar)
│   │   │   ├── components/         #    inquiry-table, inquiry-filters, inquiry-drill-down
│   │   │   ├── hooks/              #    use-inquiry-schema, use-inquiry-state
│   │   │   └── utils/              #    filter-dataset, export-helpers, resolve-form-command
│   │   │
│   │   ├── shared/                 #    COMMON CBS UI PRIMITIVES (Universal across Engines & System screens)
│   │   │   ├── cbs-form-header.tsx #    Standard CBS Action Toolbar & Quick Record Lookup
│   │   │   ├── cbs-idle-state.tsx  #    Standard Dashed Container + Layer Emblem + Instructions
│   │   │   ├── cbs-audit-footer.tsx#    Record status, CurrNo, Inputter, Authorizer ledger display
│   │   │   ├── action-buttons.tsx  #    Standardized action button row
│   │   │   └── action-more-menu.tsx#    Drop-down action triggers
│   │   │
│   │   ├── registry.tsx            #    Bespoke screen map + fallback resolution
│   │   ├── loader.tsx              #    ScreenErrorBoundary & Suspense fallbacks
│   │   └── types.ts                #    ScreenComponent, ScreenProps, ScreenLoaderProps
│   │
│   ├── system/                     # 2. BESPOKE ADMINISTRATIVE SCREENS (High-interaction UIs)
│   │   ├── menu-catalog/           #    SC.MENU: Action navigation items registry
│   │   ├── menu-designer/          #    SC.MENU.DESIGN: Hierarchical tree canvas & editor
│   │   ├── user-group/             #    SC.USER.GROUP: RBAC user security & permission matrix
│   │   ├── model-config/           #    SC.MODEL.CONFIG: Schema data dictionary & field attributes
│   │   ├── cob-registry/           #    SC.COB.REGISTRY: Close of Business 5-stage batch pipeline
│   │   ├── user-pass-reset/        #    SC.USER.PASS.RESET: Staff password & account unlock
│   │   ├── inquiry-designer/       #    SC.INQUIRY.DESIGN: Search criteria & display column builder
│   │   └── report-studio/          #    SC.REPORT.DESIGN: Drag-and-drop report layout designer
│   │
│   ├── command/                    # 3. GLOBAL COMMAND PALETTE & SEARCH FEATURE
│   │   ├── components/             #    CommandGuidance, SearchInputBar, SearchResultsList
│   │   ├── hooks/                  #    useSearchCommands, useCommandExecutor, useCommandGuide
│   │   ├── app-search.tsx          #    Modal dialog entry point (<AppSearch />)
│   │   └── search-filter.ts        #    Visible command fuzzy matching & category grouping
│   │
│   ├── auth/                       # 4. NON-CBS APP UTILITIES & MODALS
│   ├── settings/                   #    Global theme, appearance, font sizing, security tabs
│   └── docs/                       #    Embedded interactive documentation & command guide
│
└── lib/
    ├── cbs-client/                 # 4. CENTRAL CBS DATA GATEWAY (Wire contracts & API builders)
    │   ├── contracts/              #    Wire request types, record functions, control tables
    │   ├── payloads/               #    Domain payload builders (menu, userGroup, inquiry, cob)
    │   ├── transport/              #    Network proxy client with error alerts
    │   └── index.ts                #    Unified typed `cbs` gateway facade
    │
    └── cbs-command/                # 5. CENTRAL CBS COMMAND GATEWAY (Terminal execution & grammar)
        ├── contracts/              #    Command types, validation types, execution options
        ├── parser/                 #    CBS grammar parser (Comma Versions, authLevel 0)
        ├── validator/              #    Security guard & RIDASH function permissions
        ├── registry/               #    Canonical command catalog & master alias map
        ├── executor/               #    Terminal executor, tab & popup dispatchers
        └── index.ts                #    Unified typed `cbsCommand` gateway facade
```

---

## 3. Implementation Status & Completed Roadmap

### Phase 1: Central CBS Micro-Client Gateway (`src/lib/cbs-client/`) — [COMPLETED]
- [x] **Contracts**: Defined enums for `RequestType` (`RECORD_LIST`, `RECORD_GET`, `RECORD_PUT`, `RECORD_AUTH`, etc.), `RecordFunction` (`S`, `I`, `A`, `D`, `H`, etc.), and `ControlTable`.
- [x] **Envelope Validation**: Zod schema and TypeScript typings for request payloads and server responses.
- [x] **Domain Payload Builders**: Centralized builders for `menu`, `userGroup`, `userSecurity`, `cob`, `modelConfig`, `inquiry`, and `form`.
- [x] **100% Migration**: Replaced every raw `/api/proxy` call across all custom hooks and screens with `cbs.send(...)`.

### Phase 2: Shared CBS UI Primitives (`src/features/screens/shared/`) — [COMPLETED]
- [x] **`<CbsFormHeader />`**: Standard CBS two-row toolbar with record navigator, search, and action integration.
- [x] **`<CbsIdleState />`**: Reusable dashed IDLE container with `Layers` emblem, keyboard instructions, and new record triggers.
- [x] **`<CbsAuditFooter />`**: Real-time ledger audit bar (`REC.STATUS`, `CURR.NO`, `INPUTTER`, `DATE.TIME`, `AUTHORISER`).
- [x] **Bespoke Screens Standardized**: Refactored `menu-catalog`, `menu-designer`, `user-group`, `user-pass-reset`, `cob-registry`, `model-config`, `inquiry-designer`, and `form-screen` to use `<CbsFormHeader />` and `<CbsIdleState />`.
- [x] **Zero Legacy Support**: Removed legacy `EnquiryScreen` aliases and deprecated command routes.

### Phase 3: Screen Runtime Engine Architecture & Public APIs — [COMPLETED]
- [x] Retained `src/features/screens/` as the runtime engine container with sub-engines:
  - `forms/`: JSON Schema-driven GMC form generator.
  - `inquiries/`: JSON Schema-driven inquiry data table and selection filter generator.
  - `shared/`: Shared CBS UI primitives.
  - `registry.tsx`, `loader.tsx`, `launcher.ts`: Dynamic command dispatcher and tab lifecycle.
- [x] Exported clean, conflict-free public APIs via `src/features/screens/index.ts`.
- [x] Added `<CbsAuditFooter />` integration to active records.

### Phase 4: Non-CBS App Modules & Long-term Maintenance — [COMPLETED]
- [x] `auth/`, `settings/`, and `docs/` are decoupled from CBS wire payloads.
- [x] Full TypeScript compilation (`pnpm tsc --noEmit` = 0 errors).
- [x] Biome formatting and style compliance verified.

---

## 4. Developer Mental Model & Rules of Engagement

1. **Rule 1: Backend Payloads Live in `cbs-client`**
   - **NEVER** write inline payload objects with raw strings like `"RECORD.LIST"` or `"USER.GROUP"` inside components or hooks.
   - Always call domain helpers on `cbs`: `cbs.userGroup.list()`, `cbs.menu.save(...)`, etc.
   - If a backend field or payload structure changes, edit **one** file under `src/lib/cbs-client/payloads/`.

2. **Rule 2: Is it dynamic or bespoke?**
   - If it renders dynamically based on a backend JSON schema (`/api/forms/{name}` or `/api/inquiries/{name}`), it belongs to **`src/features/screens/`** (`forms/` or `inquiries/`).
   - If it has custom drag-and-drop, tree canvas, or bespoke administrative workflows, it belongs to **`src/features/system/`**.

3. **Rule 3: Don't repeat CBS UI layout code.**
   - Never write custom dashed borders or action button toolbars. Always import `<CbsFormHeader />`, `<CbsIdleState />`, and `<CbsAuditFooter />` from `@/features/screens/shared`.

4. **Rule 4: Keep screen files under 300 lines.**
   - Split complex canvases into `types.ts`, `hooks/use-*.ts`, and focused micro-components.

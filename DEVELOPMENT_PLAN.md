# FinX Core Banking UI — Feature Architecture & Development Plan

## 1. Executive Summary & Vision

This plan defines a clean, scalable, and modular architecture for **FinX-UI** (Core Banking System Client).
The goal is to eliminate structural confusion for new and existing developers by establishing a clear distinction between:
1. **Universal CBS Runtime Engines** (interpreters that dynamically render forms and inquiry grids from backend JSON schemas).
2. **Bespoke Administrative Screens** (specialized interactive canvases like Visual Menu Designer, Report Studio, COB Batch Pipeline, and User Permission Matrix).
3. **Shared CBS Primitives** (reusable visual building blocks such as Form Headers, IDLE State Cards, and Audit Footers).
4. **App-Level Utilities & Modals** (Authentication, User Preferences, System Settings, Documentation).

---

## 2. Architecture Comparison: Current vs. Target

### Current Pain Points
- **Unclear Folder Naming**: `features/screens/` houses both dynamic engines (`forms/`, `inquiries/`) and screen resolution logic (`registry.tsx`, `loader.tsx`), while custom administrative screens live separately under `features/system/`.
- **Component Leaks**: `FormHeader` is inside `features/screens/forms/components/`, causing bespoke system screens to import internal pieces from the forms engine.
- **Duplicated IDLE State Cards**: Screens hand-craft copies of the dashed border card, `Layers` emblem, and helper text instead of consuming a single unified primitive.

### Target Clean Architecture (`src/features/`)

```
src/features/
│
├── cbs-engine/                     # 1. CORE RUNTIME CBS ENGINES (Dynamic Interpreters)
│   ├── forms/                      #    Dynamic Form Engine (JSON Schema -> Field Grid)
│   │   ├── components/             #    form-grid, field-factory, actions/
│   │   ├── hooks/                  #    use-form-state, use-form-schema, use-form-persistence
│   │   └── utils/                  #    record-finder, record-normalizer
│   │
│   ├── inquiries/                  #    Dynamic Inquiry Grid Engine (JSON Schema -> Table & Filter Bar)
│   │   ├── components/             #    inquiry-table, inquiry-filters, inquiry-drill-down
│   │   ├── hooks/                  #    use-inquiry-schema, use-inquiry-state
│   │   └── utils/                  #    filter-dataset, export-helpers, resolve-form-command
│   │
│   ├── resolver/                   #    Command Resolution & Screen Loader
│   │   ├── registry.ts             #    Bespoke screen map + fallback resolution
│   │   ├── launcher.ts             #    Tab spawning & window management
│   │   ├── loader.tsx              #    ScreenErrorBoundary & Suspense fallbacks
│   │   └── types.ts                #    ScreenComponent, ScreenProps, ScreenLoaderProps
│   │
│   └── shared/                     #    COMMON CBS UI PRIMITIVES (Used across Engines & System screens)
│       ├── cbs-form-header/        #    Official Temenos T24 Action Toolbar & Quick Record Lookup
│       ├── cbs-idle-state/         #    Standard Dashed Container + Layer Emblem + Instructions
│       └── cbs-audit-footer/       #    Record status, CurrNo, Inputter, Authorizer display
│
├── system/                         # 2. BESPOKE ADMINISTRATIVE SCREENS (High-interaction UIs)
│   ├── menu-catalog/               #    SC.MENU: Action navigation items registry
│   ├── menu-designer/              #    SC.MENU.DESIGN: Hierarchical tree canvas & editor
│   ├── user-group/                 #    SC.USER.GROUP: RBAC user security & permission matrix
│   ├── model-config/               #    SC.MODEL.CONFIG: Schema data dictionary & field attributes
│   ├── cob-registry/               #    SC.COB.REGISTRY: Close of Business 5-stage batch pipeline
│   ├── user-pass-reset/            #    SC.USER.PASS.RESET: Staff password & account unlock
│   ├── inquiry-designer/           #    SC.INQUIRY: Search criteria & display column builder
│   └── report-studio/              #    SC.REPORT.DESIGN: Drag-and-drop report layout designer
│
└── app/                            # 3. NON-CBS APP UTILITIES & MODALS
    ├── auth/                       #    Login dialogs, biometric verification, session recovery
    ├── settings/                   #    Global theme, appearance, font sizing, security tabs
    └── docs/                       #    Embedded interactive documentation & command guide
```

---

## 3. Step-by-Step Implementation Roadmap

### Phase 1: Establish Shared CBS UI Primitives (`cbs-engine/shared/` or `screens/shared/`)
- [ ] **Extract `<CbsFormHeader />`**:
  - Move `FormHeader`, `ActionButtons`, and `ActionMoreMenu` from `forms/components/` into `shared/cbs-form-header/`.
  - Export clean TypeScript props (`CbsFormHeaderProps`, `MoreActionItem`).
- [ ] **Extract `<CbsIdleState />`**:
  - Promote `FormIdleState` into `shared/cbs-idle-state/` for universal consumption across all system screens.
- [ ] **Extract `<CbsAuditFooter />`**:
  - Reusable footer showing `REC.STATUS`, `CURR.NO`, `INPUTTER`, `DATE.TIME`, `AUTHORISER`.

### Phase 2: Consolidate Runtime Engines (`cbs-engine/`)
- [ ] Group `forms/`, `inquiries/`, and `resolver/` under a clear engine namespace:
  - `forms/`: Schema-driven GMC form generator.
  - `inquiries/`: Schema-driven data table and selection filter generator.
  - `resolver/`: Universal `resolveScreen(command)` mapper and `ScreenLoader`.
- [ ] Standardize public exports in `cbs-engine/index.ts` so imports stay clean (`@/features/cbs-engine`).

### Phase 3: Standardize Bespoke System Screens (`src/features/system/`)
- [ ] Update each system screen to import `<CbsFormHeader />` and `<CbsIdleState />` from the shared layer:
  1. `menu-catalog/`
  2. `menu-designer/`
  3. `user-group/`
  4. `model-config/`
  5. `cob-registry/`
  6. `user-pass-reset/`
  7. `inquiry-designer/`
- [ ] Ensure every screen satisfies:
  - 200–300 lines limit per file.
  - Strict App Router conventions.
  - Full TypeScript types (`tsc --noEmit` = 0 errors).
  - Biome style guide compliance (`pnpm biome check` = 0 errors).

### Phase 4: App Modals & Core Organization (`src/features/app/`)
- [ ] Keep `auth/`, `settings/`, and `docs/` clean and decoupled from CBS core banking business logic.
- [ ] Ensure non-screen UI modals invoke via workbench store or action commands without circular imports.

---

## 4. Developer Mental Model & Rules of Engagement

1. **Rule 1: Is it dynamic or bespoke?**
   - If it renders based on a JSON schema (`/api/forms/{name}` or `/api/inquiries/{name}`), it belongs to **`cbs-engine`**.
   - If it has custom drag-and-drop, graph canvas, or custom business workflows, it belongs to **`system`**.

2. **Rule 2: Don't repeat CBS UI layout code.**
   - Never write custom dashed borders or action button toolbars. Always import `<CbsFormHeader />` and `<CbsIdleState />`.

3. **Rule 3: Keep screens under 300 lines.**
   - Split complex screens into `types.ts`, `hooks/use-*.ts`, and focused micro-components.

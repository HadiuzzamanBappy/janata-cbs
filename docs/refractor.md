# 🏛️ FinXUI Core Banking Workbench: Refactoring & Architecture Blueprint

## 1. Objective

The goal is to rebuild the **FinXUI Core Banking Workbench** from a tangled, monolithic-style Next.js application into a clean, modern, efficient, and highly maintainable enterprise application. We will not blindly copy the old project's structure. Instead, we will preserve its business capabilities (gRPC communication, Redis sessions, dynamic form rendering, bespoke workflows) while eliminating architectural weaknesses (flat dumping of components, mixed concerns, redundant data schemas, and fragile configurations).

---

## 2. Required Analysis of the Old Project

### A. Core Business Flow & Intended Behavior
- **Dynamic Schema Rendering**: The workbench loads its UI dynamically by fetching database form configurations (`GMC` payloads) from a live Java SE Core Banking backend over gRPC.
- **Bespoke Overrides**: If a screen requires logic too complex for the dynamic engine (e.g., `INQ.tsx`, `SC.CHANGE.PASS.tsx`), a custom React component overrides the dynamic fallback.
- **Session Management**: User auth tokens, branch IDs, and idempotency keys are managed through a sliding-expiry Redis session.
- **Tab/Window Panel Mode**: Users interact with the workbench either in browser popups (`window`) or an internal tabbed workspace (`panel`).

### B. Complete Old Project Inventory

#### Syscomp Files (23 files — the core of the migration)

| File | Size | Domain Classification |
| :--- | ---: | :--- |
| `SC.DYNAMIC.tsx` | 70 KB | **Engine** — Dynamic form renderer (the heart) |
| `SC.FORM.BUILDER.tsx` | 96 KB | **System Config** — Visual form layout designer |
| `SC.FORM.tsx` | 76 KB | **Engine** — Form rendering logic |
| `SC.INQUIRY.tsx` | 75 KB | **Inquiries** — Advanced inquiry engine |
| `SC.MODEL.CONFIG.tsx` | 74 KB | **System Config** — Database model configuration |
| `SC.REPORT.LINE.tsx` | 54 KB | **Reporting** — Report line designer |
| `INQ.tsx` | 53 KB | **Inquiries** — Standard inquiry screen |
| `SC.MENU.DESIGN.tsx` | 49 KB | **System Config** — Menu tree editor |
| `SC.USER.GROUP.tsx` | 27 KB | **Auth/Admin** — User group management |
| `SC.SEARCH.tsx` | 25 KB | **Engine** — Global search engine |
| `SC.HELP.TEXT.tsx` | 23 KB | **System Config** — Help text editor |
| `SC.COB.REGISTRY.tsx` | 22 KB | **System Config** — Close-of-business registry |
| `GIR.tsx` | 21 KB | **Inquiries** — General inquiry results |
| `SIR.tsx` | 20 KB | **Inquiries** — Specific inquiry results |
| `SC.SPC.tsx` | 17 KB | **Engine** — Special processing component |
| `SC.CHANGE.PASS.tsx` | 16 KB | **Auth** — Password change flow |
| `SC.USER.PASS.RESET.tsx` | 16 KB | **Auth** — Admin password reset |
| `SC.RPT.tsx` | 13 KB | **Reporting** — Report viewer |
| `SC.SCREEN.BUILDER.tsx` | 13 KB | **System Config** — Screen builder |
| `AuditInfo.tsx` | 5 KB | **Engine** — Audit trail display |
| `SC.CONTROL.LIST.tsx` | 5 KB | **Engine** — Control list selector |
| `SC.NF.tsx` | < 1 KB | **Stub** — Non-financial placeholder |
| `SC.SE.tsx` | < 1 KB | **Stub** — Special entry placeholder |

#### Controls (19 files + 6 tag components)

| File | Size | Purpose |
| :--- | ---: | :--- |
| `ReportStudio.tsx` | **957 KB** | Embedded report designer (massive, self-contained) |
| `DataListView.tsx` | 20 KB | Tabular data list rendering |
| `SCDataTable.tsx` | 17 KB | Banking data table with sorting/filtering |
| `ButtonControl.tsx` | 10 KB | Toolbar button factory |
| `DesignElementRender.tsx` | 8 KB | Design-time element preview |
| `TreeView.tsx` | 7 KB | Navigation tree component |
| `SCGrid.tsx` | 6 KB | Grid layout helper |
| `MessageBox.tsx` | 4 KB | Modal alert/confirm dialogs |
| `PopUp.tsx` | 3 KB | Generic popup container |
| `SVGButtons.tsx` | 2 KB | SVG icon buttons |
| `IDTextControl.tsx` | 2 KB | Record ID text input |
| `Accordion.tsx` | 2 KB | Collapsible accordion panel |
| `HelpText.tsx` | 1 KB | Help text tooltip |
| `SCAlert.tsx` | < 1 KB | Alert message display |
| `ShowAlert.tsx` | < 1 KB | Alert trigger utility |
| `SessionTimeOut.tsx` | < 1 KB | Session timeout warning |
| `loading.tsx` | < 1 KB | Loading spinner |
| Tags: `SCBoolean`, `SCComboBox`, `SCDate`, `SCDropDown`, `SCDropDownList`, `SCTags` | 1–9 KB each | Form field input controls |

#### Infrastructure Files

| File | Purpose |
| :--- | :--- |
| `APIService.ts` | Client-side API class (wraps `/api/proxy` fetch calls) |
| `command.tsx` | Window.open command executor with instance tracking |
| `componentLoader.tsx` | Dynamic `React.lazy()` component loader |
| `pannelLoader.tsx` | Panel-mode loader (duplicate of componentLoader) |
| `windowLoader.tsx` | Window-mode loader (duplicate of componentLoader) |
| `component-registry.ts` | Static bespoke screen registry + `resolveControl()` |
| `GlobalFunc.ts` | Date formatting, amount-to-words, utility functions |
| `GlobalEnums.ts` | Query operator enum definitions |
| `FWCommon.ts` | Framework common utilities |
| `alertStore.ts` | Zustand alert notification store |

#### Report Studio (self-contained subsystem)

| Path | Size | Note |
| :--- | ---: | :--- |
| `reportstudio/index.tsx` | **138 KB** | Main report designer entry |
| `reportstudio/` (total) | 10+ subdirs | Canvas, PDF, themes, features — treat as isolated module |

#### Screen Builder (self-contained subsystem)

| Path | Size | Note |
| :--- | ---: | :--- |
| `screenbuilder/index.tsx` | 19 KB | Screen builder entry |
| `screenbuilder/` (5 files) | ~28 KB total | Frames, API integration |

### C. Identified Weaknesses & Technical Debt
- **The "Syscomp" Dump**: `src/app/(core)/syscomp/` contains 23 massive, tightly coupled `.tsx` files (some over 70KB) without domain segregation.
- **Triple-Duplicated Loaders**: `componentLoader.tsx`, `pannelLoader.tsx`, and `windowLoader.tsx` contain identical lazy-loading logic copied three times.
- **Mixed Concerns**: Data fetching (gRPC), state management, caching, and UI rendering are dangerously intertwined within components.
- **Schema Duplication**: The project historically juggled camelCase vs. UPPERCASE properties because backend structures evolved independently of frontend mocks.
- **Redundant Clients**: Two separate gRPC clients existed (`src/grpc/client.ts` vs `src/server/grpc-client.ts`), causing collisions.
- **957 KB ReportStudio**: A single control file approaching 1 MB — must be isolated as an independent lazy-loaded module.

---

## 3. New Project Design & Architecture

### 3.1 Base Project Setup
- **Framework**: **Next.js 16 App Router (React 19)** (Provides built-in Server Actions, React Server Components (RSC), and optimized streaming layout).
- **Language**: **TypeScript (Strict Mode)** (No implicit `any`, strict null checks, `@/*` alias mapped to `./src/*`).
- **Styling**: **Tailwind CSS v4 + OKLCH Design Tokens** (Zero-JS theme switching, semantic color tokens like `--surface` / `--fg-muted`, and accessible Radix primitives via `shadcn/ui`).
- **State Management**: **Zustand** (Replaces prop-drilled React Contexts for the Workbench Tab Manager and Command Shell history outside the React render tree).
- **RPC & Data Transport**: **@grpc/grpc-js** & **ts-proto** (For strictly-typed, server-only backend communication protected by `import "server-only"` guards).
- **Caching & Auth**: **ioredis** (For high-speed, secure session stores with single-flight request coalescing and circuit breaking).
- **Data Validation**: **Zod** (To validate all incoming gRPC payloads at the boundary before they hit the UI).

### 3.2 Project Architecture
**Domain-Driven, Layered Architecture:**
1. **Presentation Layer (Client)**: Atomic UI components (`src/components/ui`) and Smart Feature Domains (`src/features`).
2. **Gateway Layer (Next.js Server)**: React Server Components (RSC) for initial page/menu hydration + Route Handlers (`/api/proxy`) for interactive client mutations.
3. **Transport Layer (Node.js)**: gRPC Client Singleton (`src/lib/core/grpc.ts`) marked with `"server-only"`.
4. **Data Dictionary Layer**: Zod schemas (`src/lib/schema`) representing canonical Core Banking definitions.

**Dependency Direction:**
UI Components → Feature Hooks / RSC → API Route Handlers / Server Actions → gRPC Core → Java Backend

### 3.3 Code Quality Rules (Enforced Throughout)

> These rules prevent the new codebase from drifting back toward the old project's problems.

| Rule | Limit | Rationale |
| :--- | :--- | :--- |
| **Max lines per component file** | **300 lines** | No more monolithic 1900-line components. Break into sub-components. |
| **Max lines per utility/lib file** | **200 lines** | If a utility grows beyond this, it becomes its own module. |
| **No `any` type** | **Zero tolerance** | Use `unknown` + type narrowing or Zod `.parse()`. |
| **No `typeof window` checks in lib** | **Zero tolerance** | Use `"server-only"` imports. If code runs on both, it belongs in `src/lib/utils/`. |
| **No duplicate loader logic** | **Single `resolveControl()` function** | Replaces the triple-duplicated componentLoader/pannelLoader/windowLoader. |
| **No direct gRPC calls from components** | **Always go through API routes or Server Actions** | Components only call `fetch()` to `/api/proxy` or invoke Server Actions. |
| **Every `src/lib/core/*` file** | **Must start with `import "server-only"`** | Guarantees gRPC, Redis, and YAML config never leak into browser bundles. |

### 3.4 Complete Directory Structure
```text
finxui-v2/
├── .env.local                          # Environment variables (Centralized)
├── config/
│   └── config.yml                      # Service Address Resolver configs
├── src/
│   ├── app/                            # Next.js App Router (Pure Routing & RSC Hydration)
│   │   ├── (auth)/
│   │   │   └── login/page.tsx          # Login Page
│   │   ├── (core)/
│   │   │   ├── layout.tsx              # Authenticated shell (RSC menu fetch + sidebar)
│   │   │   ├── page.tsx                # Dashboard / landing
│   │   │   └── client/event/
│   │   │       └── component/page.tsx  # Window-mode component renderer
│   │   └── api/
│   │       ├── proxy/route.ts          # Secure gRPC forwarder (single endpoint)
│   │       ├── login/route.ts          # Login handler
│   │       ├── logout/route.ts         # Logout handler
│   │       ├── session/route.ts        # Session check/get/set (consolidated)
│   │       ├── cache/route.ts          # Cache invalidation endpoint
│   │       └── model/[cmd]/route.ts    # Schema loader endpoint
│   │
│   ├── components/                     # Reusable, Domain-Agnostic UI
│   │   ├── ui/                         # Atomic: Button, Input, Select, DatePicker, Table
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── date-picker.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── data-table.tsx          # Replaces SCDataTable + DataListView
│   │   │   ├── accordion.tsx
│   │   │   ├── dialog.tsx              # Replaces MessageBox + PopUp
│   │   │   └── alert.tsx               # Replaces SCAlert + ShowAlert
│   │   └── layout/                     # Shell, Sidebar, TabBar, Toolbar
│   │       ├── app-shell.tsx
│   │       ├── sidebar.tsx
│   │       ├── tab-bar.tsx
│   │       └── toolbar.tsx             # Replaces ButtonControl
│   │
│   ├── features/                       # Domain-Driven Business Logic
│   │   ├── engine/                     # THE HEART — Dynamic schema-driven rendering
│   │   │   ├── dynamic-form.tsx        # ← SC.DYNAMIC.tsx (accepts parsed schema as props)
│   │   │   ├── form-renderer.tsx       # ← SC.FORM.tsx (grid layout renderer)
│   │   │   ├── field-factory.tsx       # Maps field type → atomic component
│   │   │   ├── search-engine.tsx       # ← SC.SEARCH.tsx
│   │   │   ├── control-list.tsx        # ← SC.CONTROL.LIST.tsx
│   │   │   ├── audit-info.tsx          # ← AuditInfo.tsx
│   │   │   ├── special-process.tsx     # ← SC.SPC.tsx
│   │   │   └── hooks/
│   │   │       ├── use-form-state.ts   # Form state reducer
│   │   │       └── use-schema.ts       # Schema fetching hook
│   │   │
│   │   ├── auth/                       # Authentication & User Management
│   │   │   ├── change-password.tsx     # ← SC.CHANGE.PASS.tsx
│   │   │   ├── reset-password.tsx      # ← SC.USER.PASS.RESET.tsx
│   │   │   └── user-groups.tsx         # ← SC.USER.GROUP.tsx
│   │   │
│   │   ├── inquiries/                  # All Inquiry Screens
│   │   │   ├── inquiry-engine.tsx      # ← INQ.tsx (broken into sub-components)
│   │   │   ├── inquiry-filters.tsx     # Filter panel extracted from INQ
│   │   │   ├── inquiry-results.tsx     # Results table extracted from INQ
│   │   │   ├── general-inquiry.tsx     # ← GIR.tsx
│   │   │   ├── specific-inquiry.tsx    # ← SIR.tsx
│   │   │   └── inquiry-engine-v2.tsx   # ← SC.INQUIRY.tsx
│   │   │
│   │   ├── reporting/                  # Reporting Subsystem
│   │   │   ├── report-line.tsx         # ← SC.REPORT.LINE.tsx
│   │   │   ├── report-viewer.tsx       # ← SC.RPT.tsx
│   │   │   └── report-studio/         # ← reportstudio/ (isolated lazy module)
│   │   │       └── index.tsx           # Entry point — loaded via next/dynamic
│   │   │
│   │   ├── system-config/              # System Configuration Screens
│   │   │   ├── model-config.tsx        # ← SC.MODEL.CONFIG.tsx
│   │   │   ├── form-builder/          # ← SC.FORM.BUILDER.tsx (decomposed)
│   │   │   │   ├── index.tsx           # Entry point
│   │   │   │   ├── form-canvas.tsx     # Grid drag-and-drop area
│   │   │   │   ├── form-palette.tsx    # Property list sidebar
│   │   │   │   ├── property-inspector.tsx # Field config drawer
│   │   │   │   ├── form-tabs.tsx       # Tab/page grouping
│   │   │   │   └── hooks/
│   │   │   │       └── use-builder-dnd.ts  # Drag-and-drop state hook
│   │   │   ├── menu-design.tsx         # ← SC.MENU.DESIGN.tsx
│   │   │   ├── screen-builder/        # ← screenbuilder/ (isolated module)
│   │   │   │   └── index.tsx
│   │   │   ├── help-text.tsx           # ← SC.HELP.TEXT.tsx
│   │   │   └── cob-registry.tsx        # ← SC.COB.REGISTRY.tsx
│   │   │
│   │   └── workspace/                  # Workspace Tab & Window Management
│   │       ├── component-registry.ts   # Static bespoke screen map + resolveControl()
│   │       ├── component-loader.tsx    # SINGLE unified loader (replaces 3 duplicates)
│   │       ├── command-executor.ts     # ← command.tsx (window.open logic)
│   │       └── window-frame.tsx        # In-page fallback window
│   │
│   ├── lib/                            # Core Infrastructure & Tools
│   │   ├── core/                       # Server-Only guarded infrastructure
│   │   │   ├── grpc.ts                 # Singleton gRPC client ("server-only")
│   │   │   ├── dispatch.ts             # Unified gRPC/REST dispatcher ("server-only")
│   │   │   ├── redis-client.ts         # ioredis connection ("server-only")
│   │   │   ├── redis-session.ts        # Session read/write ("server-only")
│   │   │   ├── cache.ts                # Read-through cache with CACHE_ENABLED flag ("server-only")
│   │   │   └── services.ts             # YAML config.yml service resolver ("server-only")
│   │   │
│   │   ├── schema/                     # Data Dictionary & Validation
│   │   │   ├── schema-parser.ts        # Zod-validated GMC → FormSchema mapper
│   │   │   ├── menu-parser.ts          # Zod-validated MNU → MenuItem mapper
│   │   │   └── schemas.ts              # Zod schema definitions
│   │   │
│   │   ├── mocks/                      # Domain Mock Data (Offline Dev)
│   │   │   ├── specs.ts                # Model specs (FUNDS.TRANSFER, ACCOUNT, etc.)
│   │   │   ├── menu.ts                 # Menu hierarchy tree
│   │   │   ├── branches.ts             # Banking branch directory
│   │   │   └── index.ts                # Barrel export
│   │   │
│   │   └── utils/                      # Shared utilities (client + server safe)
│   │       ├── cn.ts                   # classnames helper (clsx + twMerge)
│   │       ├── date.ts                 # ← GlobalFunc date utilities (pure functions)
│   │       ├── currency.ts             # ← GlobalFunc AmountToWord (pure function)
│   │       ├── enums.ts                # ← GlobalEnums (field operators, record functions)
│   │       └── command-parser.ts       # ← command.ts (pure parse function, no DOM)
│   │
│   ├── store/                          # Zustand Global Stores
│   │   ├── workbench-store.ts          # Active tabs, tab ordering, tab state persistence
│   │   ├── alert-store.ts              # ← alertStore.ts (notification toasts)
│   │   └── session-store.ts            # Current user, branch, business date
│   │
│   └── types/                          # Centralized TypeScript types
│       ├── index.ts                    # Core interfaces: IProperty, ITreeNode, APIResponse
│       ├── grpc.ts                     # gRPC request/response types
│       └── form.ts                     # FormSchema, Field, ControlProps
```

---

## 4. Feature / Module Migration Mapping (Complete)

### Infrastructure & Transport

| Old File | New Location | Action | Notes |
| :--- | :--- | :--- | :--- |
| `src/grpc/client.ts` | `src/lib/core/grpc.ts` | **Consolidate** | Single gRPC client with `"server-only"` |
| `src/grpc/dispatch.ts` | `src/lib/core/dispatch.ts` | **Refactor** | Clean dual-transport (gRPC + REST) with strategy pattern |
| `src/server/model-source.ts` | `src/lib/schema/schema-parser.ts` | **Refactor** | Zod-validated, strict UPPERCASE only |
| `src/server/redis.ts` | `src/lib/core/redis-client.ts` + `cache.ts` | **Split** | Separate connection from caching logic |
| `src/lib/redisSession.ts` | `src/lib/core/redis-session.ts` | **Port** | Add `"server-only"` guard |
| `src/lib/services.ts` | `src/lib/core/services.ts` | **Port** | Add `"server-only"` guard |
| `src/lib/callService.ts` | `src/lib/core/dispatch.ts` | **Merge** | Absorbed into unified dispatcher |

### API Routes

| Old Route | New Route | Action | Notes |
| :--- | :--- | :--- | :--- |
| `api/proxy/` | `api/proxy/route.ts` | **Port** | Keep as primary gRPC forwarder |
| `api/login/` | `api/login/route.ts` | **Port** | Auth endpoint |
| `api/logout/` | `api/logout/route.ts` | **Port** | Session cleanup |
| `api/checksession/` + `api/getsession/` + `api/setsession/` | `api/session/route.ts` | **Consolidate** | Single route with GET/POST/DELETE methods |
| `api/cache/` | `api/cache/route.ts` | **Port** | Cache invalidation (+ dev `FLUSHALL`) |
| `api/model/` | `api/model/[cmd]/route.ts` | **Port** | Schema loader |
| `api/menu/` | **Removed** | **Remove** | RSC fetches menu directly in layout.tsx |
| `api/getpdf/` | `api/proxy/route.ts` | **Merge** | Handle via proxy with content-type routing |

### Syscomp → Features

| Old Syscomp File | New Feature Location | Action |
| :--- | :--- | :--- |
| `SC.DYNAMIC.tsx` (70 KB) | `features/engine/dynamic-form.tsx` | **Refactor** — Decouple from API calls, accept schema as props |
| `SC.FORM.tsx` (76 KB) | `features/engine/form-renderer.tsx` | **Refactor** — Extract grid logic |
| `SC.SEARCH.tsx` (25 KB) | `features/engine/search-engine.tsx` | **Refactor** — Clean query builder |
| `SC.CONTROL.LIST.tsx` (5 KB) | `features/engine/control-list.tsx` | **Port** — Minor cleanup |
| `AuditInfo.tsx` (5 KB) | `features/engine/audit-info.tsx` | **Port** — Clean typing |
| `SC.SPC.tsx` (17 KB) | `features/engine/special-process.tsx` | **Port** — Decouple API |
| `SC.NF.tsx` + `SC.SE.tsx` | **Removed** | **Remove** — Empty stubs |
| `INQ.tsx` (53 KB) | `features/inquiries/` (3 files) | **Decompose** — Filters + Results + Engine |
| `GIR.tsx` (21 KB) | `features/inquiries/general-inquiry.tsx` | **Refactor** |
| `SIR.tsx` (20 KB) | `features/inquiries/specific-inquiry.tsx` | **Refactor** |
| `SC.INQUIRY.tsx` (75 KB) | `features/inquiries/inquiry-engine-v2.tsx` | **Decompose** |
| `SC.CHANGE.PASS.tsx` (16 KB) | `features/auth/change-password.tsx` | **Port** — Clean up |
| `SC.USER.PASS.RESET.tsx` (16 KB) | `features/auth/reset-password.tsx` | **Port** — Clean up |
| `SC.USER.GROUP.tsx` (27 KB) | `features/auth/user-groups.tsx` | **Refactor** |
| `SC.REPORT.LINE.tsx` (54 KB) | `features/reporting/report-line.tsx` | **Refactor** |
| `SC.RPT.tsx` (13 KB) | `features/reporting/report-viewer.tsx` | **Port** |
| `SC.MODEL.CONFIG.tsx` (74 KB) | `features/system-config/model-config.tsx` | **Decompose** |
| `SC.FORM.BUILDER.tsx` (96 KB) | `features/system-config/form-builder/` (5 files) | **Decompose** — Canvas + Palette + Inspector + Tabs + DnD hook |
| `SC.MENU.DESIGN.tsx` (49 KB) | `features/system-config/menu-design.tsx` | **Decompose** |
| `SC.SCREEN.BUILDER.tsx` (13 KB) | `features/system-config/screen-builder/` | **Port** |
| `SC.HELP.TEXT.tsx` (23 KB) | `features/system-config/help-text.tsx` | **Refactor** |
| `SC.COB.REGISTRY.tsx` (22 KB) | `features/system-config/cob-registry.tsx` | **Refactor** |

### Controls → Components

| Old Control | New UI Component | Action |
| :--- | :--- | :--- |
| `ButtonControl.tsx` | `components/layout/toolbar.tsx` | **Redesign** — Use shadcn/ui Button |
| `DataListView.tsx` + `SCDataTable.tsx` | `components/ui/data-table.tsx` | **Consolidate** — Single table component |
| `MessageBox.tsx` + `PopUp.tsx` | `components/ui/dialog.tsx` | **Consolidate** — Use Radix Dialog |
| `SCAlert.tsx` + `ShowAlert.tsx` | `components/ui/alert.tsx` | **Consolidate** |
| `Accordion.tsx` | `components/ui/accordion.tsx` | **Replace** — Use Radix Accordion |
| `TreeView.tsx` | `components/layout/sidebar.tsx` | **Integrate** — Part of sidebar |
| `SCGrid.tsx` | `features/engine/form-renderer.tsx` | **Absorb** — Grid logic in form renderer |
| `IDTextControl.tsx` | `components/ui/input.tsx` | **Absorb** — Variant of input |
| `HelpText.tsx` | `components/ui/tooltip.tsx` | **Replace** — Use Radix Tooltip |
| `SessionTimeOut.tsx` | `components/layout/app-shell.tsx` | **Integrate** — Part of shell |
| Tag controls (`SCBoolean`, `SCComboBox`, `SCDate`, `SCDropDown`, `SCDropDownList`) | `components/ui/` (individual atomic files) | **Redesign** — Clean implementations |
| `ReportStudio.tsx` (957 KB) | `features/reporting/report-studio/` | **Isolate** — Lazy-loaded independent module |

### Loaders & Workspace

| Old File | New Location | Action |
| :--- | :--- | :--- |
| `componentLoader.tsx` + `pannelLoader.tsx` + `windowLoader.tsx` | `features/workspace/component-loader.tsx` | **Consolidate** — One loader, two render targets |
| `component-registry.ts` | `features/workspace/component-registry.ts` | **Port** — Keep explicit map pattern |
| `command.tsx` | `features/workspace/command-executor.ts` | **Port** — Clean typing |
| `APIService.ts` | **Removed** | **Remove** — Replace with direct `fetch('/api/proxy')` calls or typed service hooks |

### Utilities

| Old File | New Location | Action |
| :--- | :--- | :--- |
| `GlobalFunc.ts` | `lib/utils/date.ts` + `lib/utils/currency.ts` | **Split** — Pure functions, no IIFE pattern |
| `GlobalEnums.ts` | `lib/utils/enums.ts` | **Port** — Clean typing |
| `FWCommon.ts` | `lib/utils/` (distribute) | **Split** — Relevant helpers into proper utils |
| `alertStore.ts` | `store/alert-store.ts` | **Port** — Keep Zustand pattern |

---

## 5. Process Modernization

### Schema Fetching & Validation
- **Old Approach**: `model-source.ts` manually mapped fields using nullish coalescing `??` across 3-4 possible legacy names.
- **New Approach**: Use `Zod` schemas to validate the raw `GMC` payload exactly as the Java backend sends it. If it fails validation, it drops early with structured errors, preventing runtime React crashes.

### RSC Initial Hydration & API Routes
- **Old Approach**: Client-side fetch hooks trigger extra roundtrips to retrieve the initial menu tree and layout specs after hydration.
- **New Approach**: React Server Components (RSC) fetch initial menu trees (`getMenu()`) directly on the server in `src/app/(core)/layout.tsx` for instant HTML rendering without flash. Interactive mutations use `/api/proxy` or Server Actions.

### Component Routing & Registry
- **Old Approach**: Template-literal dynamic imports (`import(\`@/app/(core)/syscomp/${name}\`)`) that force the bundler to ship every syscomp file.
- **New Approach**: Explicit `STATIC_PAGES` registry map with `next/dynamic` or `React.lazy()`. Each feature is code-split independently — the browser only downloads the screen the user opens.

### Triple Loader Consolidation
- **Old Approach**: Three nearly identical files (`componentLoader.tsx`, `pannelLoader.tsx`, `windowLoader.tsx`) with copy-pasted lazy-loading logic.
- **New Approach**: One `ComponentLoader` that accepts a `mode: "panel" | "window"` prop. The mode determines rendering target (embedded tab vs. popup window), not the loading logic.

### State Management
- **Old Approach**: Passing props infinitely down the tree or using heavy React Context for active tabs.
- **New Approach**: `Zustand` stores for `workbench` (tabs), `alert` (notifications), and `session` (current user). State lives outside the React tree, eliminating wasteful re-renders across open tabs.

---

## 6. Caching Strategy

### Development Phase: `CACHE_ENABLED=false`

During active feature development, disable Redis caching to avoid stale data issues:

```bash
# .env.local (Development)
CACHE_ENABLED=false         # Bypass Redis entirely — always fresh from gRPC
MODEL_SOURCE=static         # Use static mocks when backend unavailable
```

### Cache Abstraction Layer

Build the cache interface from Day 1, but keep it bypassed:

```ts
// src/lib/core/cache.ts
import "server-only";

const CACHE_ENABLED = process.env.CACHE_ENABLED === "true";

export async function getOrSet<T>(
  key: string,
  fetchFn: () => Promise<T | null>,
  ttlSeconds: number
): Promise<T | null> {
  if (!CACHE_ENABLED) return fetchFn();
  // Redis read → miss → fetchFn() → Redis write (never cache nulls)
}
```

### Quick Cache Flush During Testing

```json
// package.json script
"cache:flush": "node -e \"const Redis=require('ioredis');new Redis(process.env.REDIS_URL).flushall().then(()=>{console.log('Cache flushed');process.exit(0)})\""
```

### Production: `CACHE_ENABLED=true`

```bash
# .env.production
CACHE_ENABLED=true
SPEC_TTL_SECONDS=3600
MENU_TTL_SECONDS=600
```

---

## 7. Data, State, & Security Architecture

- **State**:
  - **Server State**: React Server Components (RSC) fetch initial menu and schema data. Client-side mutations are handled via Server Actions or hooks calling `/api/proxy`.
  - **Client State**: UI interactions (typing, opening menus) are local state. Tab management and command shell history are Zustand global state.
- **Security & Protection**:
  - Browser **NEVER** communicates with gRPC directly.
  - All gRPC and Redis infrastructure modules explicitly include `import "server-only";` to guarantee Node secrets and gRPC channels never bundle into client JavaScript.
  - Auth tokens are stored securely in Redis, keyed by an HTTP-only secure cookie session ID.
- **Integration (gRPC)**:
  - All outgoing requests to Java Core are routed through a single `dispatch(ProcessKind, Payload)` function to ensure consistent idempotency key generation (`crypto.randomUUID()`) and trace ID injection.

---

## 8. Development & Migration Strategy

### Step 1: Core Foundation
**Goal**: A running Next.js app with layout shell and navigation.

| # | Task | Output | Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| 1.1 | Bootstrap Next.js App Router | Working `pnpm dev` | `next build` passes with zero errors |
| 1.2 | Setup `.env.local`, Tailwind CSS v4 `@theme` tokens | Themed UI with light/dark mode | Theme toggle works without flash |
| 1.3 | Create `config/config.yml` loader | `resolveServiceUrl()` works | Resolves known service → URL |
| 1.4 | Create Zustand stores (`workbench`, `alert`, `session`) | Store files exist with typed interfaces | Tab add/remove/switch works in isolation |
| 1.5 | Build layout shell (sidebar, tab bar, empty workspace) | Visible UI skeleton | Navigation tree renders, tabs open/close |

**Dependencies**: None — this is the foundation.

---

### Step 2: Secure Infrastructure Bridge
**Goal**: The app can communicate with the Java backend and maintain sessions.

| # | Task | Output | Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| 2.1 | Generate ts-proto stubs from `service.proto` | `src/lib/core/generated/` | Types compile without errors |
| 2.2 | Build singleton gRPC client (`src/lib/core/grpc.ts`) | Server-only gRPC channel | `"server-only"` guard present; builds cleanly |
| 2.3 | Build unified dispatcher (`src/lib/core/dispatch.ts`) | Dual-transport function | Can send a `NonFinancialProcess` request and receive response |
| 2.4 | Setup ioredis client (`src/lib/core/redis-client.ts`) | Connection with circuit breaker | Redis down → graceful fallback within 5ms |
| 2.5 | Build session manager (`src/lib/core/redis-session.ts`) | Sliding-expiry session CRUD | Session set/get/delete round-trip works |
| 2.6 | Build `/api/proxy/route.ts` | Working proxy endpoint | `POST /api/proxy` with envelope → backend response |
| 2.7 | Build `/api/login/route.ts` | Login endpoint | Valid credentials → session cookie set |
| 2.8 | Build `/api/logout/route.ts` | Logout endpoint | Session destroyed, cookie cleared |
| 2.9 | Build cache abstraction (`src/lib/core/cache.ts`) | `getOrSet()` with `CACHE_ENABLED` flag | `CACHE_ENABLED=false` → direct fetch; `true` → Redis read-through |
| 2.10 | Build `/api/cache/route.ts` | Cache invalidation endpoint | `DELETE /api/cache` clears keys |

**Dependencies**: Step 1 complete.

---

### Step 3: Schema Engine & Dynamic Rendering (The Heart)
**Goal**: The app can fetch a form definition from the backend and render a working input form.

| # | Task | Output | Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| 3.1 | Build Zod schemas (`src/lib/schema/schemas.ts`) | Validation types for GMC payloads | Invalid payload → structured Zod error |
| 3.2 | Build schema parser (`src/lib/schema/schema-parser.ts`) | `parseGMC()` → `FormSchema` | Parses real GMC response into typed FormSchema |
| 3.3 | Build menu parser (`src/lib/schema/menu-parser.ts`) | `parseMNU()` → `MenuItem[]` | Parses real MNU response into typed tree |
| 3.4 | RSC menu hydration in `src/app/(core)/layout.tsx` | Server-rendered sidebar | Menu tree visible on first paint without flash |
| 3.5 | Build `/api/model/[cmd]/route.ts` | Schema endpoint | `GET /api/model/ACCOUNT` → FormSchema JSON |
| 3.6 | Build atomic UI components | `Input`, `Select`, `DatePicker`, `Checkbox` | Each renders correctly in isolation |
| 3.7 | Build `field-factory.tsx` | Maps field.type → atomic component | All field types produce correct controls |
| 3.8 | Build `dynamic-form.tsx` | Schema-driven form renderer | Fetches schema + renders complete form with validation |
| 3.9 | Build `form-renderer.tsx` | Grid layout engine | Fields placed in correct row/col positions |
| 3.10 | Build component registry + unified loader | `resolveControl()` + `ComponentLoader` | Opening a command renders dynamic form OR bespoke screen |

**Dependencies**: Step 2 complete. Steps 3.1–3.3 can start in parallel with 3.4–3.6.

---

### Step 4: Authentication & Session Flow
**Goal**: Complete login/logout cycle with session persistence.

| # | Task | Output | Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| 4.1 | Build login page (`src/app/(auth)/login/page.tsx`) | Login form UI | Renders with proper branding |
| 4.2 | Wire login form → `/api/login` | Working auth flow | Valid login → redirect to dashboard; invalid → error message |
| 4.3 | Build session middleware / check | Route protection | Unauthenticated → redirect to `/login` |
| 4.4 | Port `change-password.tsx` | Password change screen | Form submits, password updates |
| 4.5 | Port `reset-password.tsx` | Admin password reset | Reset flow works end-to-end |
| 4.6 | Port `user-groups.tsx` | User group management | CRUD operations function correctly |

**Dependencies**: Step 3.10 (component loading) complete.

---

### Step 5: Core Engine Features
**Goal**: The dynamic engine handles all standard CRUD operations and search.

| # | Task | Output | Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| 5.1 | Build `search-engine.tsx` | Global record search | Search by ID, filter, paginate results |
| 5.2 | Build `audit-info.tsx` | Audit trail display | Shows record history |
| 5.3 | Build `control-list.tsx` | Control name selector | Lists available controls |
| 5.4 | Build `special-process.tsx` | Special processing | SPC operations execute correctly |
| 5.5 | Build toolbar (`components/layout/toolbar.tsx`) | Action bar (New, Save, Auth, Delete, Reverse) | All record functions trigger correct API calls |
| 5.6 | Wire window-mode execution | `Command.execute()` opens popup | Popups cascade, instance-tracked, fallback to in-page |
| 5.7 | Wire panel-mode execution | Tab workspace | Tabs mount/persist/switch without losing form state |

**Dependencies**: Step 3 complete.

---

### Step 6: Inquiry & Reporting Subsystems
**Goal**: All inquiry and reporting screens function.

| # | Task | Output | Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| 6.1 | Decompose & port `INQ.tsx` | `inquiry-engine.tsx` + filters + results | Inquiry with filters returns correct data |
| 6.2 | Port `GIR.tsx` | `general-inquiry.tsx` | GIR queries execute correctly |
| 6.3 | Port `SIR.tsx` | `specific-inquiry.tsx` | SIR queries execute correctly |
| 6.4 | Decompose & port `SC.INQUIRY.tsx` | `inquiry-engine-v2.tsx` | Advanced inquiries work |
| 6.5 | Port `SC.REPORT.LINE.tsx` | `report-line.tsx` | Report line definitions save/load |
| 6.6 | Port `SC.RPT.tsx` | `report-viewer.tsx` | Reports render correctly |
| 6.7 | Isolate ReportStudio | `features/reporting/report-studio/` | Lazy-loaded; never in main bundle |

**Dependencies**: Step 5 (engine features) complete.

---

### Step 7: System Configuration Screens
**Goal**: All admin/config screens function.

| # | Task | Output | Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| 7.1 | Decompose & port `SC.MODEL.CONFIG.tsx` | `model-config.tsx` | Model definitions CRUD works |
| 7.2 | Decompose `SC.FORM.BUILDER.tsx` into 5 sub-components | `form-builder/` directory | Drag-and-drop field placement works |
| 7.3 | Port `SC.MENU.DESIGN.tsx` | `menu-design.tsx` | Menu tree editing works |
| 7.4 | Port `SC.SCREEN.BUILDER.tsx` | `screen-builder/` | Screen definitions save |
| 7.5 | Port `SC.HELP.TEXT.tsx` | `help-text.tsx` | Help text CRUD works |
| 7.6 | Port `SC.COB.REGISTRY.tsx` | `cob-registry.tsx` | COB registry functions |

**Dependencies**: Step 5 (engine features) complete. Can run in parallel with Step 6.

---

### Step 8: Polish, Optimization & Production Readiness
**Goal**: The app is production-ready with all original functionality preserved.

| # | Task | Output | Acceptance Criteria |
| :---: | :--- | :--- | :--- |
| 8.1 | Enable `CACHE_ENABLED=true` and test | Cache hit/miss verified | Spec loads < 5ms on cache hit |
| 8.2 | Verify circuit breaker | Redis down → graceful degradation | App functions with Redis offline |
| 8.3 | Bundle analysis | No feature > 50 KB initial load | `next build` → check chunk sizes |
| 8.4 | Theme polish | Light/dark mode complete | All screens look correct in both themes |
| 8.5 | Accessibility pass | Keyboard navigation, focus rings | Tab through all interactive elements |
| 8.6 | `next build` clean | Zero TypeScript errors, zero warnings | Build completes successfully |

**Dependencies**: Steps 6 and 7 complete.

---

## 9. Parallel Validation Strategy

> For a banking system, cutting over blindly is not acceptable. Run both apps against the same backend.

### Side-by-Side Testing Protocol

```text
                    ┌──────────────────────────┐
                    │   Java Core Backend      │
                    │   (Single Source of Truth)│
                    └──────┬───────────┬───────┘
                           │           │
              gRPC / REST  │           │  gRPC / REST
                           │           │
                    ┌──────┴──────┐  ┌─┴──────────────┐
                    │  Old FinXUI │  │  New finxui-ref │
                    │  :3000      │  │  :3001          │
                    └─────────────┘  └─────────────────┘
```

**For each ported feature**:
1. Open the same screen in both apps side-by-side.
2. Perform identical operations (Create, Read, Update, Authorise, Delete, Search).
3. Compare the gRPC envelope payloads (use browser DevTools Network tab on `/api/proxy`).
4. Confirm the Java backend receives identical requests and returns identical responses.
5. Only mark a feature as "ported" when behavior matches 100%.

---

## 10. Final Blueprint Validation Check

**Did we lose functionality?** No. Every syscomp file, control, API route, and infrastructure module has an explicit migration target.

**Did we inherit bad practices?** No. We eliminated:
- Flat syscomp dumping → Domain-driven feature folders
- Triple-duplicated loaders → Single unified ComponentLoader
- Mixed concerns → Clean layer separation with `"server-only"` guards
- Template-literal dynamic imports → Explicit registry with code-splitting
- 957 KB inline control → Lazy-loaded isolated module
- Schema guessing (`??` chains) → Zod boundary validation

**Did we set guardrails?** Yes. 300-line file limit, zero `any`, mandatory `"server-only"`, single loader pattern.

**Priority:** Correctness → Simplicity → Maintainability → Performance → Scalability.

# Janata CBS Architecture & Complete Project Tree Structure

> **System Profile:** Enterprise Core Banking Solution (CBS) Frontend  
> **Framework:** Next.js 15 (App Router) + React 19 + TypeScript + Zustand + Tailwind CSS + Biome  
> **Target Scale:** 150 to 1,000 Dynamic Model Fields, Multi-Tab MDI Shell, Multi-Window Detached Popups with BroadcastChannel Sync  
> **Last Updated:** October 2026  

---

## 1. High-Level Architectural Map

```
janata-cbs/
├── src/
│   ├── app/                    # Next.js App Router (Pages, BFF API Routes, Auth & Shell Layouts)
│   ├── components/             # Reusable UI Design System & CBS-Specific Scaffolds
│   │   ├── cbs-access/         # Access capability gating components
│   │   ├── cbs-screen/         # Standard banking action bar, headers, audit footers & scaffold
│   │   ├── feedback/           # Error boundaries, confirmations & empty states
│   │   ├── layout/             # Workbench tabbar, sidebar, shell containers
│   │   └── ui/                 # Atomic Base UI / Shadcn design tokens
│   ├── features/               # Core Banking Domain Applications
│   │   ├── auth/               # Operator Authentication, Login & Change Password
│   │   ├── command/            # Global Command Gateway Bar & Hotkey Autocomplete
│   │   ├── docs/               # In-App Technical Documentation & Interactive Viewer
│   │   ├── form-engine/        # Headless Atomized Form Kernel (Zero-lag 150-1000 fields)
│   │   ├── inquiry-engine/     # Dynamic Tabular Inquiry Rendering Engine
│   │   ├── operations/         # Transaction Forms & Inquiry Result Grids
│   │   ├── settings/           # Workstation Preferences, Theming & Hotkey Settings
│   │   ├── system/             # System Administration (Form Config, Inquiry Config, Metamodels, Menus, Users, Report Studio)
│   │   └── workbench/          # Dynamic Screen Loader & Screen Component Registry
│   ├── hooks/                  # Global React hooks (idle timeouts, responsiveness)
│   ├── lib/                    # Headless Core Banking Libraries & Infrastructure (Pure TypeScript)
│   │   ├── cbs-access/         # RIDASHL Capability Evaluator & Four-Eyes Enforcement
│   │   ├── cbs-client/         # Canonical Client SDK & Typed Wire Payload Factories
│   │   ├── cbs-command/        # Terminal Command Parser, Registry & Popup Dispatcher
│   │   ├── cbs-form-spec/      # Form Spec & Dynamic Layout Generator
│   │   ├── cbs-hotkeys/        # Terminal Banking Keyboard Shortcuts (F2, F5, F8, F10)
│   │   ├── cbs-record/         # Deep Mutation Delta Engine (Touch-only commit payloads)
│   │   ├── cbs-screen/         # Screen lifecycle, actions matrix & BroadcastChannel bus
│   │   ├── core-config/        # Isomorphic Client Config & Server Secrets
│   │   ├── core-logger/        # PII-Redacted Structured Logger
│   │   ├── core-utils/         # Formatting (Currency, Account Masks, Formulas, Dates)
│   │   ├── data-parsers/       # GMC Protobuf & Wire Decoders
│   │   ├── data-schemas/       # Zod Runtime Validation Schemas
│   │   ├── infra-grpc/         # HTTP/2 gRPC Transport to Java CBS Engine
│   │   ├── infra-redis/        # Redis Session Store, Cache & Fail-Open Circuit Breaker
│   │   └── infra-services/     # Read-Through Domain Services (Form, Inquiry, Menu, Branch)
│   ├── store/                  # Global State (Session, Multi-Tab Workbench, Alert, Theme)
│   ├── types/                  # Canonical Core Banking TypeScript Contracts
│   └── proxy.ts                # Next.js Session Guard & Auth Route Middleware
├── mock/                       # Offline Mock Data & Simulated Core Engine
│   ├── core/                   # Offline In-Memory Core Banking Simulator (@mock/core)
│   └── db/                     # In-Memory CBS Database Tables & Schemas (@mock/db)
├── proto/                      # Protobuf Interface Definitions for Java CBS Host
├── scripts/                    # Test Verification Suites (100% Automated CI Validation)
└── docs/                       # Architectural Specs, Takeover Guides & Audits
```

---

## 2. Complete Folder & File Tree

```
janata-cbs/
|   .env.example                               # Canonical environment template
|   .env.local                                 # Local server runtime environment
|   AGENTS.md                                  # Coding guidelines for AI assistants
|   biome.json                                 # Biome linter & formatter configuration
|   package.json                               # Dependencies & verification scripts
|   pnpm-lock.yaml                             # Deterministic dependency lockfile
|   tsconfig.json                              # TypeScript strict configuration & path aliases
|
+---docs/                                      # Enterprise Documentation & Audits
|   |   CBS_ECOSYSTEM_FORMULA.md               # Core banking mathematical & operational model
|   |   project-tree.md                        # Master architectural directory & tree specification
|   |   REFACTORING_GUIDE.md                   # Systematic architectural refactoring plan
|   +---devs/                                  # Developer deep-dive guides (architecture, engine, data flow)
|   \---manual/                                # Core banking business manual
|
+---mock/                                      # Core Banking Data Fixtures & Simulated Core Engine
|   +---core/                                  # In-Memory Core Banking Engine Simulator (@mock/core)
|   |       auth-simulator.ts                  # Operator authentication simulator & JWT minting
|   |       database-router.ts                 # Dynamic CRUD table resolver (11 canonical tables)
|   |       operation-handlers.ts              # CBS protocol verb handlers (GUM, GMC, GRL, GET, PUT)
|   |       response-factory.ts                # Wire response envelope factories
|   |       index.ts, README.md
|   |
|   \---db/                                    # In-Memory CBS Database Tables & Schemas (@mock/db)
|           AC_ACCOUNT.ts                      # Account table live fixtures
|           CUST_CUSTOMER.ts                   # Customer entity fixtures
|           SC_BRANCH.ts                       # Branch directory fixtures
|           SC_CONTROL.ts                      # Control command fixtures
|           SC_FORM_CONFIG.ts                  # Visual form presentation catalog
|           SC_INQUIRY_CONFIG.ts               # Canonical enquiry grid specifications
|           SC_MENU.ts                         # System menu catalog (SCREEN & POPUP actions)
|           SC_MENU_TREE.ts                    # Hierarchical navigation menu tree
|           SC_MODEL_CONFIG.ts                 # GMC Metamodel data dictionaries
|           SC_USER.ts                         # User directory & credentials
|           SC_USER_GROUP.ts                   # User group matrix fixtures
|           types.ts, index.ts                 # Database row types & unified table exports
|
+---proto/                                     # gRPC Protocol Buffers
|       service.proto                          # CBS transaction & inquiry RPC definition
|
+---scripts/                                   # Verification & Operational Script Suites
|   +---cache/                                 # Redis Cache Management Utilities
|   |       cache-clear.ts                     # Redis cache purge utility
|   |       cache-inspect.ts                   # Redis cache viewer
|   |
|   +---tools/                                 # Codegen & Data Normalization Utilities
|   |       fixture-normalize.ts               # Fixture protobuf sanitizer
|   |       proto-gen.ts                       # Protobuf TypeScript generator
|   |
|   \---verify/                                # Automated CI Verification Test Suites
|           verify-all.ts                      # Master verification runner
|           verify-cbs-access.ts               # Access control & Four-Eyes test suite
|           verify-cbs-client.ts               # Wire payload factory test suite
|           verify-cbs-command.ts              # Command gateway test suite
|           verify-cbs-form-spec.ts            # Form spec compiler & field rules test suite
|           verify-cbs-record.ts               # Delta mutation engine test suite
|           verify-core-utils.ts               # Formatting & calculation test suite
|           verify-env-matrix.ts               # Environment matrix test suite
|           verify-infra-services.ts           # Infrastructure services test suite
|           verify-mock-services.ts            # Offline mock core engine & protocol test suite
|
\---src/                                       # Application Source Code
    |   proxy.ts                               # Session guard & auth route middleware
    |
    +---app/                                   # Next.js App Router
    |   |   globals.css                        # Design system theme tokens & scanline density
    |   |   layout.tsx                         # Root layout wrapping Theme & Tooltip providers
    |   |   not-found.tsx                      # 404 handler
    |   |   global-error.tsx                   # Top-level crash handler
    |   |   page.tsx                           # Root index redirecting to dashboard
    |   |
    |   +---(auth)/                            # Authentication Route Group
    |   |   |   layout.tsx                     # Auth card shell layout
    |   |   +---login/page.tsx                 # Core banking officer login screen
    |   |   \---change-password/page.tsx       # Mandatory first-login password update
    |   |
    |   +---(docs)/                            # Technical & Business Docs Route Group
    |   |   |   layout.tsx                     # Documentation split viewer layout
    |   |   +---devs/page.tsx                  # Developer guides & API architecture
    |   |   \---manual/page.tsx                # Operator banking manual
    |   |
    |   +---(workbench)/                       # Authenticated Core Banking MDI Shell
    |   |   +---dashboard/
    |   |   |       layout.tsx                 # Server session gate & WorkbenchShell container
    |   |   |       page.tsx                   # Multi-tab canvas switcher (Zero-unmount DOM)
    |   |   |       error.tsx                  # Dashboard boundary error fallback
    |   |   \---screen/[id]/
    |   |           page.tsx                   # Standalone detached popup window page
    |   |           loading.tsx                # Popup skeleton loader
    |   |           error.tsx                  # Popup error fallback
    |   |
    |   \---api/                               # Backend-for-Frontend (BFF) HTTP API Endpoints
    |       +---branches/route.ts              # Branch directory endpoint
    |       +---cache/route.ts                 # Cache invalidation endpoint (DELETE /api/cache)
    |       +---change-password/route.ts       # Password reset & initLogin clearing
    |       +---controls/route.ts              # System control commands endpoint
    |       +---form/[cmd]/route.ts            # Form specification fetcher (GMC)
    |       +---inquiry/[cmd]/route.ts         # Inquiry specification fetcher
    |       +---login/route.ts                 # Authentication endpoint with Redis rate limiting
    |       +---logout/route.ts                # Session destruction endpoint
    |       +---menu/route.ts                  # Navigation menu endpoint
    |       +---proxy/route.ts                 # Universal gRPC/static CRUD dispatcher
    |       \---session/route.ts               # Active session context reader & branch switcher
    |
    +---components/                            # Shared Visual & Layout Components
    |   +---cbs-access/
    |   |       cbs-access-gate.tsx            # Conditional UI element gating by RIDASH right
    |   |       index.ts
    |   |
    |   +---cbs-screen/                        # Standard Banking Screen Toolbars & Scaffold
    |   |   |   cbs-screen-scaffold.tsx        # Standard screen frame unifying hotkeys, header & tabs
    |   |   |   index.ts                       # Unified screen component barrel export
    |   |   +---header/                        # Screen top action & header widgets
    |   |   |       action-buttons.tsx         # Action buttons (Commit, Validate, Hold, Delete)
    |   |   |       action-more-menu.tsx       # Secondary action dropdowns (Audit, JSON, Raw)
    |   |   |       cbs-form-header.tsx        # Form screen top header with search & actions
    |   |   |       cbs-inquiry-header.tsx     # Inquiry screen top header with export buttons
    |   |   |       cbs-validation-checklist.tsx # Pre-commit issue drawer
    |   |   |       record-lookup-bar.tsx      # Fast GRL record searchbar
    |   |   +---hooks/                         # Screen lifecycle & persistence hooks
    |   |   |       use-cbs-persistence.ts     # Screen state sync hook
    |   |   |       use-guarded-action.ts      # Action execution guard hook
    |   |   |       use-record-lookup.ts       # GRL record search query hook
    |   |   +---states/                        # Operational screen canvases
    |   |   |       cbs-error-state.tsx        # Error boundary fallback canvas
    |   |   |       cbs-idle-state.tsx         # Initial lookup/selection canvas
    |   |   |       cbs-system-skeleton.tsx    # Universal loading skeletons
    |   |   \---tabs/                          # Auxiliary inspection tabs
    |   |           cbs-audit-tab.tsx          # Audit history & metadata tab
    |   |           cbs-json-viewer-tab.tsx    # Raw payload inspection tab
    |   |
    |   +---feedback/                          # Error & Warning Feedback
    |   |       confirm-dialog.tsx             # Destructive action modal
    |   |       empty-state.tsx                # Zero-data display placeholder
    |   |       error-boundary.tsx             # React component crash isolation
    |   |
    |   +---layout/                            # Application Layout Shell
    |   |   |   app-alert.tsx                  # Global announcement banner
    |   |   |   app-sidebar.tsx                # Collapsible navigation menu
    |   |   |   app-tabbar.tsx                 # DND-kit draggable multi-tab bar
    |   |   |   app-target-preview.tsx         # Drag preview tooltip
    |   |   |   app-timeout-watcher.tsx        # Session inactivity countdown modal
    |   |   |   workbench-shell.tsx            # Shell combining sidebar, tabbar, and canvas
    |   |   |   index.ts
    |   |   +---sidebar/
    |   |   |   |   index.ts
    |   |   |   |   types.ts
    |   |   |   +---components/                # Menu tree items, headers, footers
    |   |   |   \---widgets/                   # Branch switcher & theme toggle
    |   |   \---tabs/                          # Tab items, context menus, popup triggers
    |   |
    |   \---ui/                                # Atomic UI Components (Shadcn / Base UI)
    |           accordion.tsx, alert.tsx, button.tsx, calendar.tsx, card.tsx,
    |           checkbox.tsx, date-picker.tsx, dialog.tsx, dropdown-menu.tsx,
    |           input.tsx, select.tsx, table.tsx, tabs.tsx, toast.tsx, tooltip.tsx, etc.
    |
    +---features/                              # Feature Modules
    |   +---auth/                              # Authentication & User Security
    |   |       components/                    # Login & change-password form components
    |   |       hooks/                         # use-login, use-change-password
    |   |       types.ts, index.ts
    |   |
    |   +---command/                           # CBS Terminal Command Gateway
    |   |       app-search.tsx                 # Command palette dialog (<Cmd+K>)
    |   |       components/                    # Command search results & item rows
    |   |       hooks/                         # use-search-commands
    |   |       utils/                         # Command extractor & matchers
    |   |       types.ts, index.ts
    |   |
    |   +---docs/                              # In-App Technical Documentation Portal
    |   |       components/                    # Markdown doc viewer, sidebar, breadcrumbs
    |   |       config.ts, types.ts, actions.ts, index.ts
    |   |
    |   +---form-engine/                       # Headless Atomized Form Engine (Zero-Lag at 1000 fields)
    |   |   |   index.ts                       # Feature barrel export
    |   |   +---components/
    |   |   |       field-atom.tsx             # Self-subscribing atomic input wrapper
    |   |   |       field-factory.tsx          # Scanline terminal input widgets
    |   |   |       form-renderer.tsx          # Card & tab presentation canvas
    |   |   |       section-card.tsx           # Multi-column grid & collapsible card
    |   |   +---store/
    |   |   |       form-kernel-store.ts       # Per-form isolated Zustand store factory
    |   |   |       form-kernel-provider.tsx   # React context provider & selective useFormKernel hook
    |   |   \---validation/
    |   |           field-validator.ts         # Banking regex, length & mandatory field validator
    |   |
    |   +---inquiry-engine/                    # Dynamic Tabular Inquiry Rendering Engine
    |   |       components/                    # Inquiry table, filter panel, pagination
    |   |       index.ts
    |   |
    |   +---operations/                        # Core Banking Day-to-Day Operations
    |   |   +---forms/                         # Dynamic Maintenance & Transaction Forms
    |   |   |   |   ops-form.tsx               # Universal maintenance form screen
    |   |   |   |   types.ts
    |   |   |   |   index.ts
    |   |   |   +---components/                # FormGrid & skeleton
    |   |   |   +---hooks/                     # use-form-actions, use-form-persistence, use-form-state
    |   |   |   \---utils/                     # record-finder, record-normalizer
    |   |   \---inquiries/                     # Enquiry & Transaction Query Grids
    |   |       |   ops-inquiry.tsx            # Universal enquiry screen
    |   |       |   types.ts
    |   |       |   index.ts
    |   |       +---components/                # Selection criteria & results data grid
    |   |       \---hooks/                     # Enquiry execution & export hooks
    |   |
    |   +---settings/                          # User Preferences & Workstation Settings
    |   |       app-settings.tsx               # Settings modal dialog
    |   |       components/                    # General, appearance, hotkeys panels
    |   |       types.ts, index.ts
    |   |
    |   +---system/                            # System Administration Features
    |   |   +---form-config/                   # Visual Form Designer & Metamodel Catalog
    |   |   +---inquiry-config/                # Inquiry Specification & Filter Configurator
    |   |   +---menu-catalog/                  # System Command & Screen Directory
    |   |   +---menu-designer/                 # Drag-and-drop Menu Hierarchy Builder
    |   |   +---model-config/                  # Database Metamodel & Table Editor
    |   |   +---report-studio/                 # Financial Report Layout & PDF Generator
    |   |   \---user-group/                    # User Roles & Matrix Permissions
    |   |
    |   \---workbench/                         # MDI Shell & Dynamic Screen Loader
    |           loader.tsx                     # Dynamic screen loader with error boundaries
    |           registry.tsx                   # Screen component registry mapping
    |           types.ts
    |           index.ts
    |
    +---hooks/                                 # Global React Hooks
    |       use-idle-timeout.ts                # Session inactivity detection
    |       use-mobile.ts                      # Responsive viewport detector
    |       index.ts
    |
    +---lib/                                   # Headless Banking Architecture & Services
    |   +---cbs-access/                        # Access & Four-Eyes Capabilities
    |   |       accessibility.ts               # RIDASHL string/array parser
    |   |       record-guard.ts                # Deterministic capability evaluator
    |   |       use-cbs-access.ts              # Reactive capability hook
    |   |       types.ts, index.ts
    |   |
    |   +---cbs-client/                        # Canonical CBS Client SDK
    |   |   |   index.ts, README.md
    |   |   +---payloads/                      # Form, inquiry, menu, model wire payload builders
    |   |   \---transport/                     # Client-side proxy HTTP fetcher
    |   |
    |   +---cbs-command/                       # Terminal Gateway & Command Parser
    |   |   +---engine/                        # Grammar parser & syntax validator
    |   |   +---executor/                      # Action, popup, and terminal dispatchers
    |   |   +---registry/                      # Command catalog & alias maps
    |   |   \---types/                         # Command, execution & validation types
    |   |
    |   +---cbs-form-spec/                     # Dynamic Form Presentation Spec Compiler
    |   |       compile.ts                     # Layout, section & field atom compiler
    |   |       field-rules.ts                 # Banking business rules & validation spec
    |   |       index.ts, README.md
    |   |
    |   +---cbs-hotkeys/                       # Terminal Keyboard Shortcuts
    |   |       use-cbs-hotkeys.ts             # Banking standard hotkey mappings
    |   |       use-hotkeys.ts                 # Native event listener
    |   |       types.ts, index.ts
    |   |
    |   +---cbs-record/                        # Delta Mutation Engine
    |   |       baseline.ts                    # Record state snapshot generator
    |   |       delta-engine.ts                # Deep equality comparison & touched-field extractor
    |   |       types.ts, index.ts
    |   |
    |   +---cbs-screen/                        # Screen Lifecycle & Window Bus
    |   |       actions.ts                     # Action toolbar state machine
    |   |       audit.ts                       # Audit metadata formatters
    |   |       window.ts                      # Popup window contracts
    |   |       workbench-bus.ts               # BroadcastChannel & storage draft manager
    |   |       types.ts, validation.ts, index.ts
    |   |
    |   +---core-config/                       # Application Configuration
    |   |       client.ts                      # Isomorphic client-safe configuration
    |   |       env.ts                         # Validated process.env singleton
    |   |       server.ts                      # Server-only appConfig & service registry
    |   |       index.ts
    |   |
    |   +---core-logger/                       # Auditable Logging
    |   |       index.ts                       # Leveled logger (debug, info, warn, error)
    |   |       redact.ts                      # PII sanitizer (passwords, tokens, PAN)
    |   |
    |   +---core-utils/                        # Pure Banking Utilities
    |   |       account.ts                     # Account number formatting & masking
    |   |       currency.ts                    # BDT / Multi-currency formatters
    |   |       date.ts                        # Banking business date formatters
    |   |       export.ts                      # CSV / Excel export generators
    |   |       formula.ts                     # Mathematical & conditional expression evaluator
    |   |       string.ts, cn.ts, index.ts
    |   |
    |   +---data-parsers/                      # Protobuf & Wire Decoders
    |   |       auth-parser.ts, branch-parser.ts, control-parser.ts,
    |   |       form-parser.ts, inquiry-parser.ts, menu-catalog-parser.ts,
    |   |       menu-designer-parser.ts, menu-parser.ts,
    |   |       model-config-parser.ts, protobuf-decoder.ts,
    |   |       user-group-parser.ts, index.ts
    |   |
    |   +---data-schemas/                      # Zod Runtime Schemas
    |   |       auth-schema.ts, branch-schema.ts, common-schema.ts,
    |   |       control-schema.ts, env-schema.ts, form-config-schema.ts,
    |   |       form-schema.ts, form-spec-schema.ts, inquiry-config-schema.ts,
    |   |       inquiry-schema.ts, menu-catalog-schema.ts, menu-designer-schema.ts,
    |   |       menu-schema.ts, model-config-schema.ts, user-group-schema.ts, index.ts
    |   |
    |   +---infra-grpc/                        # gRPC Microservices Engine
    |   |   |   client.ts                      # gRPC client initialization & status mappers
    |   |   |   dispatch.ts                    # Dynamic envelope dispatcher
    |   |   |   index.ts
    |   |   \---generated/                     # Compiled service definitions
    |   |           service.ts                 # Generated Protobuf TypeScript interfaces
    |   |
    |   +---infra-redis/                       # Caching & Session Layer
    |   |       cache.ts                       # Read-through getOrSet & request deduplication
    |   |       client.ts                      # Fail-open circuit breaker & non-blocking scans
    |   |       rate-limit.ts                  # Fixed-window brute force protection
    |   |       session.ts                     # Dual-store session manager (Redis + in-memory Map)
    |   |       index.ts
    |   |
    |   +---infra-services/                    # Downstream Core Banking Services
    |   |       auth-service.ts                # Authentication & password management
    |   |       branch-service.ts              # Branch directory service
    |   |       control-service.ts             # System control commands service
    |   |       form-service.ts                # GMC form specification service
    |   |       inquiry-service.ts             # Enquiry specification service
    |   |       menu-service.ts                # Navigation menu service
    |   |       service-context.ts             # Session, branch, and command normalizer
    |   |       index.ts
    |   |
    |   +---store/                             # Global Reactive State Stores
    |   |   |   index.ts                       # Unified store barrel export
    |   |   |   root-provider.tsx              # Master application store provider
    |   |   |   theme-provider.tsx             # Dark/light theme provider
    |   |   |   +---alert/                     # Global modal alert store & provider
    |   |   |   +---session/                   # User session store & provider
    |   |   |   \---workbench/                 # Draggable tabbar & open screens store & provider
    |   |
    |   \---types/                             # Core Banking Domain Types
    |           api.ts                         # ApiResponse & HTTP envelopes
    |           cbs.ts                         # CbsRecordFunction (RIDASHL), CbsRequestType, etc.
    |           index.ts                       # Canonical type contracts export
```

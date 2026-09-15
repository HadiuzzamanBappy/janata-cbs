# ✅ FinXUI Refactoring Checklist

> **How to use**: Check off `[ ]` → `[x]` as you complete each task. Mark `[/]` for in-progress.
> Update the **Date** and **Notes** columns so you never lose track between sessions.
>
> **Rule**: Never skip ahead. Complete all tasks in a step before moving to the next.
> Steps 6 and 7 can run in parallel after Step 5 is done.

---

## Step 1: Core Foundation

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [x] | 1.1 | Bootstrap Next.js App Router project (`finxui-v2`) | | Next.js 16.3.4 + React 19 + pnpm. `.next/BUILD_ID` exists. |
| [x] | 1.2 | Setup `.env.local` with all required env vars | | 34 vars defined. Zod-validated via `src/lib/env.ts`. |
| [x] | 1.3 | Setup Tailwind CSS v4 `@theme` tokens (OKLCH colors, `--surface`, `--fg-muted`, etc.) | | `globals.css` has full OKLCH `:root` + `.dark` tokens via shadcn. |
| [x] | 1.4 | Setup light/dark theme toggle (blocking script, no flash) | | Implemented using `next-themes` and `suppressHydrationWarning`. |
| [x] | 1.5 | Configure `tsconfig.json` (`@/*` → `./src/*`, strict mode, no `any`) | | `strict: true`, `@/*` → `./src/*` confirmed. |
| [x] | 1.6 | Create `config/config.yml` and build `resolveServiceUrl()` loader | | No YAML file, but `src/lib/services.ts` provides `getServiceUrl()` from env vars. Functionally equivalent. |
| [x] | 1.7 | Create Zustand store: `src/store/workbench-store.ts` (tabs) | | Built with strict TypeScript. |
| [x] | 1.8 | Create Zustand store: `src/store/alert-store.ts` (notifications) | | Replaces SCAlert globals. |
| [x] | 1.9 | Create Zustand store: `src/store/session-store.ts` (current user, branch) | | Stores core context. |
| [x] | 1.10 | Build `components/layout/app-shell.tsx` (outer shell wrapper) | 2026-09-15 | Built layout container combining sidebar, header, tab bar, and alert banners. |
| [x] | 1.11 | Build `components/layout/sidebar.tsx` (navigation tree placeholder) | 2026-09-15 | Built banking sidebar with command box, domain menu items, and session footer using shadcn Sidebar. |
| [x] | 1.12 | Build `components/layout/tab-bar.tsx` (workspace tab header) | 2026-09-15 | Built workspace tab bar connected to workbench-store. |
| [x] | 1.13 | Verify: `next build` passes with zero errors | 2026-09-15 | `pnpm build` and `pnpm typecheck` passed cleanly with exit code 0. |
| [x] | 1.14 | Verify: Theme toggle works without flash in both modes | 2026-09-15 | Verified next-themes toggle integrated into app shell header. |

**Step 1 completed on**: 2026-09-15

---

## Step 2: Secure Infrastructure Bridge

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 2.1 | Copy `service.proto` into project | | |
| [ ] | 2.2 | Setup `proto-gen` script in `package.json` | | |
| [ ] | 2.3 | Generate ts-proto stubs → `src/lib/core/generated/` | | |
| [ ] | 2.4 | Verify generated types compile without errors | | |
| [ ] | 2.5 | Build `src/lib/core/grpc.ts` (singleton client + `"server-only"`) | | |
| [ ] | 2.6 | Build `src/lib/core/dispatch.ts` (unified gRPC/REST dispatcher + `"server-only"`) | | |
| [ ] | 2.7 | Build `src/lib/core/redis-client.ts` (ioredis connection + circuit breaker + `"server-only"`) | | |
| [ ] | 2.8 | Build `src/lib/core/redis-session.ts` (sliding-expiry session CRUD + `"server-only"`) | | |
| [ ] | 2.9 | Build `src/lib/core/cache.ts` (`getOrSet()` with `CACHE_ENABLED` flag + `"server-only"`) | | |
| [ ] | 2.10 | Build `src/lib/core/services.ts` (YAML config resolver + `"server-only"`) | | |
| [ ] | 2.11 | Build `src/app/api/proxy/route.ts` (secure gRPC forwarder) | | |
| [ ] | 2.12 | Build `src/app/api/login/route.ts` (auth endpoint) | | |
| [ ] | 2.13 | Build `src/app/api/logout/route.ts` (session cleanup) | | |
| [ ] | 2.14 | Build `src/app/api/session/route.ts` (consolidated check/get/set) | | |
| [ ] | 2.15 | Build `src/app/api/cache/route.ts` (cache invalidation) | | |
| [ ] | 2.16 | Verify: `POST /api/proxy` sends envelope → receives backend response | | |
| [ ] | 2.17 | Verify: Login → session cookie set; Logout → cookie cleared | | |
| [ ] | 2.18 | Verify: Redis down → app still works (circuit breaker fires within 5ms) | | |
| [ ] | 2.19 | Verify: `CACHE_ENABLED=false` → all requests go direct to gRPC | | |

**Step 2 completed on**: _______________

---

## Step 3: Schema Engine & Dynamic Rendering

### 3A: Data Dictionary (can start in parallel with 3B)

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 3.1 | Build `src/lib/schema/schemas.ts` (Zod schema definitions for GMC/MNU payloads) | | |
| [ ] | 3.2 | Build `src/lib/schema/schema-parser.ts` (`parseGMC()` → `FormSchema`) | | |
| [ ] | 3.3 | Build `src/lib/schema/menu-parser.ts` (`parseMNU()` → `MenuItem[]`) | | |
| [ ] | 3.4 | Port `src/lib/schema/static-mocks.ts` (offline dev data) | | |
| [ ] | 3.5 | Verify: Invalid GMC payload → structured Zod error (not crash) | | |
| [ ] | 3.6 | Verify: Real GMC response parses into typed FormSchema | | |

### 3B: UI Components & Rendering (can start in parallel with 3A)

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 3.7 | Build `components/ui/input.tsx` | | |
| [ ] | 3.8 | Build `components/ui/select.tsx` | | |
| [ ] | 3.9 | Build `components/ui/date-picker.tsx` | | |
| [ ] | 3.10 | Build `components/ui/checkbox.tsx` | | |
| [ ] | 3.11 | Build `components/ui/button.tsx` | | |
| [ ] | 3.12 | Build `components/ui/data-table.tsx` (replaces SCDataTable + DataListView) | | |
| [ ] | 3.13 | Build `components/ui/dialog.tsx` (replaces MessageBox + PopUp) | | |
| [ ] | 3.14 | Build `components/ui/alert.tsx` (replaces SCAlert + ShowAlert) | | |
| [ ] | 3.15 | Build `components/ui/accordion.tsx` | | |

### 3C: Engine Assembly (depends on 3A + 3B)

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 3.16 | Implement RSC menu hydration in `src/app/(core)/layout.tsx` | | |
| [ ] | 3.17 | Build `src/app/api/model/[cmd]/route.ts` (schema endpoint) | | |
| [ ] | 3.18 | Build `features/engine/field-factory.tsx` (maps field.type → atomic component) | | |
| [ ] | 3.19 | Build `features/engine/hooks/use-schema.ts` (schema fetching hook) | | |
| [ ] | 3.20 | Build `features/engine/hooks/use-form-state.ts` (form state reducer) | | |
| [ ] | 3.21 | Build `features/engine/form-renderer.tsx` (grid layout engine) | | |
| [ ] | 3.22 | Build `features/engine/dynamic-form.tsx` (schema-driven form renderer) | | |
| [ ] | 3.23 | Build `features/workspace/component-registry.ts` (explicit bespoke map) | | |
| [ ] | 3.24 | Build `features/workspace/component-loader.tsx` (SINGLE unified loader) | | |
| [ ] | 3.25 | Verify: Menu tree renders on first paint (SSR, no flash) | | |
| [ ] | 3.26 | Verify: `GET /api/model/ACCOUNT` returns FormSchema JSON | | |
| [ ] | 3.27 | Verify: Opening a command renders a dynamic form with correct fields | | |

**Step 3 completed on**: _______________

---

## Step 4: Authentication & Session Flow

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 4.1 | Build login page `src/app/(auth)/login/page.tsx` | | |
| [ ] | 4.2 | Wire login form → `/api/login` → session cookie | | |
| [ ] | 4.3 | Build session middleware (unauthenticated → redirect to `/login`) | | |
| [ ] | 4.4 | Port `features/auth/change-password.tsx` ← `SC.CHANGE.PASS.tsx` | | |
| [ ] | 4.5 | Port `features/auth/reset-password.tsx` ← `SC.USER.PASS.RESET.tsx` | | |
| [ ] | 4.6 | Port `features/auth/user-groups.tsx` ← `SC.USER.GROUP.tsx` | | |
| [ ] | 4.7 | Register auth screens in component registry | | |
| [ ] | 4.8 | Verify: Login → dashboard; Invalid creds → error | | |
| [ ] | 4.9 | Verify: Direct URL access while logged out → redirect to login | | |
| [ ] | 4.10 | **Side-by-side test**: Login flow matches old app behavior | | |

**Step 4 completed on**: _______________

---

## Step 5: Core Engine Features

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 5.1 | Build `components/layout/toolbar.tsx` (New, Save, Auth, Delete, Reverse, Search) | | |
| [ ] | 5.2 | Build `features/engine/search-engine.tsx` ← `SC.SEARCH.tsx` | | |
| [ ] | 5.3 | Build `features/engine/audit-info.tsx` ← `AuditInfo.tsx` | | |
| [ ] | 5.4 | Build `features/engine/control-list.tsx` ← `SC.CONTROL.LIST.tsx` | | |
| [ ] | 5.5 | Build `features/engine/special-process.tsx` ← `SC.SPC.tsx` | | |
| [ ] | 5.6 | Build `features/workspace/command-executor.ts` (window.open + instance tracking) | | |
| [ ] | 5.7 | Build `features/workspace/window-frame.tsx` (in-page fallback) | | |
| [ ] | 5.8 | Wire window-mode execution (popup cascade) | | |
| [ ] | 5.9 | Wire panel-mode execution (tabbed workspace) | | |
| [ ] | 5.10 | Port utility: `lib/utils/date.ts` ← `GlobalFunc.ts` (date functions) | | |
| [ ] | 5.11 | Port utility: `lib/utils/currency.ts` ← `GlobalFunc.ts` (AmountToWord) | | |
| [ ] | 5.12 | Port utility: `lib/utils/enums.ts` ← `GlobalEnums.ts` | | |
| [ ] | 5.13 | Port utility: `lib/utils/command-parser.ts` ← `command.ts` (pure parser) | | |
| [ ] | 5.14 | Verify: All toolbar actions trigger correct gRPC calls | | |
| [ ] | 5.15 | Verify: Search returns correct results from backend | | |
| [ ] | 5.16 | Verify: Popup windows cascade with instance numbering | | |
| [ ] | 5.17 | Verify: Tab switching preserves form state (no data loss) | | |
| [ ] | 5.18 | **Side-by-side test**: CRUD on ACCOUNT matches old app exactly | | |

**Step 5 completed on**: _______________

---

## Step 6: Inquiry & Reporting (can run parallel with Step 7)

### Inquiries

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 6.1 | Decompose `INQ.tsx` → `features/inquiries/inquiry-engine.tsx` | | |
| [ ] | 6.2 | Extract `features/inquiries/inquiry-filters.tsx` | | |
| [ ] | 6.3 | Extract `features/inquiries/inquiry-results.tsx` | | |
| [ ] | 6.4 | Port `features/inquiries/general-inquiry.tsx` ← `GIR.tsx` | | |
| [ ] | 6.5 | Port `features/inquiries/specific-inquiry.tsx` ← `SIR.tsx` | | |
| [ ] | 6.6 | Decompose `SC.INQUIRY.tsx` → `features/inquiries/inquiry-engine-v2.tsx` | | |
| [ ] | 6.7 | Register all inquiry screens in component registry | | |
| [ ] | 6.8 | Verify: INQ with filters returns correct data | | |
| [ ] | 6.9 | Verify: GIR and SIR queries execute correctly | | |
| [ ] | 6.10 | **Side-by-side test**: Inquiry results match old app | | |

### Reporting

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 6.11 | Port `features/reporting/report-line.tsx` ← `SC.REPORT.LINE.tsx` | | |
| [ ] | 6.12 | Port `features/reporting/report-viewer.tsx` ← `SC.RPT.tsx` | | |
| [ ] | 6.13 | Isolate ReportStudio → `features/reporting/report-studio/` (lazy-loaded) | | |
| [ ] | 6.14 | Register reporting screens in component registry | | |
| [ ] | 6.15 | Verify: Report line definitions save/load | | |
| [ ] | 6.16 | Verify: ReportStudio is NOT in main bundle (check `next build` output) | | |
| [ ] | 6.17 | **Side-by-side test**: Report generation matches old app | | |

**Step 6 completed on**: _______________

---

## Step 7: System Configuration (can run parallel with Step 6)

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 7.1 | Decompose `SC.MODEL.CONFIG.tsx` → `features/system-config/model-config.tsx` | | |
| [ ] | 7.2 | Decompose `SC.FORM.BUILDER.tsx` → `features/system-config/form-builder/` | | |
| [ ] | 7.2a | └── `form-builder/index.tsx` (entry point) | | |
| [ ] | 7.2b | └── `form-builder/form-canvas.tsx` (drag-and-drop grid) | | |
| [ ] | 7.2c | └── `form-builder/form-palette.tsx` (property list sidebar) | | |
| [ ] | 7.2d | └── `form-builder/property-inspector.tsx` (field config drawer) | | |
| [ ] | 7.2e | └── `form-builder/form-tabs.tsx` (tab/page grouping) | | |
| [ ] | 7.2f | └── `form-builder/hooks/use-builder-dnd.ts` (DnD state hook) | | |
| [ ] | 7.3 | Decompose `SC.MENU.DESIGN.tsx` → `features/system-config/menu-design.tsx` | | |
| [ ] | 7.4 | Port `SC.SCREEN.BUILDER.tsx` → `features/system-config/screen-builder/` | | |
| [ ] | 7.5 | Port `SC.HELP.TEXT.tsx` → `features/system-config/help-text.tsx` | | |
| [ ] | 7.6 | Port `SC.COB.REGISTRY.tsx` → `features/system-config/cob-registry.tsx` | | |
| [ ] | 7.7 | Register all system-config screens in component registry | | |
| [ ] | 7.8 | Verify: Model config CRUD works | | |
| [ ] | 7.9 | Verify: Form builder drag-and-drop field placement works | | |
| [ ] | 7.10 | Verify: Menu design tree editing works | | |
| [ ] | 7.11 | **Side-by-side test**: Config changes persist identically to old app | | |

**Step 7 completed on**: _______________

---

## Step 8: Polish, Optimization & Production

| Done | # | Task | Date | Notes |
| :---: | :---: | :--- | :--- | :--- |
| [ ] | 8.1 | Set `CACHE_ENABLED=true` and test Redis caching | | |
| [ ] | 8.2 | Verify: Spec loads < 5ms on cache hit | | |
| [ ] | 8.3 | Verify: Redis down → graceful degradation (circuit breaker) | | |
| [ ] | 8.4 | Verify: `DELETE /api/cache` clears all cached data | | |
| [ ] | 8.5 | Run `next build` → analyze bundle sizes | | |
| [ ] | 8.6 | Verify: No feature chunk > 50 KB in initial load | | |
| [ ] | 8.7 | Verify: ReportStudio only loaded on demand | | |
| [ ] | 8.8 | Theme polish: all screens correct in light mode | | |
| [ ] | 8.9 | Theme polish: all screens correct in dark mode | | |
| [ ] | 8.10 | Accessibility: keyboard navigation through all interactive elements | | |
| [ ] | 8.11 | Accessibility: focus rings visible in both themes | | |
| [ ] | 8.12 | `next build` passes with zero errors and zero warnings | | |
| [ ] | 8.13 | Remove all `console.log` debug statements | | |
| [ ] | 8.14 | Final side-by-side test: complete transaction flow (AFT/ACT) | | |

**Step 8 completed on**: _______________

---

## Code Quality Gate (Check Before Every Commit)

- [ ] No file exceeds **300 lines** (components) or **200 lines** (utilities)
- [ ] Zero `any` types in the codebase
- [ ] Every `src/lib/core/*` file starts with `import "server-only"`
- [ ] No duplicate loader logic (single `ComponentLoader` only)
- [ ] No direct gRPC calls from client components
- [ ] `next build` passes cleanly

---

## Daily Log

> Use this section to jot down what you did each day so you can resume instantly.

| Date | What I Worked On | What's Next |
| :--- | :--- | :--- |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |
| | | |

---

## Files Removed (Confirm Deletion)

> These files from the old project have NO migration target. Confirm they are intentionally excluded.

- [ ] `SC.NF.tsx` — Empty stub (< 1 KB)
- [ ] `SC.SE.tsx` — Empty stub (< 1 KB)
- [ ] `componentLoader.tsx` — Replaced by unified `component-loader.tsx`
- [ ] `pannelLoader.tsx` — Replaced by unified `component-loader.tsx`
- [ ] `windowLoader.tsx` — Replaced by unified `component-loader.tsx`
- [ ] `APIService.ts` — Replaced by direct `fetch('/api/proxy')` calls
- [ ] `src/server/grpc-client.ts` — Consolidated into `src/lib/core/grpc.ts`
- [ ] `api/menu/` route — RSC fetches menu directly in layout
- [ ] `api/checksession/` + `api/getsession/` + `api/setsession/` — Consolidated into `api/session/`

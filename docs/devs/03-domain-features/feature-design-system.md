# CBS System Feature Development Rules & Checklist
> **Standard Reference**: `src/features/system/model-config`  
> **Rule Level**: Mandatory for AI Agents & Developers on every new CBS feature screen (`MENU`, `MENU.TREE`, `USER.GROUP`, `MODEL.CONFIG`, etc.).

---

## 1. Schema & Contracts Rules (Zero Legacy)
- [ ] **Single Source of Truth**: All domain contracts live in `@/lib/schemas/<feature>-schema.ts`.
- [ ] **No Proxy Type Files**: Never create `features/<feature>/types.ts` that merely re-exports schemas. UI files must import directly from `@/lib/schemas/<feature>-schema`.
- [ ] **Zero Legacy Capital-Case Wire Schemas**: If the DB stores modern JSON, define only clean camelCase schemas (`recordId`, `tableName`, `properties`). Do not write redundant uppercase schemas (`TABLENAME`, `PROPERTIES`).
- [ ] **Zero Enums Duplication**: Generate selectable options arrays directly from Zod enums (e.g. `export const PROPERTY_TYPES = propertyTypeSchema.options;`).
- [ ] **Strict Zod ID & Label Validation**: Every record must have `.min(1)` on primary identification keys and labels.
- [ ] **No Default Values on Free-Text Inputs**: Never set default values (e.g. `default("")`, `default(true)`) on free-text inputs in Zod schemas or initial state. Only predefined domain classifications (e.g. `menuType.default("SCREEN")`) may have defaults. Let new draft records start clean.
- [ ] **Primary Key Exclusivity (No ID Duplication)**: The Record ID (`@ID` / `recordId`) is **exclusively managed by the `CbsFormHeader`**. Never add a redundant `recordId` / `@ID` input row to the General tab body or metadata field registries. The form body only contains table properties from `fixtures/model-configs.ts`.

---

## 2. Inbound/Outbound Parser & Serialization Rules
- [ ] **Mandatory Dedicated Parser**: Every feature must have a parser in `@/lib/parsers/<feature>-parser.ts` (e.g. `parse<Feature>Record`, `parse<Feature>List`, `serialize<Feature>ToWireJson`) and re-exported in `@/lib/parsers/index.ts`.
- [ ] **Safe Serialization (No Runtime Exceptions on Drafts)**: `serialize<Feature>ToWireJson` must use `.safeParse()` and return the draft record fallback so live typing in drafts or opening the JSON preview tab never throws a `Runtime ZodError`.
- [ ] **No Silent Property Dropping**: Never use `.filter()` inside serializers to silently drop rows with empty values. Let pre-submit validation catch errors; preserve all user-defined items to prevent column/order shifts in banking tables.
- [ ] **Direct 1:1 Storage**: Outbound serialization must be a direct pass-through of the validated camelCase record unless communicating with legacy uppercase adapters.

---

## 2.1. Development Mode & Data Source Architecture Rules
- [ ] **`modelSource: "static"` is a Dedicated Dev Mode (Not a Failure Fallback)**:
  - When `appConfig.modelSource === "static"`, the application is explicitly running in offline development/mock mode.
  - The API proxy (`/api/proxy`) must check `appConfig.modelSource === "static"` **at the top** and return directly from `fixtures/form-data.ts` (`STATIC_FORM_DATA`), `fixtures/model-configs.ts`, or `fixtures/inquiries.ts`. gRPC should never be called.
  - In `gRPC` mode (`modelSource === "grpc"`), dispatch directly to the CBS backend. **If gRPC fails, it fails (return 502/error)**; never silently serve fake static fallback data in live backend mode.
- [ ] **Mandatory Table Registration in `STATIC_FORM_DATA`**:
  - Whenever a new feature or control table is built (`MENU`, `USER.GROUP`, etc.), register its dev records in `fixtures/form-data.ts`:
    - `records`: Dictionary of records keyed by `@ID` (e.g. `"1": { ... }`) with full domain attributes and `auditData`.
    - `enquiryRows`: Flat array of all rows for `RECORD_LIST` responses and catalog listings.
- [ ] **No Hardcoded Component Fallback Pools**:
  - In custom hooks (`use-<feature>.ts`), never keep secondary inline demo objects (e.g. `itemsPool = [ { recordId: "1", label: "Demo" } ]`). All mock data lives in `fixtures/form-data.ts` and flows naturally through the API gateway.
- [ ] **No Artificial String Interpolation on New Records**:
  - When a record is not found or when creating a new record, return a completely blank draft (`{ ...INITIAL_RECORD, recordId }`). Never inject synthetic strings like `label: "Menu " + id`.

---

## 3. State Management, Refresh & Multi-Monitor Popup Rules
- [ ] **Dual-Layer Hydration on Mount**:
  1. **Layer 1 (Detached Popup Window)**: Inspect `window.location.search` for `?recordId=...&mode=...`.
  2. **Layer 2 (In-App Tab / F5 Refresh)**: Inspect `currentTab.formData` from `useWorkbenchStore` (persisted in `sessionStorage`).
  3. **Layer 3 (Props Fallback)**: Fall back to `initialId` prop, or blank initial state.
- [ ] **No `setState` During Render**: Never call `updateFormData` or `updateTabState` inside the `setState((prev) => ...)` reducer. Decouple all external Zustand store syncs into a `React.useEffect` with an `isFirstRender` ref guard.
- [ ] **Atomic Local State Updates**: Keep form changes fast in component state; let the background effect debounce or sync draft state to `sessionStorage`.
- [ ] **Non-Colliding Numeric ID Generation**: When adding dynamic rows (e.g. fields or tree items), compute `maxId = reduce((max, item) => Math.max(max, Number(item.sn)), 0) + 1`. Never auto-renumber existing items.
- [ ] **Committed vs. Uncommitted Lifecycle**:
  - **Uncommitted (New Draft)**: Can be hard-deleted from memory.
  - **Committed (Persisted in CBS)**: Can only be marked `ARCHIVED` (or restored). Physical position and serial numbers must be permanently preserved.

---

## 4. Modularity & File Size Rules (< 250 Lines)
- [ ] **Strict File Size Cap**: Every component and hook should be between **150–250 lines**.
- [ ] **Root Component Location**: Screen components live at the feature root as `src/features/system/<feature>/sys-<feature>.tsx` (e.g. `sys-model-config.tsx`, `sys-menu-catalog.tsx`), NEVER buried inside `components/`.
- [ ] **Orchestrator Pattern**: Screen and tab parents (`mc-property-inspector.tsx`, `mc-properties-tab.tsx`) must be clean orchestrators (**< 80 lines**) wiring layout and passing props.
- [ ] **Decompose by Sub-Domain Responsibility**:
  - `<feature>-header.tsx`: Title, SN anchor, status badges, archive/restore CTA, delete confirm modal.
  - `<feature>-identity.tsx`: Core identity inputs (`name`, `label`, `structure`, constraints).
  - `<feature>-specs.tsx`: Dynamic type-dependent specifications (`defaultValue`, `length`, `mask`, `pattern`).
  - `use-<feature>-persistence.ts`: URL inspection + workbench draft sync.
  - `<feature>-validation.ts`: Pure Zod issue router mapping errors to tabs and item IDs.

---

## 5. UI/UX Rules, Micro-Attributes & Layout Standards
- [ ] **Standard 3-Zone Layout**:
  - **Zone 1 (Header)**: Uses `<CbsFormHeader title="..." commandCode="..." />` with direct toolbar props:
    - `onValidate`: Primary toolbar validate button (`?✓`).
    - `onSubmit`: Primary save button (`✓`).
    - `onAuthorizeReverse`: Primary authorization button (`A`).
    - `onAmend` & `onView`: Re-fetch record in requested mode.
    - `moreActions`: Reserved only for extra actions (e.g. toggle status).
  - **Zone 2 (Tabs Row Strip)**:
    - Container: `border-b border-border/70 pb-1 flex items-center justify-between shrink-0`.
    - Tab list: `<TabsList className="h-7 bg-muted/60 p-0.5 rounded">`.
    - Trigger buttons: `h-6 px-2.5 text-xs rounded gap-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-2xs font-medium`.
    - Right side: Standard CBS Validation Checklist dropdown (`Fix First →`) + `SYS_<TABLE>` tag.
  - **Zone 3 (Body Canvas & Tabs Content)**:
    - Wrapper: `<div className="flex-1 overflow-hidden p-2 flex flex-col min-h-0">`.
    - IDLE state: `<CbsIdleState title="..." code="..." customMessage="..." />` centered on the full canvas.
    - Active content: `<TabsContent className="flex-1 overflow-hidden min-h-0 m-0">`.
  - **Zone 4 (Audit Footer)**:
    - Footer: `<CbsAuditFooter audit={auditFooterData} />` displayed whenever `mode !== "IDLE"`.
- [ ] **Tab Body Card Design Standards (1:1 with Model Config)**:
  - **General Tab**:
    - Declarative field groups in `config/meta-fields.ts` (`IDENTITY`, `BEHAVIOR`, `STATUS`).
    - Group cards: `rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5`.
    - Group title: `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60`.
    - Lifecycle State row: Checkbox with badge (`ACTIVE ...` in emerald vs `INACTIVE ...` in muted).
  - **Audit Tab**:
    - Two canonical sections: `CBS Ledger & Audit Summary` (status badge, revision, branch) and `Lifecycle Sign-off & Personnel Details` (inputter & authorizer cards with user/shield icons and timestamps).
  - **JSON Output Tab**:
    - Full-height card with toolbar: `(SYS_<TABLE>)` wire tag, lines & size badge, `Copy JSON` and `Download` buttons.
- [ ] **Form Row Micro-Attributes**:
  - **Label Width**: `w-32 shrink-0 text-xs font-medium text-muted-foreground select-none`.
  - **Separator**: `<span className="text-muted-foreground/60 font-mono text-xs">:</span>`.
  - **Input Height & Styling**: `h-7 rounded text-xs bg-background max-w-md flex-1` (use `w-32` for compact codes).
  - **Checkbox Row**: `flex items-center gap-1.5 select-none text-xs`.
- [ ] **No Hardcoded All-Caps Text in Strings**:
  - Write all copy in human Title Case (`"Draft (New)"`, `"Active"`, `"Archived"`).
  - For small visual badges, apply CSS transform: `className="font-mono text-[10px] h-5 rounded uppercase tracking-wider"`.
- [ ] **Validation Error Indicators**:
  - **Tab Badge**: Red badge with count on the tab header (`ml-1 h-3.5 min-w-3.5 px-1 text-[9px] rounded-full`).
  - **Field Border**: `border-destructive focus-visible:ring-destructive/30 bg-destructive/5`.
  - **Field Message**: Indented bullet below the input (`pl-35 text-[11px] text-destructive font-medium`).
- [ ] **Pre-Submit Validation Gate**:
  - Clicking **Save** runs `schema.safeParse(formData)`.
  - If invalid: block network requests, trigger warning toast with count of issues, and expand the error dropdown.
  - If valid: clear errors and execute `cbs.send(...)`.

---

## 6. Standard Feature Directory Blueprint
Every new system feature must adhere to this folder structure:

```
src/features/system/<feature-name>/
├── components/
│   ├── <feature>-header.tsx            # Header & action buttons
│   ├── <feature>-general-tab.tsx       # Primary metadata tab
│   ├── <feature>-audit-tab.tsx         # Read-only audit viewer
│   ├── <feature>-json-tab.tsx          # Export / live JSON preview
│   └── <sub-domain>/                   # For split-pane layouts (e.g. property, tree-node)
│       ├── <sub-domain>-list.tsx       # Left-hand master list
│       ├── <sub-domain>-inspector.tsx  # Right-hand orchestrator (<80 lines)
│       └── inspector/
│           ├── inspector-header.tsx    # Item header & delete modal
│           ├── inspector-identity.tsx  # Core attributes (<180 lines)
│           └── inspector-specs.tsx     # Specialized attributes (<180 lines)
├── config/
│   ├── meta-fields.ts                  # Declarative general metadata field registry
│   └── audit-fields.ts                 # Declarative audit trail registry
├── hooks/
│   ├── use-<feature>.ts                # High-level domain facade hook
│   ├── use-<feature>-persistence.ts    # Dual-layer URL + workbench hydration hook
│   └── <feature>-validation.ts         # Zod issue router helper
├── sys-<feature-name>.tsx              # Top-level screen component
└── index.ts                            # Clean public export (Sys<Feature>, use<Feature>)
```

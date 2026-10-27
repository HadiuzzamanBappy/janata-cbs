# 🖥️ CBS Screen Architecture & Core Capabilities (`@/lib/cbs-screen`)

The core presentation scaffolding, persistence coordination, and UI capability library for the **Janata Core Banking Workbench**.

It translates raw banking entitlements (`cbs-access`) into **reactive action bar button states**, provides **Zod error-to-tab navigation**, enables **DOM auto-focusing on form validation errors**, and coordinates **cross-window popup and workbench synchronization** via the centralized Workbench Bus.

---

## 📦 Directory Structure & Responsibilities

```text
src/lib/cbs-screen/
├── actions.ts          # Action bar capability engine & dynamic disable reason resolution
├── persistence.ts      # Pure initial record/mode/form data resolution with Zod validation
├── types.ts            # Layout models, tabs, audit raw contracts, and scaffold props
├── validation.ts       # Zod error-to-tab mapper & crash-proof CSS selector DOM auto-scrolling
├── workbench-bus.ts    # BroadcastChannel cross-window bus, dock events & session draft cache
└── index.ts            # Canonical barrel export
```

---

## 🔑 Core Modules & Contracts

### 1. Action Bar Capabilities (`actions.ts`)

- **`useCbsActionBar`**: Headless state engine that computes `enabled` and `reason` for all 11 action bar buttons (`Commit`, `Validate`, `Hold`, `Delete`, `Authorize`, `Reverse`, `Process`, `Amend`, `View`, `PerformAction`, `ReturnToSearch`).
- Automatically factors in `submitting` state, active screen mode (`IDLE`, `I`, `S`, `A`), and user entitlements via `access.getDisableReason(func)`.
- Eliminates hardcoded strings and legacy rights by binding strictly to `CbsRecordFunction` (`@/types`).

### 2. Pure Persistence Helpers (`persistence.ts`)

- **`resolveInitialRecordId(options)`**: Resolves record ID with precedence: URL query param $\rightarrow$ tab store $\rightarrow$ caller prop fallback.
- **`resolveInitialScreenMode(options)`**: Validates and resolves screen mode (`IDLE` or `CbsRecordFunction`) from URL and tab state against `CBS_SCREEN_MODES`.
- **`resolveInitialFormData(options)`**: Retrieves working session draft or applies caller baseline, safely validated against optional Zod schemas.

### 3. Workbench Bus & Cross-Window Coordination (`workbench-bus.ts`)

- **`broadcastRecordMutation(control, recordId)`**: Broadcasts mutation events across tabs and detached popup windows whenever a record is created, amended, authorized, or deleted.
- **`useRecordMutationSubscriber(callback, controlFilter?)`**: Stabilized hook (powered by `useRef`) that subscribes to mutation broadcasts, triggering background refetches when related records update in another tab.
- **`setWorkbenchDraft` / `getWorkbenchDraft` / `clearWorkbenchDraft`**: Shared session storage draft engine enabling 150+ to 1,000+ field forms to be transferred into detached popup windows without exceeding browser URL limits.
- **`broadcastDockTab` / `CBS_SCREEN_EVENT` / `CBS_SCREEN_MESSAGE`**: Cross-window docking bridge between the main shell and detached browser windows via `BroadcastChannel`.
- **`makePopupTabId(screenId)`**: Canonical popup tab identifier ensuring deterministic hydration between opener and window.

### 4. Validation & Focus Utilities (`validation.ts`)

- **`mapZodIssuesToTabs`**: Maps raw `z.ZodIssue[]` into tab-addressed `CbsScreenValidationError<TTab>[]` for high-density multi-tab forms.
- **`focusFormField(fieldKey?, nodeId?)`**: Smoothly scrolls and auto-focuses the offending input element when an operator clicks an error in the validation checklist drawer. Uses `escapeCss` and selector try-catch guards to handle dotted/bracketed paths without throwing DOM exceptions.

### 5. Scaffold Models (`types.ts`)

- Defines contracts for `CbsScreenScaffoldProps`, `CbsScreenTab`, `CbsScreenValidationError`, `RecordLookupItem`, and `MoreActionItem`.
- **Single Source of Truth**: Does not re-export `CbsScreenMode` or `CbsRecordFunction` — all consumers import them directly from `@/types`.

---

## 🏛️ Screen Lifecycle & Event Coordination

```
┌────────────────────────────────────────────────────────┐
│                   CBS Screen Scaffolding               │
│                  (<CbsScreenScaffold />)               │
└───────────────────────────┬────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         ▼                                     ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│     useCbsPersistence       │   │       useCbsActionBar       │
│  • Pure baseline tracking   │   │  • RIDASHL capability map   │
│  • Debounced tab store sync │   │  • Mode: IDLE, I, S, A      │
│  • rebaseline() on save     │   │  • Four-Eyes status check   │
└──────────────┬──────────────┘   └──────────────┬──────────────┘
               │                                 │
               ▼                                 ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│      useGuardedAction       │   │        useCbsHotkeys        │
│  • Return, New, Search      │   │  • F2, F3, F5, F6, F7, F8   │
│  • Guarded when isDirty     │   │  • Universal terminal hotkey│
└──────────────┬──────────────┘   └─────────────────────────────┘
               │
               ▼
┌────────────────────────────────────────────────────────┐
│             Workbench Bus (workbench-bus.ts)           │
│                                                        │
│  broadcastRecordMutation("ACCOUNT", "ACC001")          │
│     ├── Notifies open tabs via BroadcastChannel        │
│     └── Triggers useRecordMutationSubscriber refetch   │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 Usage Examples

### 1. Cross-Tab Record Mutation Synchronization

Broadcast when saving in one tab, and automatically update other open tabs or inquiry screens:

```typescript
import { broadcastRecordMutation, useRecordMutationSubscriber } from "@/lib/cbs-screen";

// In your mutation hook (e.g. useFormMutations):
async function onSaveSuccess(control: string, recordId: string) {
  // Broadcasts to all other tabs and detached popups
  broadcastRecordMutation(control, recordId);
}

// In another tab or inquiry screen:
export function AccountInquiryScreen() {
  useRecordMutationSubscriber((event) => {
    console.log(`Record #${event.recordId} updated in ${event.control}. Refetching grid...`);
    refetchInquiryGrid();
  }, "ACCOUNT"); // Optional control filter
}
```

---

### 2. Auto-Focusing Validation Errors in Multi-Tab Forms

```typescript
import { focusFormField, type CbsScreenValidationError } from "@/lib/cbs-screen";

function handleErrorClick(error: CbsScreenValidationError) {
  // 1. Switch active tab if needed
  setActiveTab(error.tab);

  // 2. Auto-scroll and focus target input element safely
  focusFormField(error.fieldKey, error.nodeId);
}
```

---

### 3. Screen Scaffolding & Persistence

```tsx
import { CbsScreenScaffold, useCbsPersistence } from "@/components/cbs-screen";
import type { CbsScreenProps } from "@/lib/cbs-screen";

export function ModelConfigScreen({ command, tabId }: CbsScreenProps) {
  const { formData, setFormData, isDirty, rebaseline } = useCbsPersistence({
    tabId,
    initialData: defaultModel,
  });

  return (
    <CbsScreenScaffold title="Model Configuration" commandCode={command} isDirty={isDirty}>
      {/* Tab and form content */}
    </CbsScreenScaffold>
  );
}
```

---

## 🔒 Architectural State: Scalable or Sealed?

- **Action Engine (`actions.ts`): SEALED**  
  The button state matrix for CBS operations (`IDLE`, `I`, `S`, `A`) is fully deterministic and complete.
- **Persistence Resolution (`persistence.ts`): SEALED**  
  Precedence rules for URL, tab store, and session drafts are canonical.
- **Validation & Focus (`validation.ts`): SEALED**  
  CSS escaping and selector hierarchy (`[data-field]`, `[name]`, `#id`, `[id$="..."]`, `[data-node-id]`) are crash-proof.
- **Workbench Bus (`workbench-bus.ts`): SEALED**  
  Cross-window event contracts, BroadcastChannel, and draft storage are standard across all tabs and popups.
- **Scaffold Models (`types.ts`): SCALABLE**  
  If a screen requires custom tabs or supplementary action bar items, use `moreActions` or extend `CbsScreenScaffoldProps`.

---

## 🧪 Verification

Run the master verification suites to ensure all contracts remain 100% compliant:

```bash
# Run all CBS master verification test suites
pnpm verify:all

# Strict typechecking & linting
pnpm typecheck
pnpm lint:fix
```

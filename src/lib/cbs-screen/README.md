# 🖥️ CBS Screen Architecture & Core Capabilities (`@/lib/cbs-screen`)

The core presentation scaffolding, persistence coordination, and UI capability library for the **Janata Core Banking Workbench**.

It translates raw banking entitlements (`cbs-access`) into **reactive action bar button states**, provides **Zod error-to-tab navigation**, enables **DOM auto-focusing on form validation errors**, and coordinates **cross-window popup and workbench synchronization** via the centralized Workbench Bus.

---

## 📦 Directory Structure & Responsibilities

```text
src/lib/cbs-screen/
├── action-bar.ts       # Action bar capability resolver & dynamic disable reason resolution
├── more-actions.ts     # Standard preset and extensible More Actions resolvers
├── persistence.ts      # Pure initial record/mode/form data resolution with Zod validation
├── types.ts            # Layout models, tabs, audit raw contracts, and scaffold props
├── validation.ts       # Zod error-to-tab mapper & crash-proof CSS selector DOM auto-scrolling
├── workbench-bus.ts    # BroadcastChannel cross-window bus, dock events & session draft cache
└── index.ts            # Canonical barrel export
```

---

## 🔑 Core Modules & Contracts

### 1. Action Bar Capabilities (`action-bar.ts` & `more-actions.ts`)

- **`resolveCbsActionBar`**: Pure resolver (callers pass `access` from `useCbsAccess()`) that computes `{ enabled, reason }` for all 11 action bar buttons (`CbsActionBarCapabilities`). Idle state: `amend`, `view`, `performAction`. Active state: `commit`, `validate`, `hold`, `delete`, `authorize`, `reverse`, `process`, `returnToSearch`.
- **`getDefaultMoreActions` / `resolveMoreActions`**: the "More operations" menu (Copy, Paste, Search from live / unauth / history, Show history record), extended per screen through `moreActions`.
- Automatically factors in `submitting` state, active screen mode (`IDLE`, `I`, `S`, `A`), and user entitlements via `access.getDisableReason(func)`.
- Eliminates hardcoded strings and legacy rights by binding strictly to `CbsRecordFunction` (`@/types`).

### 2. Pure Persistence Helpers (`persistence.ts`)

- **`resolveInitialRecordId(options)`**: Resolves record ID with precedence: URL query param $\rightarrow$ tab store $\rightarrow$ caller prop fallback.
- **`resolveInitialScreenMode(options)`**: Validates and resolves screen mode (`IDLE` or `CbsRecordFunction`) from URL and tab state against `CBS_SCREEN_MODES`.
- **`resolveInitialFormData(options)`**: Retrieves working session draft or applies caller baseline, safely validated against optional Zod schemas.

### 3. Workbench Bus & Cross-Window Coordination (`workbench-bus.ts`)

- **`broadcastRecordMutation(control, recordId)`**: Broadcasts mutation events across tabs and detached popup windows whenever a record is created, amended, authorized, or deleted.
- **`useRecordMutationSubscriber(callback, controlFilter?)`**: Stabilized hook (powered by `useRef`) that subscribes to mutation broadcasts, triggering background refetches when related records update in another tab.
- **`setWorkbenchDraft` / `getWorkbenchDraft` / `clearWorkbenchDraft`**: Popup draft hand-off for 150+ to 1,000+ field forms. Pop Out stages the draft with `setWorkbenchDraft(popupTabId)` before `window.open` copies session storage into the popup. The popup reads it with `getWorkbenchDraft` when it creates its tab (the persisted tab then carries it across reloads; the staged copy stays as a fallback), and the main shell calls `clearWorkbenchDraft` when the popup docks (draft and inquiry criteria).
- **`broadcastDockTab` / `CBS_SCREEN_EVENT` / `CBS_SCREEN_MESSAGE`**: Cross-window docking bridge between the main shell and detached browser windows via `BroadcastChannel`. The shell validates every dock payload with `dockTabPayloadSchema` (`@/lib/data-schemas`) before adding the tab, and ignores malformed messages.
- **`makePopupTabId(screenId)`**: Canonical popup tab identifier ensuring deterministic hydration between opener and window.
- **`getWorkbenchBus()`**: the shared `BroadcastChannel` (or `null` when the browser has none). **`clearAllWorkbenchDrafts()`** purges every staged draft when a different operator signs on.
- **`getTabInstanceId()`** / **`clearClientSession()`**: this browser tab's instance ID for the one-active-tab rule, and the sign-out cleanup of the idle timestamp and tab ownership claim.

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
│     useCbsPersistence       │   │     resolveCbsActionBar     │
│  • Pure baseline tracking   │   │  • RIDASHL capability map   │
│  • Debounced tab store sync │   │  • Mode: IDLE, I, S, A      │
│  • rebaseline() on save     │   │  • Four-Eyes status check   │
└──────────────┬──────────────┘   └──────────────┬──────────────┘
               │                                 │
               ▼                                 ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│      useGuardedAction       │   │        useCbsHotkeys        │
│  • Return, New, Search      │   │  • Esc, F2, F5–F8, F10      │
│  • Guarded when isDirty     │   │  • Minimal 1:1 screen keys  │
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
  useRecordMutationSubscriber(() => {
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

- **Action Engine (`action-bar.ts`): SEALED**  
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

```bash
pnpm verify:screen
```

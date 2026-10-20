# 🖥️ CBS Screen Architecture & Capability Engine (`@/lib/cbs-screen`)

The core presentation, scaffolding, persistence coordination, and UI capability library for the **Janata Core Banking Workbench**.

It translates raw banking entitlements (`cbs-access`) into **reactive action bar button states**, provides **Zod error-to-tab navigation**, enables **DOM auto-focusing on form validation errors**, powers the **Audit Tab**, and coordinates **cross-window popup/workbench synchronization** via the Workbench Bus.

---

## 📦 What It Contains

### 1. Screen Architecture & Persistence (`src/components/cbs-screen/hooks/`)
- **`useCbsPersistence`**: Unified screen persistence hook powered by `@/lib/cbs-record`. Employs pure baseline delta evaluation and debounced workbench store writes ($\le$ 1 write per 400ms), eliminating unneeded re-renders.
- **`useGuardedAction`**: Navigation and dirty-state guard protecting operators from accidental work loss when clicking Return, Reset, Create New, or searching records.
- **`useCbsHotkeys`**: Universal Core Banking terminal keyboard navigation:
  - `F2`: Create New Draft (guarded if dirty)
  - `F3` / `Esc`: Return to Search (guarded if dirty)
  - `F5` / `Ctrl+S`: Commit Transaction
  - `F6`: Place Draft on Hold
  - `F7`: Run Pure Field Validation (`validateValues`)
  - `F8`: Authorize or Reverse (Maker-Checker compliant)
  - `F10`: Delete Uncommitted Draft

### 2. Workbench Bus & Inter-Tab Synchronization (`workbench-bus.ts`)
- **`broadcastRecordMutation(controlName, recordId)`**: Broadcasts mutation events across tabs and detached popup windows whenever a record is created, amended, authorized, or deleted.
- **`useRecordMutationSubscriber(callback, controlFilter?)`**: Reactive hook that subscribes to mutation broadcasts, triggering background refetches when related records update in another tab.
- **`setWorkbenchDraft` / `getWorkbenchDraft`**: In-memory draft storage enabling 150+ to 1,000+ field forms to be transferred into detached popup windows without exceeding browser URL limits.
- **`broadcastDockTab` / `broadcastUndockTab`**: Cross-window docking bridge between the main shell and detached browser windows via `BroadcastChannel`.

### 3. Action Bar Capabilities (`actions.ts`)
- **`useCbsActionBar`**: Headless state engine that computes `enabled` and `reason` for all 11 action bar buttons (`Commit`, `Validate`, `Hold`, `Delete`, `Authorize`, `Reverse`, `Process`, `Amend`, `View`, `PerformAction`, `ReturnToSearch`).
- Automatically factors in submitting state, screen mode (`IDLE`, `I`, `S`, `A`), and user entitlements (`evaluateCbsAccess`).

### 4. Validation & Focus Utilities (`validation.ts`)
- **`mapZodIssuesToTabs`**: Maps raw Zod validation issues to specific screen tabs for high-density multi-tab forms.
- **`focusFormField`**: Smoothly scrolls and focuses the offending input element when an operator clicks an error in the validation checklist drawer.

### 5. Audit Adapter (`audit.ts`)
- **`DEFAULT_AUDIT_FIELDS`**: Standard Core Banking audit descriptors (`recStatus`, `recCurrNumber`, `recBranchCode`, `recInputter`, `recAuthorizer`).
- **`extractAuditValue`**: Dot-path extractor to read audit attributes from nested wire records.

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
│  broadcastRecordMutation("COLLATERAL", "COL001")       │
│     ├── Notifies open tabs via BroadcastChannel        │
│     └── Triggers useRecordMutationSubscriber refetch   │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Use

### 1. Cross-Tab Record Mutation Synchronization

Broadcast when saving in one tab, and automatically update other open tabs or inquiry screens:

```typescript
import { broadcastRecordMutation, useRecordMutationSubscriber } from "@/lib/cbs-screen";

// In your mutation hook (e.g. useFormMutations):
async function onSaveSuccess(controlCode: string, recordId: string) {
  // Broadcasts to all other tabs and detached popups
  broadcastRecordMutation(controlCode, recordId);
}

// In another tab or inquiry screen:
export function AccountInquiryScreen() {
  useRecordMutationSubscriber((event) => {
    console.log(`Record #${event.recordId} updated in ${event.controlName}. Refetching grid...`);
    refetchInquiryGrid();
  }, "ACCOUNT"); // Optional control filter
}
```

---

### 2. Auto-Focusing Validation Errors in Multi-Tab Forms

```typescript
import { focusFormField, type CbsScreenValidationError } from "@/lib/cbs-screen";

function handleErrorClick(error: CbsScreenValidationError) {
  // 1. Switch to tab if needed
  setActiveTab(error.tab);

  // 2. Auto-scroll and focus target input element
  focusFormField(error.fieldKey, error.nodeId);
}
```

---

### 3. Screen Scaffolding & Persistence

```tsx
import { CbsScreenScaffold, useCbsPersistence } from "@/components/cbs-screen";

export function ModelConfigScreen({ command, tabId }) {
  const {
    formData,
    setFormData,
    isDirty,
    rebaseline,
  } = useCbsPersistence({
    tabId,
    initialData: defaultModel,
  });

  return (
    <CbsScreenScaffold
      title="Model Configuration"
      commandCode={command}
      isDirty={isDirty}
      // F-Keys and action buttons are bound automatically
    >
      {/* Tab content */}
    </CbsScreenScaffold>
  );
}
```

---

## 🔒 Architectural State: Scalable or Sealed?

- **Action Engine (`actions.ts`): SEALED**
  The button state matrix for CBS operations (`IDLE`, `I`, `S`, `A`) is fully deterministic and complete.
- **Validation & Focus (`validation.ts`): SEALED**
  Selector resolution (`[data-field]`, `[name]`, `#id`) handles any form control automatically.
- **Workbench Bus (`workbench-bus.ts`): SEALED**
  Broadcasting channels, mutation event contracts, and draft transfers are standard across all tabs and popups.
- **Scaffold Models (`types.ts`): SCALABLE**
  If a screen requires custom tabs or supplementary action bar items, use `moreActions` or extend `CbsScreenScaffoldProps`.

---

## 🧪 Verification

Run the screen and master verification test suites:

```bash
# 1. Run master form architecture e2e verification
pnpm verify:form-flow

# 2. Run all CBS master verification suites
pnpm verify:all
```

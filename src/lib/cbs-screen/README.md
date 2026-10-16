# 🖥️ CBS Screen Architecture & Capability Engine (`@/lib/cbs-screen`)

The core presentation, scaffolding, and UI capability library for the **Janata Core Banking Workbench**.

It translates raw banking entitlements (`cbs-access`) into **reactive action bar button states**, provides **Zod error-to-tab navigation**, enables **DOM auto-focusing on form validation errors**, powers the **Audit Tab**, and coordinates **cross-window popup/workbench synchronization**.

---

## 📦 What It Contains

1. **`useCbsActionBar`** (`actions.ts`):
   - Headless state engine that computes `enabled` and `reason` for all 11 action bar buttons (`Commit`, `Validate`, `Hold`, `Delete`, `Authorize`, `Reverse`, `Process`, `Amend`, `View`, `PerformAction`, `ReturnToSearch`).
   - Automatically factors in submitting state, screen mode (`IDLE`, `I`, `S`, `A`), and user entitlements.

2. **Validation Utilities** (`validation.ts`):
   - **`mapZodIssuesToTabs`**: Maps raw Zod validation issues to specific screen tabs for high-density multi-tab forms.
   - **`focusFormField`**: Smoothly scrolls and focuses the offending input element when an operator clicks an error in the validation checklist.

3. **Audit Configuration & Data Adapter** (`audit.ts`):
   - **`DEFAULT_AUDIT_FIELDS`**: Standard Core Banking audit fields (`recStatus`, `recCurrNumber`, `recBranchCode`, `recInputter`, `recAuthorizer`).
   - **`extractAuditValue`**: Dot-path extractor to read audit attributes from nested wire records.

4. **Workbench Interop & Draft Storage** (`workbench-bus.ts`):
   - **`setWorkbenchDraft` / `getWorkbenchDraft`**: Stores 150+ to 1,000+ field drafts in shared storage without hitting browser URL length limits.
   - **`getWorkbenchBus` / `broadcastDockTab`**: `BroadcastChannel` bridge between main shell and detached popup windows.

5. **Canonical Contracts** (`types.ts`):
   - Layout contracts: `CbsScreenScaffoldProps`, `CbsScreenTab`, `CbsScreenValidationError`, and `MoreActionItem`.

---

## 🚀 How to Use

### 1. Headless Action Bar Capabilities (`useCbsActionBar`)

```tsx
import { useCbsActionBar } from "@/lib/cbs-screen";

export function ScreenHeader({ mode, recordId, onSave, onDelete }) {
  const actions = useCbsActionBar({
    mode,
    searchVal: recordId,
    onSubmit: onSave,
    onDelete: onDelete,
  });

  return (
    <div>
      <button 
        disabled={!actions.commit.enabled}
        title={actions.commit.reason}
      >
        Commit
      </button>

      <button 
        disabled={!actions.delete.enabled}
        title={actions.delete.reason}
      >
        Delete
      </button>
    </div>
  );
}
```

---

### 2. Auto-Focusing Validation Errors in Multi-Tab Forms

```typescript
import { focusFormField } from "@/lib/cbs-screen";

// When an operator clicks an error in the checklist drawer:
function handleErrorClick(error: CbsScreenValidationError) {
  // 1. Switch to tab if needed
  setActiveTab(error.tab);

  // 2. Auto-scroll and focus target input element
  focusFormField(error.fieldKey, error.nodeId);
}
```

---

### 3. Extracting Audit Metadata

```typescript
import { DEFAULT_AUDIT_FIELDS, extractAuditValue } from "@/lib/cbs-screen";

const record = {
  accountNo: "10001",
  auditData: {
    recInputter: "TELLER01",
    recStatus: "INA",
  },
};

const inputter = extractAuditValue(record, "auditData.recInputter");
// "TELLER01"
```

---

## 🔒 Architectural State: Scalable or Sealed?

- **Action Engine (`actions.ts`): SEALED**
  The button state matrix for CBS operations (`IDLE`, `I`, `S`, `A`) is fully deterministic and complete.
- **Validation & Focus (`validation.ts`): SEALED**
  Selector resolution (`[data-field]`, `[name]`, `#id`) handles any form control automatically.
- **Scaffold Models (`types.ts`): SCALABLE**
  If a screen requires custom tabs or supplementary action bar items, use `moreActions` or extend `CbsScreenScaffoldProps`.

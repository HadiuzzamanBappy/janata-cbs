---
name: cbs-form-and-record-lifecycle
description: >-
  Use this skill when building or refactoring dynamic GMC forms, form fields, record state mutations, delta calculations, or form submit and commit flows.
---

# CBS Form & Record Lifecycle Runbook

## Overview
Janata CBS renders high-density banking forms dynamically using metadata models (`GMC` schemas) sent from the Java backend. Banking forms often contain 50–100 fields with live validations. To maintain high performance and ledger integrity, follow the strict guidelines below.

---

## 1. Two-Tier Form State Architecture (Prevent Keystroke Thrashing)

### The Anti-Pattern
NEVER dispatch keystrokes or individual character inputs directly to the global Zustand `WorkbenchStore`. Doing so forces all open tabs, sidebars, and parent shells to re-render 60+ times per field input.

### The Correct Two-Tier Architecture
1. **Tier 1 (Local Component State):**
   - Inputs maintain their own local state via React local state or uncontrolled `ref` buffers.
   - Keystrokes are completely isolated to the active input element.
2. **Tier 2 (Tab Store Synchronization):**
   - The global tab store (`formData` in `WorkbenchStore`) is synchronized ONLY via:
     - A **debounced update (400ms)**, or
     - On input blur (`onBlur`), or
     - Explicit action triggers (e.g. Save Draft, Validate, Next Section).
   - Set `isDirty: true` on the active tab only when local data deviates from the initial fetched record.

---

## 2. Delta Mutation Engine (`src/lib/cbs-record`)

When saving or modifying a record, core banking backends do not accept whole-record overwrites. They require **delta payloads** (only the fields that actually changed).

### Delta Calculation Workflow
```ts
import { computeRecordDelta } from "@/lib/cbs-record";

// Compute dirty delta between pristine fetched record and current form state
const delta = computeRecordDelta({
  originalRecord: pristineData,
  currentRecord: formValues,
});

if (delta.hasChanges) {
  // Commit payload with only changed fields
  await cbsClient.commitRecord({
    application: "ACCOUNT",
    recordId: "10001",
    delta: delta.mutations,
  });
}
```

---

## 3. High-Density Form UI Guidelines

Banking operators enter massive volumes of data daily. Standard web spacing slows them down.
- **Input Heights:** All input controls (`Input`, `Select`, `Combobox`, `DatePicker`) must use compact `h-9` sizing with `text-xs`.
- **12-Column Responsive Layout:** Always utilize the 12-column grid:
  ```tsx
  <div className="grid grid-cols-12 gap-x-3 gap-y-2">
    <div className="col-span-12 sm:col-span-6 lg:col-span-4">
      {/* Field Control */}
    </div>
  </div>
  ```
- **Monospace Financial Fields:** Account numbers, SWIFT/routing numbers, interest rates, and currency values must use `font-mono`.
- **Date Formatting:** Dates must follow the CBS standard format (`YYYYMMDD` or `YYYY-MM-DD`) and format through `formatValueDate()` from `@/lib/core-utils`.

---

## 4. Verification & Testing

Whenever you modify form delta calculations, field mapping, or record lifecycle states, run:

```bash
pnpm verify:record
```

Ensure all tests pass cleanly before proceeding.

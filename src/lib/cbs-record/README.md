# 📝 CBS Record Delta Engine (`@/lib/cbs-record`)

A lightweight, zero-dependency field mutation and delta calculation engine for the **Janata Core Banking Workbench**.

It compares baseline record states against working form drafts to determine exactly which fields were touched. This ensures that wire requests only transmit changed data, preventing accidental overwrites and keeping audit logs clean.

---

## 📦 What It Contains

1. **`computeDelta(original, current, ignoredKeys?)`**: Pure function that deep-compares baseline and draft records.
2. **`CbsDeltaPatch<T>`**: Standard TypeScript contract representing the delta:
   - `modifiedFields`: Key-value map of updated values to send to backend.
   - `originalFields`: Key-value map of baseline values before editing.
   - `dirtyKeys`: List of field names that changed.
   - `isDirty`: Boolean flag indicating if any changes exist.

---

## 🚀 How to Use

### 1. In Form Submission & Wire Payloads

Used in form action hooks (such as `useFormActions`) to construct minimal mutation payloads:

```typescript
import { computeDelta } from "@/lib/cbs-record";

const initialData = {
  accountNo: "AC10000001",
  title: "Janata General A/C",
  balance: 50000,
  branchCode: "JB0001",
};

const workingDraft = {
  accountNo: "AC10000001",
  title: "Janata Corporate A/C", // modified
  balance: 50000,
  branchCode: "JB0001",
};

const patch = computeDelta(initialData, workingDraft);

console.log(patch.isDirty); 
// true

console.log(patch.dirtyKeys); 
// ["title"]

console.log(patch.modifiedFields); 
// { title: "Janata Corporate A/C" }
```

---

### 2. Ignoring Audit or Read-Only Metadata

You can pass an array of keys to exclude from dirty calculations:

```typescript
const patch = computeDelta(baseline, draft, [
  "lastUpdatedBy",
  "lastUpdatedTimestamp",
  "version",
]);
```

---

## 🛡️ Edge Cases Handled

1. **Deep Equality for Nested Objects & Arrays:**
   Handles nested structures (e.g. `signatories: ["EMP001", "EMP002"]` or nested address objects) without false-positive dirty flags.
2. **Null & Undefined Safety:**
   `computeDelta(null, newDraft)` safely computes deltas for newly created records without runtime exceptions.
3. **Pristine State Guarantee:**
   If cloned objects have identical keys and values, `isDirty` is strictly `false` and `dirtyKeys` is empty.

---

## 🧪 Verification

Run the dedicated test suite:
```bash
pnpm verify:record
```

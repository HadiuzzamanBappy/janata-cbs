# 📝 CBS Record Baseline & Delta Engine (`@/lib/cbs-record`)

A lightweight, zero-dependency record lifecycle, baseline tracking, and delta calculation engine for the **Janata Core Banking Workbench**.

It manages immutable baseline snapshots, evaluates whether working drafts are dirty relative to their loaded state, and isolates exact field modifications for wire mutations. This ensures that update requests (`PUT` / Amend) only transmit changed data, preventing accidental overwrites, keeping audit trails clean, and powering workbench navigation guards.

---

## 📦 What It Contains

The library provides four core APIs across two modules:

### 1. Baseline Management (`baseline.ts`)

- **`createBaseline(record, ignoredKeys?)`**: Creates a frozen, deep-cloned immutable snapshot (`RecordBaseline<T>`) representing the pristine record as fetched from the backend.
- **`evaluateDirty(baselineHolder, current, additionalIgnoredKeys?)`**: Pure evaluator that checks whether current working values differ from the established baseline snapshot. Returns a full `CbsDeltaPatch`.
- **`rebaseline(current, ignoredKeys?)`**: Resets the baseline snapshot to the current working record following a successful commit or re-fetch, resetting the dirty state to clean (`isDirty: false`).
- **`RecordBaseline<T>`**: Immutable container interface holding the frozen baseline object and ignored field list.

### 2. Delta Engine (`delta-engine.ts`)

- **`computeDelta(original, current, ignoredKeys?)`**: Pure deep-comparison function that isolates modified fields between any two record states.
- **`CbsDeltaPatch<T>`**: Standard TypeScript contract representing the calculated patch:
  - `modifiedFields`: Key-value dictionary containing only touched/updated properties.
  - `originalFields`: Key-value dictionary containing baseline values before editing.
  - `dirtyKeys`: Array of field names that changed.
  - `isDirty`: Boolean flag indicating if any changes exist.

---

## 🏛️ How It Works in the Screen Lifecycle

```
┌────────────────────────────────────────────────────────┐
│                   1. Record Fetched                    │
│   initialValues loaded from backend or GNI allocation  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│             createBaseline(initialValues)              │
│   Snapshot frozen in memory; tab is clean (isDirty: F)  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   2. Operator Edits                    │
│   evaluateDirty(baseline, currentValues)               │
│   ├── If currentValues === baseline -> isDirty: false  │
│   └── If any field changed          -> isDirty: true   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│            3. Navigation & Tab Guarding                │
│   useGuardedAction({ isDirty })                        │
│   • Return to Search, Reset, or Tab Close triggers     │
│     confirmation dialog if dirty; passes if clean      │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   4. Wire Submission                   │
│   • New Record: Sends full payload                     │
│   • Amend Record: computeDelta() sends modifiedFields  │
│   • On Success: rebaseline(currentValues) clears dirty │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 How to Use

### 1. Managing Baseline State in Screens & Hooks

Used in screen persistence layers (`useCbsPersistence`, `useFormState`) to track dirty state without causing excessive re-renders:

```typescript
import { createBaseline, evaluateDirty, rebaseline } from "@/lib/cbs-record";

// 1. Establish baseline when record data loads
const record = { accountNo: "AC1001", title: "Janata Savings", balance: 50000 };
let baseline = createBaseline(record, ["lastUpdated", "version"]);

// 2. Evaluate dirty status as user types
const draft = { ...record, title: "Janata Premium Savings" };
const dirtyCheck = evaluateDirty(baseline, draft);

console.log(dirtyCheck.isDirty); // true
console.log(dirtyCheck.dirtyKeys); // ["title"]
console.log(dirtyCheck.modifiedFields); // { title: "Janata Premium Savings" }

// 3. User reverts the change
const revertedDraft = { ...record, title: "Janata Savings" };
console.log(evaluateDirty(baseline, revertedDraft).isDirty); // false (automatically clean)

// 4. Following a successful save, re-baseline to the committed state
baseline = rebaseline(draft, ["lastUpdated", "version"]);
console.log(evaluateDirty(baseline, draft).isDirty); // false
```

---

### 2. Constructing Minimal Amend Wire Payloads

Used in mutation hooks (`useFormMutations`, `useFcActions`) to construct minimal delta updates:

```typescript
import { computeDelta } from "@/lib/cbs-record";

const baselineRecord = {
  id: "CUST-9001",
  name: "Rahim Uddin",
  email: "rahim@example.com",
  branchCode: "BR01",
};

const workingDraft = {
  id: "CUST-9001",
  name: "Rahim Uddin",
  email: "rahim.new@example.com", // modified
  branchCode: "BR01",
};

const patch = computeDelta(baselineRecord, workingDraft);

if (patch.isDirty) {
  // Transmit only the modified fields + record identifier
  const wirePayload = {
    recordId: workingDraft.id,
    ...patch.modifiedFields,
  };
  // Wire payload: { recordId: "CUST-9001", email: "rahim.new@example.com" }
}
```

---

### 3. Ignoring Volatile & Audit Metadata

You can exclude specific keys (such as timestamps, version numbers, or internal UI state) from dirty checks:

```typescript
const patch = evaluateDirty(baseline, workingDraft, [
  "lastUpdatedTimestamp",
  "auditData",
  "authLevel",
]);
```

---

## 🛡️ Edge Cases Handled

1. **Deep Equality for Nested Objects & Arrays:**
   Correctly compares nested arrays and complex structures (e.g. `associates: ["HIS", "UNA"]` or parameter objects) without false-positive dirty triggers.
2. **Pristine State Recovery:**
   If a user modifies a field and then manually reverts it to its original value, `evaluateDirty` automatically resets `isDirty` to `false` without requiring a reset button.
3. **Null & Undefined Safety:**
   `createBaseline(null)` and `computeDelta(null, draft)` safely process empty drafts and new uncommitted transactions without throwing runtime `TypeError` exceptions.
4. **Immutable Snapshots:**
   `createBaseline` performs a deep copy and freezes the baseline object via `Object.freeze`, preventing accidental mutations from reference sharing.

---

## 🧪 Verification

Run the test suites:

```bash
# 1. Run isolated record & baseline unit tests
pnpm verify:record

# 2. Run master architecture end-to-end integration tests
pnpm verify:form-flow

# 3. Run all CBS master verification suites
pnpm verify:all
```

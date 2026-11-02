# 📝 CBS Record Baseline & Delta Engine (`@/lib/cbs-record`)

A pure, high-performance baseline snapshot and delta calculation engine for the **Janata Core Banking Workbench**.

It powers the Dual-Tier Form State architecture by computing minimal mutation payloads (`modifiedFields`) during record amendments, maintaining deep dirty tracking, detecting reversible edits, and rendering line-by-line JSON inspection diffs.

---

## 📦 What It Contains

The library provides 4 focused modules with zero React UI dependencies:

1. **`createBaseline(record, ignoredKeys?)`**:
   Creates an immutable, deep-cloned snapshot (`RecordBaseline<T>`) using native `structuredClone`.

2. **`evaluateDirty(baselineHolder, current, additionalIgnoredKeys?)`**:
   Evaluates whether working draft values differ from the established baseline snapshot. Returns a full `CbsDeltaPatch`.

3. **`rebaseline(current, ignoredKeys?)`**:
   Resets the baseline snapshot to the current working record following a successful commit or re-fetch (`isDirty: false`).

4. **`computeDelta(original, current, ignoredKeys?)`**:
   Pure deep-comparison function that isolates modified fields between any two record states.

5. **`computeLineDiff(oldText, newText)`**:
   Pure Myers line-diff algorithm that computes shortest edit sequences for visual git-style diffs in audit and inspection tabs.

---

## 🏛️ Architectural Lifecycle

```
┌─────────────────────────────────┐
│     Backend Database Record     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│  createBaseline(initialRecord)  │  <── Immutable Snapshot
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│   evaluateDirty(base, draft)    │  <── Keystroke Dirty Tracking
└────────────────┬────────────────┘      (Clean if user reverts edit)
                 │
                 ▼
┌─────────────────────────────────┐
│    computeDelta(base, draft)    │  <── Commit Payload Generator
│     Produces: modifiedFields    │      (Sends only modified fields)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│    rebaseline(currentDraft)     │  <── Post-Commit Reset
└─────────────────────────────────┘      (Resets isDirty to false)
```

---

## 🚀 How to Use

### 1. Snapshotting and Dirty Evaluation

```typescript
import { createBaseline, evaluateDirty, rebaseline } from "@/lib/cbs-record";

// Create snapshot ignoring metadata keys
let baseline = createBaseline(accountRecord, ["lastUpdated", "auditData"]);

// Evaluate dirty state
const patch = evaluateDirty(baseline, workingDraft);
console.log(patch.isDirty); // true if user edited any monitored field
console.log(patch.dirtyKeys); // ["accountTitle"]
console.log(patch.modifiedFields); // { accountTitle: "New Title" }

// Reverting restores clean state automatically
const revertedDraft = { ...workingDraft, accountTitle: "Original Title" };
console.log(evaluateDirty(baseline, revertedDraft).isDirty); // false

// Post-save reset
baseline = rebaseline(workingDraft, ["lastUpdated", "auditData"]);
console.log(evaluateDirty(baseline, workingDraft).isDirty); // false
```

---

### 2. Computing Wire Delta Payloads

```typescript
import { computeDelta } from "@/lib/cbs-record";

const delta = computeDelta(initialValues, formValues, ["auditData"]);

if (delta.isDirty) {
  // Transmit only changed fields
  await cbs.send(cbs.model("ACCOUNT").save("AC10001", delta.modifiedFields));
}
```

---

### 3. Computing Line Diffs for Inspection

```typescript
import { computeLineDiff } from "@/lib/cbs-record";

const diff = computeLineDiff(baselineJsonString, currentJsonString);
console.log(diff.additions, diff.deletions, diff.items);
```

---

## 🧪 Verification

Run the dedicated test suite:

```bash
# Run isolated Record Delta Engine unit tests
pnpm verify:record

# Run all CBS master verification suites
pnpm verify:all
```

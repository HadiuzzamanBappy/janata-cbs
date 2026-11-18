# 📝 CBS Record Baseline & Delta Engine (`@/lib/cbs-record`)

A pure, high-performance baseline snapshot and delta calculation engine for the **Janata Core Banking Workbench**.

It powers the Dual-Tier Form State architecture by computing minimal mutation payloads (`modifiedFields`) during record amendments, maintaining deep dirty tracking, detecting reversible edits, and rendering line-by-line JSON inspection diffs.

---

## 📦 What It Contains

Five pure functions in three files (`baseline.ts`, `delta-engine.ts`, `line-diff.ts`), with the `CbsDeltaPatch` result type (`modifiedFields`, `originalFields`, `dirtyKeys`, `isDirty`) in `types.ts`. No React dependencies:

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
// patch.isDirty === true, patch.dirtyKeys === ["accountTitle"],
// patch.modifiedFields === { accountTitle: "New Title" }

// Reverting an edit makes the record clean again
const revertedDraft = { ...workingDraft, accountTitle: "Original Title" };
evaluateDirty(baseline, revertedDraft).isDirty; // false

// After a successful save, the saved values become the new baseline
baseline = rebaseline(workingDraft, ["lastUpdated", "auditData"]);
evaluateDirty(baseline, workingDraft).isDirty; // false
```

---

### 2. Computing Wire Delta Payloads

This is how `useFormMutations` (`src/features/operations/forms/hooks/use-form-mutations.ts`) builds a save:

```typescript
import { computeDelta } from "@/lib/cbs-record";

// Input mode on an existing record: send only the changed fields
const delta =
  screenMode === CbsRecordFunction.INPUT && Object.keys(baseSnapshot).length > 0
    ? computeDelta(baseSnapshot, values).modifiedFields
    : values;
const commitData = Object.keys(delta).length > 0 ? delta : values; // nothing changed: send everything

await sendMutation(cbs.model(modelCode).save(commitData, { recordId: targetId }));
```

A new record, or a save where nothing changed, sends the full values. Mutations always go through `sendMutation()` from `useIdempotentSend()` (see `@/lib/cbs-client`).

---

### 3. Computing Line Diffs for Inspection

```typescript
import { computeLineDiff } from "@/lib/cbs-record";

const diff = computeLineDiff(baselineJsonString, currentJsonString);
// diff: { additions, deletions, items: LineDiffItem[] }
```

---

## 🧪 Verification

Run the dedicated test suite:

```bash
pnpm verify:record
```

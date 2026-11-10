# 🔐 CBS Access Control & Capabilities (`@/lib/cbs-access`)

A deterministic, headless banking entitlement and compliance evaluation library for the **Janata Core Banking Workbench**.

It enforces standard Core Banking **RIDASHL** function entitlements, record lifecycle integrity, and the **Four-Eyes Principle (Maker-Checker)** across all screens, action buttons, command validations, and server API boundaries.

> [!NOTE]
> `@/lib/cbs-access` is a **pure TypeScript library** (zero React/Zustand imports). It runs identically in server route handlers, verification scripts, and client adapters.
> The reactive React hook for UI components lives in [`@/hooks/use-cbs-access`](file:///d:/Work/React/cbs/janata-cbs/src/hooks/use-cbs-access.ts).

---

## 📦 What It Contains

```text
src/lib/cbs-access/
├── accessibility.ts   # Server-side capability gate (verifyUserRecordAccess) & rights helper (hasAccessibilityRight)
├── record-guard.ts    # Pure capability evaluator (evaluateCbsAccess) combining status, mode, and Four-Eyes
├── types.ts           # Unified CbsAccessContext and CbsAccessResult interfaces
├── README.md          # Domain documentation
└── index.ts           # Barrel export
```

1. **`accessibility.ts`**:
   - `hasAccessibilityRight(granted, required)`: Checks if a given function code exists in the user's rights array.
   - `verifyUserRecordAccess(user, recordFunction)`: Server-side capability gate for API route handlers (e.g. `/api/proxy`). Validates that the active user possesses the required capability before executing controlled actions (`I`, `A`, `D`, `R`, `H`).
2. **`record-guard.ts`**:
   - `evaluateCbsAccess(context)`: Single, pure source of truth for resolving rights and evaluating capabilities against active record status (`INA`, `AU`, `NEW`, `HLD`), screen mode (`IDLE`, `I`, `S`, etc.), and Four-Eyes Maker-Checker rules.
3. **`types.ts`**:
   - `CbsAccessContext`: Single unified evaluation input interface.
   - `CbsAccessResult`: Computed boolean capabilities, read-only flags, and tooltip explanation generators.

---

## 🏛️ RIDASHL Entitlement Standard

Every core banking user profile is assigned a subset of standard function codes:

| Code    | Name                    | Action Capability                    | State & Lifecycle Invariants                                                      |
| :------ | :---------------------- | :----------------------------------- | :-------------------------------------------------------------------------------- |
| **`R`** | **Reverse**             | Reverse a live committed transaction | Record status must be authorized (`AU`). Blocked in `IDLE` mode.                  |
| **`I`** | **Input / Maker**       | Create records and edit drafts       | Allowed on uncommitted / editable drafts. If missing, forces `isReadOnly = true`. |
| **`D`** | **Delete**              | Delete uncommitted draft             | Only permitted on uncommitted drafts (`INA` or `NEW`); strictly blocked on `AU`.  |
| **`A`** | **Authorize / Checker** | Authorize pending transaction        | Pending (`INA`) only; **Strictly blocked if Maker === Checker (Four-Eyes)**.      |
| **`S`** | **See**                 | View and inspect record details      | Read-only inspection; non-mutating.                                               |
| **`H`** | **History / Hold**      | Place draft on hold                  | Allowed on uncommitted/pending drafts (`cleanStatus !== "AU"`).                   |
| **`L`** | **List**                | Query directories & inquiry tables   | Read-only listing and searching (`canList`).                                      |

---

## 🛡️ Core Banking Invariants Enforced

### 1. Four-Eyes Principle (Maker-Checker)

- Evaluated as: `userId && recordInputter && userId.trim().toUpperCase() === recordInputter.trim().toUpperCase()`.
- When violated:
  - `isFourEyesViolation = true`
  - `canAuthorize = false`
  - `getDisableReason("A")` returns:
    > _"Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction."_
### 2. Operational Screen Modes & Read-Only Locks

- In **`IDLE`** mode: Action buttons (`canDelete`, `canHold`, `canAuthorize`, `canReverse`) are disabled until an active record is loaded.
- Form read-only lock (`isReadOnly = true`) is automatically enforced when:
  - Active mode is View or Non-Input: `"S"`, `"H"`, `"A"`, `"D"`, `"R"`.
  - Or the user profile lacks the `"I"` (Input) capability right.

### 3. State Transition Guards

- **Live Records (`AU`)**: Cannot be deleted (`canDelete = false`); must use Reverse (`R`).
- **Pending Records (`INA`)**: Cannot be reversed (`canReverse = false`); must be authorized or held.

---

## 🚀 How to Use

### 1. Server-Side Route Guard (`verifyUserRecordAccess`)

Used at server boundaries such as `/api/proxy/route.ts` to reject unauthorized mutation attempts before dispatch:

```typescript
import { verifyUserRecordAccess } from "@/lib/cbs-access";

// Inside Next.js API Route Handler:
const accessViolation = verifyUserRecordAccess(currUser, body.recordFunction);

if (accessViolation) {
  return apiFail(accessViolation.message, 403, [
    `User ${currUser.userId} lacks capability '${accessViolation.funcCode}'`,
  ]);
}
```

### 2. Pure Evaluation in Services or Tests (`evaluateCbsAccess`)

Used for offline evaluation, unit testing, or CLI validation scripts:

```typescript
import { evaluateCbsAccess } from "@/lib/cbs-access";

const access = evaluateCbsAccess({
  userId: "CHECKER01",
  recordInputter: "MAKER01", // Different user -> Four-Eyes passes
  recordStatus: "INA", // Pending approval
  mode: "I",
  grantedRights: ["R", "I", "D", "A", "S", "H", "L"],
});

console.log(access.canAuthorize); // true
console.log(access.isFourEyesViolation); // false
console.log(access.canReverse); // false (record must be 'AU' to reverse)
```

### 3. In React Components via Hook (`useCbsAccess` from `@/hooks`)

Inside screen scaffolds, headers, and action bars:

```tsx
import { useCbsAccess } from "@/hooks";

export function ScreenActionBar({ currentRecord, screenMode }) {
  const {
    canInput,
    canAuthorize,
    canDelete,
    canReverse,
    isReadOnly,
    isFourEyesViolation,
    getDisableReason,
  } = useCbsAccess({
    recordStatus: currentRecord?.recStatus, // "INA", "AU", "NEW"
    recordInputter: currentRecord?.recInputter, // Maker user ID
    mode: screenMode, // "I", "S", "A", etc.
  });

  return (
    <div className="flex items-center gap-2">
      <button disabled={!canInput || isReadOnly} title={getDisableReason("I") ?? undefined}>
        Save Draft
      </button>

      <button disabled={!canAuthorize} title={getDisableReason("A") ?? undefined}>
        Authorize
      </button>

      <button disabled={!canDelete} title={getDisableReason("D") ?? undefined}>
        Delete
      </button>

      <button disabled={!canReverse} title={getDisableReason("R") ?? undefined}>
        Reverse
      </button>

      {isFourEyesViolation && (
        <span className="text-xs text-amber-600">Four-Eyes: Maker cannot authorize own record</span>
      )}
    </div>
  );
}
```

---

## 🧪 Verification

Validate all domain security and Four-Eyes capability invariants:

```bash
pnpm verify:access
```

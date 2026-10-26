# 🔐 CBS Access Control & Capabilities (`@/lib/cbs-access`)

A deterministic, banking-grade entitlement and compliance evaluation library for the **Janata Core Banking Workbench**.

It enforces standard Core Banking **RIDASHL** function entitlements, record lifecycle integrity, and the **Four-Eyes Principle (Maker-Checker)** across all screens and actions.

---

## 📦 What It Contains

The library consists of three core components:

1. **`parseAccessibilityRights`**: Normalizes and parses raw user accessibility tokens (e.g. `"RIDASHL"`, `"FULL"`, or `["R", "I", "D", "A", "S", "H", "L"]`).
2. **`evaluateCbsAccess`**: Pure, deterministic evaluator combining user rights, record lifecycle status (`INA`, `AU`, `NEW`), and Four-Eyes checks to compute UI capabilities.
3. **`useCbsAccess`**: Reactive React hook that bridges session state to the access evaluator.

---

## 🏛️ RIDASHL Entitlement Standard

Every core banking user profile is assigned a subset of standard function codes:

| Code    | Name                    | Action Capability                        | State Dependency                                       |
| :------ | :---------------------- | :--------------------------------------- | :----------------------------------------------------- |
| **`R`** | **Reverse**             | Reverse an already committed transaction | Record must be authorized (`AU`)                       |
| **`I`** | **Input / Maker**       | Create new records and edit drafts       | Allowed on uncommitted / editable drafts               |
| **`D`** | **Delete**              | Delete uncommitted draft                 | Only on drafts (`INA` or `NEW`); blocked on `AU`       |
| **`A`** | **Authorize / Checker** | Authorize pending transaction            | Pending (`INA`) only; **Blocked if Maker === Checker** |
| **`S`** | **See**                 | View and inspect record details          | Read-only access                                       |
| **`H`** | **History / Hold**      | Place draft on hold or view history      | Uncommitted drafts                                     |
| **`L`** | **List**                | Query directories and inquiry tables     | Read-only listing                                      |

---

## 🚀 How to Use

### 1. In React Components via Hook (`useCbsAccess`)

Use this inside screen headers, action bars, or scaffolds to dynamically enable/disable buttons, show read-only locks, or display tooltip warnings:

```tsx
import { useCbsAccess } from "@/lib/cbs-access";

export function CustomerScreen({ customerRecord }) {
  const {
    canInput,
    canAuthorize,
    canDelete,
    canReverse,
    isReadOnly,
    isFourEyesViolation,
    getDisableReason,
  } = useCbsAccess({
    recordStatus: customerRecord?.status, // e.g. "INA", "AU"
    recordInputter: customerRecord?.inputterId, // Maker user ID
    mode: "I",
  });

  return (
    <div>
      {/* Commit / Save */}
      <button disabled={!canInput || isReadOnly}>Save</button>

      {/* Authorize Button (Protected by Four-Eyes) */}
      <button disabled={!canAuthorize} title={getDisableReason("A") ?? undefined}>
        Authorize
      </button>

      {/* Four-Eyes Warning Badge */}
      {isFourEyesViolation && (
        <span className="text-amber-600">Four-Eyes: Maker cannot authorize this record</span>
      )}
    </div>
  );
}
```

---

### 2. Pure Evaluation in Services or Tests (`evaluateCbsAccess`)

For offline evaluation, unit tests, or server-side checks:

```typescript
import { evaluateCbsAccess, parseAccessibilityRights } from "@/lib/cbs-access";

const rights = parseAccessibilityRights("RIDASHL");

const access = evaluateCbsAccess({
  userId: "OFFICER01",
  recordInputter: "TELLER02", // Different user -> Four-Eyes passes
  recordStatus: "INA", // Pending authorization
  grantedRights: rights,
});

console.log(access.canAuthorize); // true
console.log(access.canDelete); // true
console.log(access.canReverse); // false (must be 'AU' to reverse)
```

---

## 🛡️ Banking Compliance Handled

1. **Four-Eyes Principle (Maker-Checker):**
   - Automatically detects if the active user created the record:
     `userId.trim() === recordInputter.trim()`.
   - If true, `canAuthorize` is strictly `false`, and `getDisableReason("A")` returns:
     > _"Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction."_
2. **Lifecycle State Transition Safety:**
   - Live authorized records (`AU`) **cannot** be deleted; operators are directed to use Reverse (`R`).
   - Non-pending records cannot be authorized.
3. **Screen Read-Only Lock:**
   - Automatically marks `isReadOnly: true` if the mode is View/History (`"S"`, `"H"`), or if the user lacks the `"I"` capability.

---

## 🛠️ Adding a Function Right

To add a new entitlement code (e.g. extending `RIDASHL`):
1. Add the code to `CbsRecordFunction` in `src/types/cbs.ts`.
2. Update `evaluateCbsAccess` in `record-guard.ts` to compute the capability flag (`canX`).
3. Add the return flag to `CbsAccessResult` in `types.ts`.

## 🧪 Verification

```bash
pnpm verify:access
```

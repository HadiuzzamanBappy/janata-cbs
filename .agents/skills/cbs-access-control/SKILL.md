---

name: cbs-access-control
description: Use this skill when implementing or modifying screens, action bars, buttons, or workflows that require banking entitlements (RIDASHL), Four-Eyes (Maker-Checker) authorization checks, or clearance level restrictions.
---

# CBS Access Control & Four-Eyes Principle Runbook

## Overview

Janata CBS uses a strict core-banking access control engine based on the **`RIDASHL`** capability profile and the **Four-Eyes (Maker-Checker)** security boundary. This runbook details how to check permissions, enforce dual-control rules, and avoid authorization violations.

---

## 1. The RIDASHL Capability Model

User rights are defined by a 7-character string where each character represents a distinct transactional function:

|  Code   | Function  | Meaning in Banking Context                                 |
| :-----: | :-------- | :--------------------------------------------------------- |
| **`R`** | Reverse   | Reversing an authorized, live transaction (`AU`)           |
| **`I`** | Input     | Creating a new record or modifying a pending draft (Maker) |
| **`D`** | Delete    | Deleting an unauthorized pending record (`INA`)            |
| **`A`** | Authorize | Approving a pending record into the live ledger (Checker)  |
| **`S`** | See       | Viewing full record data (Read-Only)                       |
| **`H`** | Hold      | Placing a pending transaction on temporary hold            |
| **`L`** | List      | Querying directory catalogs and summary lists (GRL)        |

### Checking Permissions in React Components

Use the domain hook `useCbsAccess` from `@/lib/cbs-access`:

```tsx
import { useCbsAccess } from "@/lib/cbs-access";

export function TransactionActionBar({ record }: { record: CbsRecord }) {
  const { canSee, canInput, canAuthorize, canDelete, canReverse, hasFunctionRight } =
    useCbsAccess(record);

  return (
    <div className="flex items-center gap-2">
      {canInput && <Button>Edit Record</Button>}
      {canAuthorize && <Button>Authorize</Button>}
      {canDelete && <Button variant="destructive">Delete</Button>}
    </div>
  );
}
```

---

## 2. Four-Eyes Principle (Maker-Checker Enforcement)

### The Invariant

> **A teller who inputted or last modified a transaction (Maker) can NEVER authorize the same transaction (Checker).**

### Implementation Rules

1. Compare the active user's identity (`session.user.tellerId` or `session.user.username`) with `record.inputter`:
   - If `record.inputter === activeUser.tellerId`, the user is the **Maker**.
   - `canAuthorize` MUST evaluate to `false`.
2. Do **NOT** hide the Authorize button completely unless the user lacks the `'A'` function right. If the user has `'A'` but is blocked by the Four-Eyes rule:
   - Render the button as **disabled** (`disabled={true}`).
   - Wrap it in a `<Tooltip>` explaining the exact restriction:
     `"Four-Eyes restriction: You cannot authorize a record inputted by your own user ID."`

---

## 3. Record Status & Function Matrix

Functions are strictly gated by the record's current lifecycle status:

- **Pending / Unauthorized (`INA`):**
  - Editable via `I`
  - Deletable via `D`
  - Authorizable via `A` (if not the Maker)
  - Holdable via `H`
- **Live / Authorized (`AU`):**
  - Cannot be edited directly (`I` blocked)
  - Cannot be deleted (`D` blocked; must be reversed instead)
  - Cannot be authorized again (`A` blocked)
  - Reversible via `R`
- **Reversed (`REV`):**
  - Read-only historical record (`S` only)

---

## 4. Verification & Testing

Whenever you modify any permission-related logic, button rendering, or access rules, you MUST run the dedicated test suite:

```bash
pnpm verify:access
```

Ensure all 28 access control and RIDASHL test cases pass with 100% success before committing.

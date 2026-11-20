# 🔐 CBS Access Control & Capabilities (`@/lib/cbs-access`)

Layer L2: the pure rules that decide what a user may do with a record, from their **RIDASHL** rights, the record's status, the screen mode and the **Four-Eyes** (maker-checker) principle. It has no React and no store, so the same code runs in the UI, in `/api/proxy` and in `scripts/verify`.

The React wrapper is `useCbsAccess()` in `src/hooks/use-cbs-access.ts`. It fills the user from `useSessionStore` and memoizes the result.

---

## 📦 Files

| File               | Exports                                                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `record-guard.ts`  | `evaluateCbsAccess(context)`: the single evaluator. `isRecordEditable(mode)`: a designer field is editable only in Input (`I`) mode.                                                                              |
| `accessibility.ts` | `verifyUserRecordAccess(user, recordFunction)`: the server-side rights gate. `verifyZeroAuthAccess(user, requestType, authLevel)`: a level-0 mutation also needs `A`. `hasAccessibilityRight(granted, required)`. |
| `types.ts`         | `CbsAccessContext` (input) and `CbsAccessResult` (output)                                                                                                                                                         |

---

## 🏛️ Rules evaluated by `evaluateCbsAccess()`

| Capability     | Needs right    | And the record must be                                                 | Never in `IDLE` |
| -------------- | -------------- | ---------------------------------------------------------------------- | --------------- |
| `canSee`       | `S`            | —                                                                      |                 |
| `canInput`     | `I`            | —                                                                      |                 |
| `canDelete`    | `D`            | `UA`, `NEW` or no status yet (an `AU` record is reversed, not deleted) | ✓               |
| `canHold`      | `H` **or** `I` | anything except `AU`                                                   | ✓               |
| `canAuthorize` | `A`            | `UA`, **and** the user is not the record's inputter                    | ✓               |
| `canReverse`   | `R`            | `AU`                                                                   | ✓               |
| `canList`      | `L`            | —                                                                      |                 |

Flags:

- **`isFourEyesViolation`**: the user ID equals the record's inputter (compared trimmed and case-insensitive). It forces `canAuthorize = false`.
- **`isReadOnly`**: the form is locked in modes `S`, `H`, `A`, `D` and `R`, and whenever the user lacks `I`.
- **`isViewOnly`**: modes `S` and `A` only. The action bar disables Commit, Validate and Hold there.

`getDisableReason(fn)` returns the sentence to show when an action is disabled, or `null` if it's enabled. For Four-Eyes it returns:

> _"Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction."_

---

## 🛡️ What the server checks

`/api/proxy` calls `verifyUserRecordAccess(currUser, body.recordFunction)` before every dispatch. For the controlled functions (`CBS_CONTROLLED_FUNCTIONS`: `I`, `A`, `D`, `R`, `H`), it rejects the request with **403** if the session user lacks that right. Other functions pass through.

It then calls `verifyZeroAuthAccess(currUser, body.requestType, body.authLevel)`. A mutation sent at `authLevel: 0` (a zero-auth, trailing-comma screen) authorizes the record in the same step, so the user must also hold `A`, or the request gets **403**. The command gateway applies the same rule before a comma screen opens (`validateSecurityPermissions`), so the operator is told at once rather than at save.

> [!IMPORTANT]
> The server gate checks **rights only**. Four-Eyes and record-status rules are enforced in the UI by `evaluateCbsAccess()`. The proxy does not load the record, so it can't compare the user with the inputter. Server-side maker-checker enforcement depends on the Java core.

---

## 🚀 Usage

In components, through the hook (this is what `src/lib/cbs-screen/action-bar.ts` and the screen header consume):

```tsx
import { useCbsAccess } from "@/hooks";
import { CbsRecordFunction } from "@/types";

const access = useCbsAccess({ recordStatus, recordInputter, mode });

// ActionBtn (src/components/cbs-screen/header/action-btn.tsx) shows `reason` in a Tooltip when disabled
<ActionBtn
  enabled={access.canAuthorize}
  reason={access.getDisableReason(CbsRecordFunction.AUTHORIZE) ?? undefined}
  defaultTooltip="Authorize Record (✓✓)"
  onClick={onAuthorize}
>
  <CheckCheck className="size-3.5" />
</ActionBtn>;
```

Without React (route handlers, verification scripts):

```typescript
import { evaluateCbsAccess } from "@/lib/cbs-access";
import { CbsRecordFunction, CbsRecordStatus } from "@/types";

const access = evaluateCbsAccess({
  userId: "CHECKER01",
  recordInputter: "MAKER01",
  recordStatus: CbsRecordStatus.UA,
  mode: CbsRecordFunction.AUTHORIZE,
  grantedRights: Object.values(CbsRecordFunction),
});
// access.canAuthorize === true, access.isFourEyesViolation === false
```

---

## 🧪 Verification

```bash
pnpm verify:access
```

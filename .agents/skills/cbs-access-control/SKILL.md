---

name: cbs-access-control
description: Use this skill when implementing or modifying screens, action bars, buttons, or workflows that require banking entitlements (RIDASHL), Four-Eyes (Maker-Checker) authorization checks, or clearance level restrictions.
---

# CBS Access Control & Four-Eyes Runbook

Every decision about what a user may do with a record comes from **one** evaluator: `evaluateCbsAccess()` in `@/lib/cbs-access`. Components read it through `useCbsAccess()` in `@/hooks`. Full rule table: `src/lib/cbs-access/README.md`. If a doc and `record-guard.ts` ever disagree, the code wins and the doc is fixed.

---

## 1. RIDASHL

| Code | Label (`CBS_FUNCTION_DEFINITIONS` in `@/types`) | Allowed when                                       |
| :--: | ----------------------------------------------- | -------------------------------------------------- |
| `R`  | Reverse                                         | record is `AU`                                     |
| `I`  | Insert / Update                                 | always (the form is read-only without it)          |
| `D`  | Delete                                          | record is `UA`, `NEW` or has no status yet         |
| `A`  | Authorize                                       | record is `UA` **and** the user isn't its inputter |
| `S`  | See / View                                      | always                                             |
| `H`  | Hold / Park                                     | record isn't `AU` (needs `H` **or** `I`)           |
| `L`  | List / Directory                                | always                                             |

`D`, `H`, `A` and `R` are never available in `IDLE` mode. The user's rights are `user.accessibility` (an array of codes) from the session.

---

## 2. Using it in a component

```tsx
import { useCbsAccess } from "@/hooks";
import { CbsRecordFunction } from "@/types";

const access = useCbsAccess({
  recordStatus: record?.auditData?.recStatus, // CbsRecordStatus.UA, AU, …
  recordInputter: record?.auditData?.recInputter,
  mode, // CbsScreenMode
});

<ActionBtn
  enabled={access.canAuthorize}
  reason={access.getDisableReason(CbsRecordFunction.AUTHORIZE) ?? undefined}
  defaultTooltip="Authorize Record (✓✓)"
  onClick={onAuthorize}
>
  <CheckCheck className="size-3.5" />
</ActionBtn>;
```

- On a normal screen you don't call the hook yourself: `CbsScreenScaffold` evaluates access from its `auditContext` prop (`recStatus`, `recInputter`) and the current `mode`. Pass the record's `auditData` as `auditContext`.
- The user comes from the session store automatically; pass `user` only in tests or server code.
- Screen header buttons get their state from `resolveCbsActionBar()` in `@/lib/cbs-screen`, which already consumes `access`. Use it instead of re-deriving button states.
- Use `access.isReadOnly` to lock the form and `access.isViewOnly` (modes `S`, `A`) for Commit / Validate / Hold. Never recompute either inline.

---

## 3. Four-Eyes (Maker-Checker)

> **The record's inputter can NEVER authorize that same record.**

- `isFourEyesViolation` is `userId === recordInputter` (trimmed, case-insensitive), and it forces `canAuthorize = false`.
- Keep the Authorize button **visible but disabled**, with `getDisableReason(CbsRecordFunction.AUTHORIZE)` as its tooltip. The text is: _"Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction."_ Hide the button only when the user lacks `A`.
- **Enforced only in the UI.** `/api/proxy` calls `verifyUserRecordAccess(currUser, recordFunction)`, which returns 403 if the user lacks the **right** for `I`, `A`, `D`, `R` or `H`. It does not load the record, so it can't detect a Four-Eyes violation, and the offline mock doesn't either. Never remove or weaken the UI check, and never claim server-side Four-Eyes in docs or code comments.

---

## 4. Rules

- Never compare user and inputter, or compute read-only state, outside `@/lib/cbs-access`.
- Never use raw codes (`"A"`, `"UA"`): use `CbsRecordFunction` and `CbsRecordStatus` from `@/types`.
- A new right or status rule belongs in `record-guard.ts`, with a case in `scripts/verify/verify-cbs-access.ts`.

---

## 5. Verification

```bash
pnpm verify:access
```

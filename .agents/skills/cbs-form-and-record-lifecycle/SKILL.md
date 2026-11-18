---

name: cbs-form-and-record-lifecycle
description: Use this skill when building or refactoring dynamic GMC forms, form fields, record state mutations, delta calculations, or form submit and commit flows.
---

# CBS Form & Record Lifecycle Runbook

Banking forms are never hand-coded. The core sends a **Model Config** (data schema) and a **Form Config** (layout); `compileFormSpec()` in `@/lib/cbs-form-spec` joins them, and `FormRenderer` in `@/components/cbs-form-engine` draws the result. If a form renders wrong, fix the compiler or the engine, never one screen. References: `src/lib/cbs-form-spec/README.md`, `src/components/cbs-form-engine/README.md`, `src/lib/cbs-record/README.md`.

---

## 1. Two-tier state (no keystroke thrashing)

1. **Tier 1, field level**: `FormKernelProvider` holds the form's values. Each `FieldAtom` subscribes to its own field through `useFormKernel(selector)`, so a keystroke re-renders one field.
2. **Tier 2, tab level**: `useCbsPersistence` (`@/components/cbs-screen`) keeps the screen's `formData` and writes `formData` and `isDirty` to the workbench tab **debounced by 400 ms**. It also writes on `hydrate`, `rebaseline` and `reset`.
3. Never write to the workbench store per keystroke, and never add a new Zustand store for form data.

`isDirty` comes from `evaluateDirty(baseline, formData)` in `@/lib/cbs-record`, so reverting an edit makes the form clean again.

## 2. Change pipeline

`FormRenderer` runs, for each change: the field's `TRANSFORM` → its `CASCADE` patch → its `ON_CHANGE` rule. It calls `onChange(key, value)` for every field it sets, then emits the full next values once through `onRecordChange`. Visibility rules (`VISIBLE_WHEN` / `HIDDEN_WHEN`) are evaluated by `FieldGrid`. Add new behaviour to these rule types (`field-rules.ts`), not to a screen.

## 3. Saving

```typescript
import { computeDelta } from "@/lib/cbs-record";

const { sendMutation } = useIdempotentSend();

const delta =
  screenMode === CbsRecordFunction.INPUT && Object.keys(baseSnapshot).length > 0
    ? computeDelta(baseSnapshot, values).modifiedFields // amend: changed fields only
    : values; // new record: everything
const commitData = Object.keys(delta).length > 0 ? delta : values;

await executeTransaction(targetId, () =>
  sendMutation(cbs.model(modelCode).save(commitData, { recordId: targetId })),
); // on success: broadcastRecordMutation(modelCode, targetId), reset, back to IDLE
```

This is `useFormMutations` (`src/features/operations/forms/hooks/use-form-mutations.ts`). Reuse it rather than writing another save path.

- Validate before saving with `validateValues(spec, values)` from `@/lib/cbs-form-spec`, and surface the errors in the validation checklist (`focusFormField` jumps to the field).
- After a successful operational save, `useFormMutations` broadcasts the mutation, resets the form and returns to `IDLE`. Designer screens that stay on the record (for example `use-fc-actions.ts`) call `rebaseline()` instead, so the saved values become the new baseline.
- Record IDs come from the operator or from the core (`getNewId()` / `GNI`), never from a timestamp.

## 4. Lifecycle

`PUT` → `UA` (pending) → `AUT` → `AU` (live); `HLD` → held; `DEL` removes an unauthorized record; `REV` reverses a live one. Which actions are allowed when is decided by `@/lib/cbs-access` (see the access-control skill).

> [!WARNING]
> Offline (`DATA_SOURCE=static`), the mock writes every mutation straight into `LIVE` and never fills history or the deleted bucket (`mock/db/README.md`). Don't treat offline behaviour as proof of the real lifecycle.

## 5. Compatibility & UI

- `WorkbenchTab.formData` / `baseline` and staged drafts are persisted in the browser: a compatibility boundary (`.agents/rules/00-core-pillars.md` §1).
- Layout and density: the `cbs-compact-ui-and-layout` skill. Dates are ISO inside the system and come only from `@/lib/core-utils` (`date.ts`): a loaded record passes through `normalizeRecordDates()` once, and dates are shown with `formatDate()` / `formatDateTime()`.

## 6. Verification

```bash
pnpm verify:form-spec
pnpm verify:record
pnpm verify:screen
```

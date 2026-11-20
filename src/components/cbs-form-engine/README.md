# ⚡ Janata CBS Form Engine (`@/components/cbs-form-engine`)

Layer L4: renders any form from a compiled `FormConfigRecord` (produced by [`@/lib/cbs-form-spec`](../../lib/cbs-form-spec/README.md)). No banking screen has hand-written field JSX: `OpsForm`, the Model Config and Form Config previews and the designers all render through this engine.

---

## 🏛️ Render tree

```text
FormKernelProvider          scoped Zustand store for one form (values, errors, touched, visibility, readOnly)
 └─ FormRenderer            groups sections into blocks; applies TRANSFORM, CASCADE and ON_CHANGE on every change
     ├─ CardContainer       a section as a card (collapsible)
     └─ TabGroupContainer   adjacent tab sections as one tab bar
         └─ FieldGrid       12-column grid; evaluates VISIBLE_WHEN, DISABLED_WHEN, DISABLED and FIXEDVALUE
             └─ FieldAtom   subscribes to ONE field's value, error, visibility and readOnly
                 └─ UnifiedFieldFactory   scalar → FieldRow + WidgetRenderer; PROP object or repeating set → ObjectField
AuditContainer              maker-checker trailer: inputter, authorizer, times, revision
```

---

## ⚡ Why typing stays fast

1. **Per-field subscription.** `FieldAtom` reads its slice with `useFormKernel(selector)` (for example `getFieldValue(s.values, fieldKey)`), so typing in one field re-renders only that field, even on 100+ field forms.
2. **One change pipeline.** `FormRenderer.handleFieldChange()` applies the field's `TRANSFORM` (`trim` waits for blur), then its `CASCADE` patch, then its `ON_CHANGE` rule, calling `onChange(key, value)` for each field it sets. It then emits the complete next values once, through `onRecordChange` (or `onValuesChange`).
3. **The screen owns the record.** The caller keeps the record (for `OpsForm`, on the workbench tab via `useCbsPersistence`). Dirty tracking and the delta sent on save come from `@/lib/cbs-record`. Rights and Four-Eyes are decided by `@/lib/cbs-access` in the action bar, not by this engine.

---

## 📦 Files

| Area          | File                                                           | Purpose                                                                                             |
| ------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Store         | `store/form-kernel-store.ts`, `store/form-kernel-provider.tsx` | `createFormKernelStore`, `FormKernelProvider`, `useFormKernel(selector)`, `useFormKernelStore`      |
| Orchestration | `components/form-renderer.tsx`                                 | `FormRenderer`: blocks plus the change pipeline above                                               |
|               | `components/form-preview.tsx`                                  | Live preview used by the Model Config and Form Config designers                                     |
|               | `components/form-layout-context.tsx`                           | Label layout: `"horizontal"` or `"stacked"`                                                         |
| Containers    | `components/containers/card-container.tsx`                     | Section card (`default`, `subtle`, `bordered`, `elevated`, `ghost`; collapsible)                    |
|               | `components/containers/tab-group-container.tsx`                | Tab bar for adjacent tab sections                                                                   |
|               | `components/containers/audit-container.tsx`                    | Maker-checker audit trailer                                                                         |
| Fields        | `components/fields/field-grid.tsx`, `field-atom.tsx`           | Grid and per-field subscription                                                                     |
|               | `components/fields/field-factory.tsx`                          | `UnifiedFieldFactory`: picks `FieldRow` or `ObjectField`                                            |
|               | `components/fields/field-row.tsx`                              | Label column (`w-36`, 144 px), help tooltip, value; an em dash when the value is empty in view mode |
|               | `components/fields/object-field.tsx`                           | Nested `PROP` objects and repeating sets                                                            |
| Hooks         | `hooks/use-field-options.ts`                                   | Options for a field: fixed list (`"O"`) or model lookup (`"M"`, `"L"`)                              |
|               | `hooks/use-model-lookup.ts`                                    | Model lookup query (through `cbsQueries`)                                                           |
|               | `hooks/use-multi-value.ts`                                     | Rows of a repeating set, keyed with `generateClientToken("mv")`                                     |
| Widgets       | `components/widgets/widget-renderer.tsx`                       | Dispatches a `FormWidgetType` to a widget                                                           |

`WidgetRenderer` handles these widget types: `text`, `number`, `textarea`, `amount`, `rate`, `date` / `datetime` / `time`, `select` / `combobox`, `switch`, `checkbox`, `checkbox-group`, and `radio` / `radio-group` / `segmented`. Every widget uses the compact density (`h-8 text-xs`) and semantic tokens. Amounts are monospace and right-aligned.

---

## 🧪 Verification

The engine has no suite of its own. The rules it applies are tested in `@/lib/cbs-form-spec`:

```bash
pnpm verify:form-spec
```

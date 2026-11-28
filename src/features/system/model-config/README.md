# SC.MODEL.CONFIG — Model Config (Data Dictionary)

The bespoke `SC.MODEL.CONFIG` screen (aliases `MC`, `SC.MODEL.BUILDER`) edits Model Config records (control `MODEL.CONFIG`). A model is the data schema of a banking screen: its table (`PREFIX` + `TABLENAME`), ID rules, flags and properties (columns). Form layouts in `SC.FORM.CONFIG` can only arrange properties that a model defines. An operational screen opens only from a Form Config entry (GFC); a model with no entry has no form. The Preview tab still shows the model's fields as one card.

---

## Architecture Overview

```text
                      ┌───────────────────────────────────────────────┐
                      │        SysModelConfig (CbsScreenScaffold)     │
                      └───────┬──────────────┬──────────────┬─────────┘
             ┌────────────────┼──────────────┼──────────────┼────────────────┐
             ▼                ▼              ▼              ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  General Tab │ │Properties Tab│ │ Preview Tab  │ │   JSON Tab   │
     │(mc-general)  │ │(mc-properties│ │ (mc-preview) │ │  (mc-json)   │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
            ▼                ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
     │ FormRenderer │ │ property list│ │ FormPreview  │ │ CbsJsonViewerTab │
     │(form-engine) │ │ + inspector  │ │(form-engine) │ │   (cbs-screen)   │
     └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘
```

The inspector is itself rendered by `FormRenderer`, from the form spec in `fields/mc-property-fields.ts`.

---

## Property types

A property's `TYPE` is one of the 7 `PROPERTY_TYPES` (`@/lib/data-schemas`). Choosing a type applies the `CASCADE` rule on the `TYPE` field (`fields/mc-property-fields.ts`):

| Type       | Sets on change                                  | Default widget (`getDefaultWidgetForType`) |
| ---------- | ----------------------------------------------- | ------------------------------------------ |
| `String`   | `LENGTH: 50`, clears `PROP`                     | `text`                                     |
| `Number`   | `LENGTH: 15`, clears `PROP`                     | `number`                                   |
| `Boolean`  | `LENGTH: 1`, `STRUCTURE: "S"`, clears `PROP`    | `checkbox`                                 |
| `Date`     | `LENGTH: 10`, clears `PROP`                     | `date`                                     |
| `DateTime` | `LENGTH: 19`, clears `PROP`                     | `datetime`                                 |
| `Time`     | `LENGTH: 8`, clears `PROP`                      | `time`                                     |
| `Array`    | `LENGTH: 0`, `PROP: []` (nested sub-properties) | rendered as `ObjectField`                  |

These are starting values: the operator can still edit `LENGTH`. Which widgets a form layout may pick for each type is set by `COMPATIBLE_WIDGETS_FOR_TYPE`.

---

## Rules

1. **Append-only schema.** Existing rows depend on a saved model, so `savedModelIssues()` (`@/lib/data-schemas`) refuses a save that changes the table name or prefix, removes or renames a saved column, or changes a saved column's type, structure or linked model, shortens its length, or makes an optional column required. Sub-columns follow the same rules. Columns are matched by name. The screen runs it against the record it loaded (`hooks/mc-validation.ts`), and `/api/proxy` runs it again against the live model before every PUT (`verifySavedModel` in `src/app/api/_lib/record-guards.ts`), so a direct API call can't skip it. If the live model can't be read, the proxy refuses the save. The editor also stops these edits as you type: `hooks/use-mc-property-ops.ts` locks a saved column's keys, never turns Required on for a saved optional column, and only deletes columns added in the current draft.
2. **Sequential SNs.** A new property or sub-property gets the next number after the highest existing `SN`. No timestamp or random IDs.
3. **Validated before saving.** The record is checked against `modelConfigSaveSchema`: the read schema plus the save rules (uppercase table name, Table Type `G` or `B`, Service Path a service name such as `default` or `finxurm`, a numeric sequence length, at least one property, and per property: unique names (sub-properties unique within their Array), a positive length on String and Number columns, a well-formed `MODELNAME` on String/Number only, at least one sub-property on `Array` and no `PROP` on non-`Array`, no nested Array). `/api/proxy` runs the same check on every PUT to MODEL.CONFIG, so a direct API call can't skip it. The read schema (`modelConfigRecordSchema`) has no property rules, so reads and browser drafts still load a stored model that predates a rule, or a half-edited draft. `hooks/mc-validation.ts` maps each issue to its tab and property SN, so the validation checklist can jump to it. The record is then cleaned with `sanitizeModelConfigRecord()`, which writes `MODELNAME` and `PROP` on every property (`PROP: []` unless the type is `Array`), and saved through the idempotent mutation path in `hooks/use-mc-actions.ts`.
4. **Model references (`MODELNAME`).** Both the inspector and `modelConfigSaveSchema` restrict `MODELNAME` to String and Number properties, and switching to another type clears it.
5. **Loading.** A model is read like any other record: a plain `GET` (record function `S`) on MODEL.CONFIG with the model name as the record ID, for example `BRANCH`; it is saved with `PUT` and authorized with `AUT`. Only a model the core reports as missing (`ModelConfigNotFoundError` from `@/lib/cbs-client`) opens a new draft. Any other load failure shows an error and keeps the screen as it is, so an outage never turns an existing model into a blank draft that could be saved over it.
6. **Canonical modes.** Screen modes use `CbsRecordFunction`.

---

## Module Index

- `sys-model-config.tsx`: the screen (scaffold and tabs). `index.ts`: public export.
- `components/`:
  - `mc-general-tab.tsx`, `mc-properties-tab.tsx`, `mc-preview-tab.tsx`, `mc-json-tab.tsx`: the four tabs.
  - `property/mc-property-list.tsx`, `mc-property-item.tsx`, `mc-property-inspector.tsx`: the master-detail property editor.
- `fields/mc-general-fields.ts`, `fields/mc-property-fields.ts`: form specs for the General tab and the property inspector.
- `hooks/`:
  - `use-model-config.ts`: orchestration.
  - `use-mc-persistence.ts`: the tab draft and the empty model.
  - `use-mc-property-ops.ts`: add, update and remove properties, with the append-only rule.
  - `use-mc-actions.ts`: save, authorize, hold, delete and reverse.
  - `mc-validation.ts`

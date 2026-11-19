# SC.MODEL.CONFIG — Model Config (Data Dictionary)

The bespoke `SC.MODEL.CONFIG` screen (aliases `MC`, `SC.MODEL.BUILDER`) edits Model Config records (control `MODEL.CONFIG`). A model is the data schema of a banking screen: its table (`PREFIX` + `TABLENAME`), ID rules, flags and properties (columns). Form layouts in `SC.FORM.CONFIG` can only arrange properties that a model defines. When no layout exists, `@/lib/cbs-form-spec` builds a fallback form from the model alone.

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

1. **Append-only schema.** A property that is already committed can't be removed. `removeDraftField()` in `hooks/use-mc-property-ops.ts` ignores committed SNs, so only properties added in the current draft can be deleted.
2. **Sequential SNs.** A new property or sub-property gets the next number after the highest existing `SN`. No timestamp or random IDs.
3. **Validated before saving.** The record is checked against `modelConfigSaveSchema`: the read schema plus the save rules (uppercase table name, Table Type `G` or `B`, Service Path a service name such as `default` or `finxurm`, a positive length on String and Number columns, a numeric sequence length, at least one property). `/api/proxy` runs the same check on every SMC, so a direct API call can't skip it. Reads and browser drafts stay on `modelConfigRecordSchema`, so a stored model that predates a rule still loads. `hooks/mc-validation.ts` maps each issue to its tab and property SN, so the validation checklist can jump to it. The record is then cleaned with `sanitizeModelConfigRecord()`, which writes `MODELNAME` and `PROP` on every property (`PROP: []` unless the type is `Array`), and saved through the idempotent mutation path in `hooks/use-mc-actions.ts`.
4. **Canonical modes.** Screen modes use `CbsRecordFunction`.

---

## Module Index

- `sys-model-config.tsx`: the screen (scaffold and tabs). `index.ts`: public export.
- `components/`:
  - `mc-general-tab.tsx`, `mc-properties-tab.tsx`, `mc-preview-tab.tsx`, `mc-json-tab.tsx`: the four tabs.
  - `property/mc-property-list.tsx`, `mc-property-inspector.tsx`, `mc-sub-property-item.tsx`: the master-detail property editor.
- `fields/mc-general-fields.ts`, `fields/mc-property-fields.ts`: form specs for the General tab and the property inspector.
- `hooks/`:
  - `use-model-config.ts`: orchestration.
  - `use-mc-persistence.ts`: the tab draft and the empty model.
  - `use-mc-property-ops.ts`: add, update and remove properties, with the append-only rule.
  - `use-mc-actions.ts`: save, authorize, hold, delete and reverse.
  - `mc-validation.ts`

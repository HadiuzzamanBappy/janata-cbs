# MODEL.CONFIG — Enterprise CBS Data Dictionary Workbench

The `MODEL.CONFIG` feature is the central schema and data dictionary management workbench for Janata CBS. It defines physical table structures, column constraints, sequence generation rules, and operational flags, directly powering the dynamic GMC Form Engine and backend gRPC schema registries.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              SysModelConfig (Scaffold)        │
                      └───────┬──────────────┬──────────────┬─────────┘
                              │              │              │
             ┌────────────────┼──────────────┼──────────────┼────────────────┐
             │                │              │              │                │
             ▼                ▼              ▼              ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  General Tab │ │Properties Tab│ │ Live Preview │ │ JSON Output  │ │ Audit Trailer│
     │(mc-general)  │ │(mc-properties│ │ (mc-preview) │ │  (mc-json)   │ │(form-engine) │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────────┘
            │                │                │                │
            ▼                ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │ FormRenderer │ │McPropertyList│ │ FormPreview  │ │CbsJsonViewer │
     │(form-engine) │ │+ McProperty- │ │(form-engine) │ │ (cbs-screen) │
     │              │ │  Inspector   │ │              │ │              │
     └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 7 Canonical Property Types

All physical columns in Janata CBS strictly conform to the 7 canonical `PROPERTY_TYPES`:

| Type       | Structure                   | Length                   | Default Widget        | Cascade Behaviors                              |
| :--------- | :-------------------------- | :----------------------- | :-------------------- | :--------------------------------------------- |
| `String`   | Single (`S`) or Multi (`M`) | Variable ($1 \dots 500$) | `text`                | Clears subfield array (`PROP: undefined`)      |
| `Number`   | Single (`S`) or Multi (`M`) | Variable ($1 \dots 15$)  | `number` / `amount`   | Clears subfield array (`PROP: undefined`)      |
| `Boolean`  | Single (`S`) strictly       | Fixed ($1$)              | `checkbox` / `switch` | Locks `STRUCTURE="S"`, `LENGTH=1`              |
| `Date`     | Single (`S`) or Multi (`M`) | Fixed ($10$)             | `date`                | Locks `LENGTH=10`, clears `PROP`               |
| `DateTime` | Single (`S`) or Multi (`M`) | Fixed ($19$)             | `datetime`            | Locks `LENGTH=19`, clears `PROP`               |
| `Time`     | Single (`S`) or Multi (`M`) | Fixed ($8$)              | `time`                | Locks `LENGTH=8`, clears `PROP`                |
| `Json`     | Single (`S`) or Multi (`M`) | Dynamic ($0$)            | Nested fields         | Enables recursive child subfields (`PROP: []`) |

---

## Core Invariants

1. **Append-Only Schema Evolution**:
   Properties committed to the physical database cannot be deleted (`removeDraftField` guards against committed SNs). Only uncommitted draft columns can be removed.
2. **Strict Zod Domain Boundary**:
   Mutations must validate against `modelConfigRecordSchema` before dispatching wire payloads.
3. **Canonical Enumerations**:
   All screen modes strictly use `CbsRecordFunction` (`INPUT`, `SEE`, `AUTHORIZE`, `REVERSE`, `DELETE`, `HOLD`).
4. **Zero Magic Strings / Zero Fake IDs**:
   Record identities follow core database sequencing or `generateClientToken("mc")`.

---

## Module Index

- `sys-model-config.tsx` — Main screen scaffold and tab navigator.
- `index.ts` — Public feature export.
- `components/`
  - `mc-general-tab.tsx` — General model attributes and ID generation rules form.
  - `mc-properties-tab.tsx` — Master-detail property list and inspector tab.
  - `mc-preview-tab.tsx` — Live compiled Form Engine interactive preview.
  - `mc-json-tab.tsx` — Formatted wire output payload viewer with diff baseline.
  - `property/mc-property-list.tsx` — Filterable column hierarchy with badge indicators.
  - `property/mc-property-inspector.tsx` — Column detail form powered by FormRenderer.
  - `property/mc-sub-property-item.tsx` — Nested subfield row component for Json objects.
- `fields/`
  - `mc-general-fields.ts` — Form spec for model identification, ID rules, and governance flags.
  - `mc-property-fields.ts` — Form spec for property inspector column attributes.
- `hooks/`
  - `use-model-config.ts` — Feature orchestration and lifecycle state coordinator.
  - `use-mc-actions.ts` — Wire mutations (save, authorize, hold, delete, reverse).
  - `use-mc-persistence.ts` — Persistence binding and initial empty model draft.
  - `use-mc-property-ops.ts` — Property tree mutations and append-only constraints.
  - `mc-validation.ts` — Zod issue mapper to screen tab and field SN targets.

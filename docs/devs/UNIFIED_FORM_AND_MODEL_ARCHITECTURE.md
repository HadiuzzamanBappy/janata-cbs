# Architecture: Unified Metamodel & Form Engine

## Overview

The Janata CBS dynamic rendering system operates on a **two-tier metamodel architecture**:
1. **Model Config (`MODEL.CONFIG`)**: The physical database column authority.
2. **Form Config (`CONFIG.FORM`)**: The presentation layout and widget specification.

This document records the design contracts, file dependencies, and constraint-aware override rules governing how physical database columns map to runtime UI components.

---

## 1. Type-to-Widget Compatibility Matrix

When a field is declared in `MODEL.CONFIG` with a base physical `TYPE`, `CONFIG.FORM` may only override the UI `WIDGET` within that type's compatible domain:

| Model Physical `TYPE` | Compatible Form `WIDGET` Options                       | Default Widget | Example UI Variants                                               |
| :-------------------- | :----------------------------------------------------- | :------------- | :---------------------------------------------------------------- |
| **`Text`**            | `text`, `textarea`                                     | `text`         | Single line text, multiline memo                                  |
| **`Number`**          | `number`, `amount`                                     | `number`       | Numeric counters, currency amount with comma grouping             |
| **`Date`**            | `date`                                                 | `date`         | Standard banking date picker                                      |
| **`Boolean`**         | `switch`, `checkbox`, `radio-group`, `segmented`       | `switch`       | Toggle switch, single checkbox, Yes/No radio, segmented toggle    |
| **`Dropdown`**        | `select`, `radio-group`, `segmented`, `checkbox-group` | `select`       | Dropdown menu, radio list, segmented buttons, multi-checkbox list |
| **`Object`**          | `standard`, `object-group`, `array-table`              | `object-group` | Nested fieldsets, multi-row sub-tables (`STRUCTURE: M`)           |

---

## 2. Universal Schema Hierarchy

```
┌────────────────────────────────────────────────────────┐
│          src/lib/data-schemas/form-engine-schema.ts    │
│  • Single Source of Truth for all field attributes    │
│  • Base Physical Schema (SN, NAME, LABEL, TYPE, etc.)  │
│  • FormElement Schema (WIDGET, configs, ON_CHANGE,     │
│    cross-field VALIDATION)                             │
│  • COMPATIBLE_WIDGETS_FOR_TYPE validation constraint  │
└───────────────────────────┬────────────────────────────┘
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
┌───────────────────────────┐   ┌───────────────────────────┐
│   model-config-schema.ts  │   │   form-config-schema.ts   │
│   (Physical DB Columns)   │   │  (Presentation Layout)    │
│ • Table Metadata          │   │ • Steps & Containers      │
│ • PROPERTIES: Column[]    │   │ • Sections (Card/Table)   │
│ • Physical constraints    │   │ • fields: FormElement[]   │
└───────────────────────────┘   └───────────────────────────┘
```

---

## 3. Audited Form Rendering Files

### Data Schemas (`src/lib/data-schemas/`)

- `src/lib/data-schemas/form-engine-schema.ts`: Universal field/element definition, widget compatibility matrix, reactive rules, and cross-field validation contracts.
- `src/lib/data-schemas/model-config-schema.ts`: Database table and column schema (`MODEL.CONFIG`).
- `src/lib/data-schemas/form-config-schema.ts`: Canvas layout, steps, and section schemas (`CONFIG.FORM`).

### Compiler & Compilation Rules (`src/lib/cbs-form-spec/`)

- `src/lib/cbs-form-spec/compile.ts`: Merges `ModelConfigRecord` and optional `FormConfigRecord` into a `CompiledFormSpec`.
- `src/lib/cbs-form-spec/field-rules.ts`: Layout and width calculation utilities.

### Dynamic Form Engine (`src/features/form-engine/`)

- `components/form-renderer.tsx`: Main entry component for runtime rendering.
- `components/section-card.tsx`: Card, object-group, and array-table sections.
- `components/field-factory.tsx`: Element state, multi-value array handler, and style resolver.
- `components/widget-renderer.tsx`: UI widget switch dispatcher.
- `components/field-atom.tsx`: Read-only, disabled, and required wrappers.
- `components/widgets/*`: All individual widget components (`text`, `textarea`, `select`, `radio`, `switch`, `checkbox`, `checkbox-group`, `amount`, `date`).
- `utils/widget-utils.ts`: Resolves widget type from physical type and explicit overrides.

### Form Designer & Metamodel Designer (`src/features/system/`)

- `src/features/system/form-config/*`: Visual canvas, section drag-and-drop, and field property inspectors.
- `src/features/system/model-config/*`: Metamodel table editor and property list.

# SC.FORM.CONFIG — Visual Form Designer

The bespoke `SC.FORM.CONFIG` screen (alias `FC`) is where layouts are authored for the core's form configuration (control `CONFIG.FORM`). A layout arranges the fields that a **Model Config** record defines (`MODEL.CONFIG`) into sections, tab groups and widgets. `@/lib/cbs-form-spec` compiles the two together, and `@/components/cbs-form-engine` renders the result on every operational screen.

---

## Architecture Overview

```text
                      ┌───────────────────────────────────────────────┐
                      │          SysFormConfig (CbsScreenScaffold)    │
                      └───────┬──────────────┬──────────────┬─────────┘
             ┌────────────────┼──────────────┼──────────────┼────────────────┐
             ▼                ▼              ▼              ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  General Tab │ │ Designer Tab │ │ Preview Tab  │ │   JSON Tab   │
     │(fc-general)  │ │(fc-designer) │ │ (fc-preview) │ │  (fc-json)   │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
            ▼                ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
     │ FormRenderer │ │ 3-pane       │ │ FormPreview  │ │ CbsJsonViewerTab │
     │(form-engine) │ │ designer     │ │(form-engine) │ │   (cbs-screen)   │
     └──────────────┘ └──────────────┘ └──────────────┘ └──────────────────┘
```

---

## 3-Pane Designer

```text
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     Field Palette       │     Designer Canvas     │   Property Inspector    │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Model variables       │ • Sortable sections     │ • Canvas settings       │
│   (filtered by TYPE)    │ • Drop zones            │ • Container settings    │
│ • Container presets     │ • Card and tab groups   │ • Field: model anchor,  │
│   (card / tab group)    │ • Repeating sets        │   widget, rules, lookup │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

Drag and drop uses `@dnd-kit`. Designer state is shared through `components/designer/context/designer-context.tsx`.

---

## Widgets

A layout can use the 14 widget types in `FORM_WIDGET_TYPES` (`@/lib/data-schemas`):

| Widget                                                 | Settings object  | Settings                                                                                       |
| ------------------------------------------------------ | ---------------- | ---------------------------------------------------------------------------------------------- |
| `text`, `textarea`                                     | `TEXT_CONFIG`    | `textTransform`, `maskPattern`, `autoTrim`                                                     |
| `number`, `amount`                                     | `NUMBER_CONFIG`  | `isCurrency`, `currencyCode`, `decimals`, `allowNegative`, `minValue`, `maxValue`              |
| `rate`                                                 | `RATE_CONFIG`    | `decimals`, `allowNegative`, `minValue`, `maxValue`, `suffix` (default `%`)                    |
| `date`, `datetime`                                     | `DATE_CONFIG`    | `datePattern`, `minDateOffset`, `maxDateOffset`, `disableHolidays`                             |
| `time`                                                 | —                | —                                                                                              |
| `switch`, `checkbox`                                   | `BOOLEAN_CONFIG` | `widgetStyle`, `trueValue` / `falseValue` (default `Y` / `N`), `activeLabel` / `inactiveLabel` |
| `select`, `radio-group`, `segmented`, `checkbox-group` | `PARAMETER`      | fixed options (`O`), model lookup (`M`), local catalog (`L`)                                   |

Which widgets a field may use depends on its model type. That rule lives in one place, `COMPATIBLE_WIDGETS_FOR_TYPE` in `form-widget-schema.ts`, and `resolveWidgetType()` in `@/lib/cbs-form-spec` ignores an incompatible choice.

---

## Rules

1. **Templates survive a drop.** `canvas-drop-dispatcher.ts` and `use-fc-field-ops.ts` spread the whole template (`...template`, `...fieldTemplate`), so a dropped field keeps its widget settings, rules and transforms.
2. **Validated before saving.** The record is checked against `formConfigSaveSchema` (`hooks/fc-validation.ts`): title, routine names, at least one section, unique section IDs, a title on every tab (cards may be untitled: standalone fields and ghost cards), a label on every field, unique field names, condition and `ON_CHANGE` targets that exist on the form (or `auditData.*`), options for choice widgets (unless a `MODELNAME` lookup feeds them), `min` ≤ `max`, and valid regex patterns. With the target model loaded, it also flags a field the model doesn't have. `/api/proxy` runs the same schema on every SFC. Reads stay on `formConfigRecordSchema`, so a stored layout that predates a rule still loads. It is then cleaned with `sanitizeFormConfigRecord()` and saved with `cbs.formConfig.save(…)` (`SFC`) through the idempotent mutation path in `hooks/use-fc-actions.ts`.
3. **Barrels only.** Import the engine as `@/components/cbs-form-engine`, never by a deep path.
4. **Canonical modes.** Modes use `CbsRecordFunction` and the idle mode from `CBS_SCREEN_MODES`.

---

## Module Index

- `sys-form-config.tsx`: the screen. Scaffold, tabs, toolbar actions, record loading.
- `components/fc-general-tab.tsx`, `fc-designer-tab.tsx`, `fc-preview-tab.tsx`, `fc-json-tab.tsx`: the four tabs.
- `components/designer/`:
  - `field-palette.tsx` + `palette/`: model variables, container presets, drag sources.
  - `designer-canvas.tsx` + `canvas/`: section grid, card and tab-group blocks, drop zones (`canvas-drop-dispatcher.ts`, `use-canvas-drag.ts`).
  - `property-inspector.tsx` + `inspector/`: `canvas-inspectors.tsx` (canvas and container), `field-inspector.tsx` (one field), `inspector-lookup-config.tsx` (options and lookups).
  - `context/`: designer state shared by the three panes.
- `fields/`: the inspector's own form specs. `fc-general-fields.ts` (`FORM_CONFIG_SECTIONS`), `fc-canvas-fields.ts`, `fc-widget-fields.ts`, `fc-field-fields.ts` and `fc-lookup-fields.ts`.
- `hooks/`:
  - `use-form-config.ts`: loads the record.
  - `use-fc-persistence.ts`: the tab draft.
  - `use-fc-actions.ts`: save and authorize.
  - `fc-validation.ts`
  - field and section operations: `use-fc-field-ops.ts`, `use-fc-field-movement.ts`, `use-fc-section-ops.ts`, `use-fc-section-reorder.ts`, `use-fc-section-zones.ts`

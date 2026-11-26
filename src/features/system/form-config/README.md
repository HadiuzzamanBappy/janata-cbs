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

Moving fields, cards and tab groups around the canvas uses `@dnd-kit`. Dragging from the palette, and dragging a tab out of its strip, uses native drag and drop: every such drag is written and read through `canvas/drag-payload.ts` (its own MIME type, checked with `designerDragPayloadSchema`), and `canvas/canvas-drop-dispatcher.ts` places it on its target (the canvas, a section or a new tab). Designer state is shared through `components/designer/context/designer-context.tsx`.

---

## Widgets

**The designer and the form engine match 1:1.** Every setting the inspector offers changes what operators see or what is saved, and every engine rule worth authoring has an inspector input. A setting lives in one place only: value ranges are `VALIDATION.min` / `max`, text shaping is `TRANSFORM`.

A layout can use the 14 widget types in `FORM_WIDGET_TYPES` (`@/lib/data-schemas`). Widget settings (inspector **Widget** tab, `fields/fc-widget-fields.ts`):

| Widget                                                 | Settings                                                                                                     | Engine effect                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| `number`, `amount`                                     | `NUMBER_CONFIG.decimals`, `currencyCode` (amount badge, default BDT), `VALIDATION.min` / `max`               | Decimals and range validated; amount badge and format |
| `rate`                                                 | `RATE_CONFIG.decimals`, `suffix` (default `%`), `VALIDATION.min` / `max`                                     | Decimals and range validated; suffix badge            |
| `date`, `datetime`                                     | `DATE_CONFIG.minDateOffset` / `maxDateOffset` (whole days from today in bank time)                           | Picker limits and validation                          |
| `switch`, `checkbox`                                   | `BOOLEAN_CONFIG.activeLabel` / `inactiveLabel`, and for String columns `trueValue` / `falseValue` (e.g. Y/N) | Badge text; value stored (else `true` / `false`)      |
| `select`, `radio-group`, `segmented`, `checkbox-group` | `PARAMETER`: fixed options (`O`), model lookup (`M`), array lookup (`A`)                                     | Option source                                         |
| `text`, `textarea`, `time`                             | none (text uses the Rules tab)                                                                               | —                                                     |

Basics tab: label, width (**AUTO**, the default, follows the column length and stores no `WIDTH`; a size fixes it), required, read-only, help tooltip, **default value** (filled once on new records) and **fixed value** (always written on input, shown read-only; replaces the default).

Rules tab (`fields/fc-rule-fields.ts`, rows converted by `fields/fc-rule-adapters.ts`, bound in `inspector/use-field-rule-view.ts`):

| Card          | Stored as                      | Engine effect                                                                  |
| ------------- | ------------------------------ | ------------------------------------------------------------------------------ |
| Validation    | `TRANSFORM`, `VALIDATION`      | Case / no-spaces as typed, trim on blur; pattern; length range for text fields |
| Visible When  | `VISIBLE_WHEN` (`and` / `or`)  | Field hidden and not validated while the conditions fail                       |
| Disabled When | `DISABLED_WHEN` (`and` / `or`) | Field read-only while the conditions hold                                      |
| Cascade       | `CASCADE`                      | Setting this field to a value sets other fields (every matching row applies)   |
| On Change     | `ON_CHANGE`                    | Copy, clear, join or re-case into the target field                             |

Field pickers list only the fields placed on the form. Inspector specs carry no `DEFAULTVALUE` for settings, because opening the inspector must never write into the layout.

**Object groups** (model `Array` properties with `PROP`) drop onto the canvas with all their inner fields, listed inside the group's card (`canvas/canvas-object-fields.tsx`). An inner field is selected, configured (same inspector: label, widget, width, rules), reordered or removed like any field; the palette puts a removed one back. Lookups go through `hooks/fc-field-tree.ts` (inner fields are identified by `SN`). At runtime `ObjectField` evaluates each inner field's `VISIBLE_WHEN` / `DISABLED_WHEN`, and `FormRenderer` finds its `TRANSFORM` / `CASCADE` / `ON_CHANGE` by value key (`findFieldSpecByKey`: `ADDRESS.city`, `ITEMS.0.code`).

Which widgets a field may use depends on its model type. That rule lives in one place, `COMPATIBLE_WIDGETS_FOR_TYPE` in `form-widget-schema.ts` (read through `getCompatibleWidgets()`), and `resolveWidgetType()` in `@/lib/cbs-form-spec` ignores an incompatible choice.

---

## Rules

1. **Templates survive a drop.** `canvas-drop-dispatcher.ts` and `use-fc-field-ops.ts` spread the whole template (`...template`, `...fieldTemplate`), so a dropped field keeps its widget settings, rules and transforms.
2. **Validated before saving.** The record is checked against `formConfigSaveSchema` (`hooks/fc-validation.ts`): title, routine names, at least one section, unique section IDs, a title on every tab (cards may be untitled: standalone fields and ghost cards), a label on every field, unique field names, condition and `ON_CHANGE` targets that exist on the form (or `auditData.*`), options for choice widgets (unless a `MODELNAME` lookup feeds them), `min` ≤ `max`, and valid regex patterns. With the target model loaded, it also flags a field the model doesn't have, inner fields of object groups included (matched by name, as the compiler merges them). `/api/proxy` runs the same schema on every SFC. Reads stay on `formConfigRecordSchema`, so a stored layout that predates a rule still loads. It is then cleaned with `sanitizeFormConfigRecord()` and saved with `cbs.formConfig.save(…)` (`SFC`) through the idempotent mutation path in `hooks/use-fc-actions.ts`.
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

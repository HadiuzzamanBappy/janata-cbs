# FORM.CONFIG — Enterprise CBS Visual Form Designer & Workbench

The `FORM.CONFIG` feature is the visual form authoring and layout management workbench for Janata CBS. It bridges raw database definitions from `MODEL.CONFIG` to high-density, dynamic banking screens rendered by the dynamic Form Engine (`@/components/cbs-form-engine`) and compiled via `@/lib/cbs-form-spec`.

---

## Architecture Overview

```
                      ┌───────────────────────────────────────────────┐
                      │              SysFormConfig (Scaffold)         │
                      └───────┬──────────────┬──────────────┬─────────┘
                              │              │              │
             ┌────────────────┼──────────────┼──────────────┼────────────────┐
             │                │              │              │                │
             ▼                ▼              ▼              ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  General Tab │ │ Designer Tab │ │ Live Preview │ │ JSON Output  │ │ Audit Trailer│
     │(fc-general)  │ │(fc-designer) │ │ (fc-preview) │ │  (fc-json)   │ │(form-engine) │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └──────────────┘
            │                │                │                │
            ▼                ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │ FormRenderer │ │3-Pane Layout │ │ FormPreview  │ │CbsJsonViewer │
     │(form-engine) │ │(Palette,     │ │(form-engine) │ │ (cbs-screen) │
     │              │ │ Canvas,      │ │              │ │              │
     │              │ │ Inspector)   │ │              │ │              │
     └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

---

## 3-Pane Designer Workbench Architecture

The visual form designer (`FcDesignerTab`) is structured as a 3-pane workbench:

```
┌─────────────────────────┬─────────────────────────┬─────────────────────────┐
│     Field Palette       │     Designer Canvas     │   Property Inspector    │
│  (Variables & Presets)  │   (Cards & Tab Groups)  │  (Hierarchical Editor)  │
├─────────────────────────┼─────────────────────────┼─────────────────────────┤
│ • Model Variables       │ • Sortable Section Rows │ • Root Canvas Config    │
│   (Filtered by TYPE)    │ • Drag-over Drop Zones  │ • Container Presets     │
│ • Container Presets     │ • Dynamic Subgrids      │ • DB Model Anchors      │
│   (Card / Tab Group)    │ • Multi-Value Arrays    │ • Widget Presentation   │
│ • Drag Handlers         │ • Selection Highlights  │ • Advanced Rules & RTNs │
└─────────────────────────┴─────────────────────────┴─────────────────────────┘
```

---

## Supported Widgets & Capability Matrix

Janata CBS dynamic forms support **14 presentation widgets** strictly aligned with `formElementSchema`:

| Widget           | Suitable Types     | Presentation Capabilities                                                        | Config Object    |
| :--------------- | :----------------- | :------------------------------------------------------------------------------- | :--------------- |
| `text`           | `String`           | Input mask (`maskPattern`), text transform (`uppercase`, `lowercase`), auto-trim | `TEXT_CONFIG`    |
| `textarea`       | `String`           | Multi-line text with configurable row spans and max lengths                      | `TEXT_CONFIG`    |
| `number`         | `Number`           | Monospace integer/decimal entry with hard `minValue`/`maxValue` limits           | `NUMBER_CONFIG`  |
| `amount`         | `Number`           | Currency-formatted decimal with grouping commas and currency codes (BDT, USD)    | `NUMBER_CONFIG`  |
| `rate`           | `Number`           | Percentage / basis point rate input with custom suffixes (`%`, `bps`)            | `RATE_CONFIG`    |
| `date`           | `Date`             | Standard date input with format patterns and holiday checking                    | `DATE_CONFIG`    |
| `datetime`       | `DateTime`         | Full ISO timestamp formatting with localized display                             | `DATE_CONFIG`    |
| `time`           | `Time`             | Time picker in 24h format (`HH:mm:ss`)                                           | —                |
| `select`         | `String`, `Number` | Dropdown picker backed by static options (`O`) or model queries (`M`)            | `PARAMETER`      |
| `radio-group`    | `String`, `Number` | Compact pill or radio option list                                                | `PARAMETER`      |
| `segmented`      | `String`, `Number` | High-density segmented button group                                              | `PARAMETER`      |
| `checkbox`       | `Boolean`          | Minimal checkbox toggle                                                          | `BOOLEAN_CONFIG` |
| `checkbox-group` | `String` (`M`)     | Multi-select checkbox cluster for repeating parameters                           | `PARAMETER`      |
| `switch`         | `Boolean`          | Accessible switch toggle with active/inactive label tokens                       | `BOOLEAN_CONFIG` |

---

## Core Invariants

1. **Zero Template Loss During Drag-and-Drop**:
   Palette drop dispatchers (`canvas-drop-dispatcher.ts`) and field manipulation hooks (`use-fc-field-ops.ts`) strictly spread `...template` and `...fieldTemplate`, preventing loss of contextual widget configs, rules, or transforms when adding fields.
2. **Strict Zod Domain Boundary**:
   Form definitions validate against `formConfigRecordSchema` before committing state or dispatching save operations via `cbs.formConfig.put(...)`.
3. **Public Barrel Architecture**:
   Deep internal imports into components (`@/components/cbs-form-engine/components/...`) are strictly forbidden; all communication resolves through public barrels (`@/components/cbs-form-engine`).
4. **Canonical Enumerations**:
   All screen modes strictly use `CbsRecordFunction` (`INPUT`, `SEE`, `AUTHORIZE`, `REVERSE`, `DELETE`, `HOLD`) and `CBS_SCREEN_MODES[0]` for `IDLE`.
5. **Size Budget**:
   Every component file strictly adheres to the $\le 300$ line size budget (stretch up to $350$ when cohesive), and hooks adhere to $\le 250$ lines.

---

## Module Index

- **`sys-form-config.tsx`**: Screen scaffold wiring tabs, toolbar actions, and command grammar.
- **`components/fc-designer-tab.tsx`**: 3-pane workbench container with resizable grid splits.
- **`components/designer/palette/`**: Model variable queries, filtering, and drag source emitters.
- **`components/designer/canvas/`**: Live canvas renderer with card blocks, tab clusters, and drop dispatchers.
- **`components/designer/inspector/`**:
  - `canvas-inspectors.tsx`: Unified root canvas density, columns, and container configuration.
  - `field-inspector.tsx`: Contextual inspector with embedded physical DB anchor, general specifications, and reactive collapsible sections.
  - `inspector-lookup-config.tsx`: Dynamic options, model lookup, and local catalog selector.
- **`fields/`**:
  - `fc-general-fields.ts`: General metadata and routine hooks specification (`FORM_CONFIG_SECTIONS`).
  - `fc-canvas-fields.ts`: Canvas layout and container specifications (`ROOT_FORM_PROPERTIES_SECTION`, `CONTAINER_PROPERTIES_SECTION`).
  - `fc-widget-fields.ts`: Contextual widget rule specifications (text, number, rate, date, boolean) and dispatcher.
  - `fc-field-fields.ts`: Field anchor, general properties, rules, on-change automation, and conditional dependencies.
  - `fc-lookup-fields.ts`: Static options (`O`), model lookup (`M`), and local catalog (`L`) specifications.
- **`hooks/`**: Specialized operation hooks for field addition, reordering, zone conversions, and persistence.

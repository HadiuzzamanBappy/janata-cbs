# 📋 CBS Form Spec & Compiler Engine (`@/lib/cbs-form-spec`)

A pure, deterministic compiler, fallback layout synthesizer, and headless runtime rules engine for the **Janata Core Banking Workbench**.

It bridges backend data schemas defined in **Model Config** (`SC.MODEL.CONFIG`) and visual presentation layouts created in **Form Config Designer** (`SC.FORM.CONFIG`), compiling them into a canonical `FormConfigRecord` consumed by `FormRenderer`, `OpsForm`, and banking form state hooks.

---

## 🏛️ Architectural Hierarchy & Invariants

```text
┌─────────────────────────────────┐
│     Model Config (SC.MODEL)     │  <── Sole Authority on Data Schema
│  (Properties, Types, DB Limits) │      (Physical DDL: String, Number, Boolean, Date, DateTime, Time, Array)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Form Config (SC.FORM)       │  <── Pure Presentation Layer
│   (Sections, Widgets, Grid)     │      (Visual styling; cannot fabricate database columns)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       compileFormSpec()         │  <── Pure Engine (@/lib/cbs-form-spec)
│    Produces: FormConfigRecord   │      (Client, Server, Script & SSR Safe)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     OpsForm / FormRenderer      │  <── Consumes Compiled Form Config
│   (Pure Dynamic Execution)      │      (Zero Hardcoded Field JSX)
└─────────────────────────────────┘
```

1. **Model Schema Authority**: `ModelConfigRecord` is the sole source of truth for physical data schemas (`TYPE`, `LENGTH`, `STRUCTURE`, `REQUIRED`). The visual presentation form cannot invent physical database columns.
2. **Model preview only**: `compileFormSpec(model)` with no layout lays out every model field in one card. Only the MODEL.CONFIG preview uses it; an operational screen needs a CONFIG.FORM entry (`formConfigSchema` in `@/lib/cbs-client` fails when there is none).
3. **Pure Execution**: Zero React UI dependencies, zero DOM assumptions, zero side-effects. Executes identically on Node.js server routes, browser clients, and CLI verification test suites.
4. **Fix rendering here, not per screen**: if a form renders wrong, the fix belongs in this compiler or in the form engine, never in an individual screen.

---

## 📦 Module Index & File Architecture

The engine is partitioned into 7 decoupled, single-responsibility modules:

| Module                                             | Core Responsibility                                                                   | Key Exports                                                                                                           |
| :------------------------------------------------- | :------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------------------------- |
| **[`compile.ts`](./compile.ts)**                   | Master specification compilation, model merging & fallback layout generation          | `compileFormSpec`, `buildFallbackSections`, `mergeFieldWithModelProp`, `modelPropertyMatcher` (field ↔ model by NAME) |
| **[`field-normalizer.ts`](./field-normalizer.ts)** | Physical-to-presentation normalization, widget inference & semantic width derivation  | `deriveSemanticWidth`, `defaultWidthForLength`, `resolveWidgetType`, `normalizeParameter`, `modelPropToFormElement`   |
| **[`field-rules.ts`](./field-rules.ts)**           | Pure reactive field behaviors (transforms, cascading defaults, condition evaluation)  | `applyFieldTransform`, `evaluateFieldCascade`, `evaluateFieldCondition`, `evaluateOnChangeRule`                       |
| **[`validation.ts`](./validation.ts)**             | Headless validation engine with nested recursive object (`PROP`) checking             | `validateValues`, `validateFormFields`, `validateSingleField`                                                         |
| **[`layout-blocks.ts`](./layout-blocks.ts)**       | Tab clustering by `groupId` and container layout grouping                             | `buildRenderBlocks`, `resolveTabGroupConfig`, `getBlockGapSectionIndex`                                               |
| **[`layout-grid.ts`](./layout-grid.ts)**           | 1 to 4 column section grids, cell spans & compact banking input width caps            | `SEMANTIC_INPUT_WIDTH_CLASSES`, `getFieldColSpanClass`, `getGridColsClass`, `getInputWidthClass`                      |
| **[`path-utils.ts`](./path-utils.ts)**             | Pure, immutable flat & dot-notated record accessors, and the field behind a value key | `getFieldValue`, `setFieldValue`, `deleteFieldValue`, `findFieldSpecByKey`                                            |
| **[`record-dates.ts`](./record-dates.ts)**         | Converts a loaded record's Date / DateTime fields to ISO, once, by field type         | `normalizeRecordDates`                                                                                                |

---

## 📐 Semantic Width Tokens & High-Density Banking Layouts

To maintain compact banking density and prevent inputs from stretching across ultra-wide workstation monitors, widths are categorized into 7 semantic tokens:

|   Token    | Character Capacity |       12-Col Grid Span       |     Input Width Cap     | Typical Banking Usage                                                       |
| :--------: | :----------------: | :--------------------------: | :---------------------: | :-------------------------------------------------------------------------- |
|  **`xs`**  |   $\le 6$ chars    | `col-span-12 md:col-span-2`  | `sm:max-w-28` (~112px)  | Currency codes, branch codes, status flags, Time (`HH:mm`)                  |
|  **`sm`**  |   $\le 16$ chars   | `col-span-12 md:col-span-3`  | `sm:max-w-44` (~176px)  | Account numbers, Dates, postal codes                                        |
|  **`md`**  |   $\le 40$ chars   | `col-span-12 md:col-span-4`  | `sm:max-w-72` (~288px)  | Financial amounts, interest rates, customer short names, standard dropdowns |
|  **`lg`**  |   $\le 80$ chars   | `col-span-12 md:col-span-6`  | `sm:max-w-md` (~448px)  | Full entity names, designations, titles                                     |
|  **`xl`**  |  $\le 150$ chars   | `col-span-12 md:col-span-8`  | `sm:max-w-xl` (~576px)  | Street addresses, organizational structures                                 |
| **`xxl`**  |   $> 150$ chars    | `col-span-12 md:col-span-10` | `sm:max-w-2xl` (~672px) | Narrative text, remarks, multiline descriptions                             |
| **`full`** |  Structured JSON   |        `col-span-12`         |     `w-full` (100%)     | Rich text remarks, embedded tables, full-width sections                     |

---

## 🔍 Validation Engine Capabilities

`validation.ts` evaluates form state against both physical database limits and presentation rules:

1. **Mandatory Required Check**: Distinguishes missing values (`undefined`, `null`, `""`, empty arrays) from valid falsy values (`false`, `0`).
2. **Physical Column Length**: Verifies string lengths against physical DDL column capacity (`ctx.length`).
3. **Numeric Bounds & Digits**: Accepts plain decimals only (`-5`, `12.50`; not `1e3`, `0x10`, `Infinity`), then checks maximum physical digits and `validation.min` / `validation.max` thresholds.
4. **Temporal Standards**: `record-dates.ts` (`normalizeRecordDates`) converts a loaded record's Date / DateTime fields to ISO once. Dates are ISO only (`Date` / `DateTime`, the CBS wire contract): `20250101`, `01/05/2026` and impossible days such as `2026-02-30` are rejected; and 24-hour time strings (`HH:mm` or `HH:mm:ss`).
5. **Pattern / Regex**: Safely evaluates custom `matches` regex patterns inside guarded blocks, returning author-defined `validation.message` strings.
6. **Recursive Sub-Properties (`PROP`)**: Traverses nested object fields (e.g. `AUDIT_DETAILS.reviewer`) and table rows (e.g. `ITEMS.0.code`).
7. **Multi-Value Items**: Each filled item of a multi-value (`M`) field meets the single-value rules above.
8. **Hidden Fields Skipped**: A field hidden by `VISIBLE_WHEN` (the same check `FieldGrid` uses) is not validated, so a required field the operator can't see never blocks a save.
9. **Widget Constraints**: `resolveFieldDecimals` (`NUMBER_CONFIG` / `RATE_CONFIG` `decimals`) caps decimal places, and `resolveFieldDateRange` turns `DATE_CONFIG` offsets (whole days from today in bank time) into an ISO range. The date widget uses the same range for its picker limits.

Field rules (`field-rules.ts`): `TRANSFORM` runs on each change except `trim`, which the text widgets apply on blur (`isLiveTransform`). `CASCADE` applies every rule whose `when` matches. `ON_CHANGE` copies, clears, joins or re-cases into its target. `in` / `notIn` accept an array or a comma-separated string. `isBooleanOn` / `toBooleanValue` read and write `BOOLEAN_CONFIG` wire values (else `true` / `false`).

---

## 🚀 Quick Reference & Usage Patterns

### 1. Compiling Form Specifications

```typescript
import { compileFormSpec } from "@/lib/cbs-form-spec";
import type { ModelConfigRecord, FormConfigRecord } from "@/lib/data-schemas";

// Case A: Model preview (MODEL.CONFIG Preview tab; operational screens always have a layout)
const fallbackSpec = compileFormSpec(modelRecord);
// fallbackSpec.frmElements.sections: one responsive card section

// Case B: Custom layout composition (Merges designer layout with physical constraints)
const customSpec = compileFormSpec(modelRecord, formConfigRecord);
```

### 2. Validating Runtime Values on Commit

```typescript
import { validateValues } from "@/lib/cbs-form-spec";

const draftValues = {
  accountNo: "AC10001",
  balance: "invalid-number", // Fails numeric check
  openDate: "", // Fails required check
  time: "14:30", // Passes HH:mm validation
};

const errors = validateValues(compiledSpec, draftValues);
// errors: { [fieldName]: message } — empty when valid
```

### 3. Evaluating Reactive Conditions & Cascades

```typescript
import { evaluateFieldCondition, evaluateFieldCascade } from "@/lib/cbs-form-spec";

// Check interactive visibility condition (VISIBLE_WHEN / DISABLED_WHEN)
const isVisible = evaluateFieldCondition(field.VISIBLE_WHEN, formValues);

// Trigger cascading defaults upon field modification
const fieldUpdates = evaluateFieldCascade(field.CASCADE, selectedValue);
```

### 4. Pure, Immutable Record Path Access

```typescript
import { getFieldValue, setFieldValue, deleteFieldValue } from "@/lib/cbs-form-spec";

// Safely read direct flat keys or nested dot-paths
const name = getFieldValue(state.values, "CUSTOMER.profile.name");

// Immutably assign value without mutating the source record
const nextValues = setFieldValue(state.values, "CUSTOMER.profile.name", "Jane Doe");

// Immutably delete nested key
const cleanValues = deleteFieldValue(nextValues, "CUSTOMER.profile.name");
```

---

## 🧪 Verification

The suite is `scripts/verify/verify-cbs-form-spec.ts`. Add a case there when you change compilation, widths, rules or validation.

```bash
pnpm verify:form-spec
```

# 📋 CBS Form Spec & Compiler Engine (`@/lib/cbs-form-spec`)

A pure, deterministic compiler, fallback layout synthesizer, and headless runtime rules engine for the **Janata Core Banking Workbench**.

It bridges backend data schemas defined in **Model Config** (`SC.MODEL.CONFIG`) and visual presentation layouts created in **Form Config Designer** (`SC.FORM.CONFIG`), compiling them into a canonical `FormConfigRecord` consumed by `FormRenderer`, `OpsForm`, and banking form state hooks.

---

## 🏛️ Architectural Hierarchy & Invariants

```text
┌─────────────────────────────────┐
│     Model Config (SC.MODEL)     │  <── Sole Authority on Data Schema
│  (Properties, Types, DB Limits) │      (Physical DDL: String, Number, Boolean, Date, DateTime, Time, Json)
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
2. **Deterministic Fallback**: When no visual layout exists, `compileFormSpec(model)` automatically synthesizes an immediately usable 12-column responsive fallback form.
3. **Pure Execution**: Zero React UI dependencies, zero DOM assumptions, zero side-effects. Executes identically on Node.js server routes, browser clients, and CLI verification test suites.
4. **Size Budget**: Every module in this library strictly adheres to the engineering size budget ($\le 200$ lines).

---

## 📦 Module Index & File Architecture

The engine is partitioned into 7 decoupled, single-responsibility modules:

| Module                                             | Lines | Core Responsibility                                                                  | Key Exports                                                                                     |
| :------------------------------------------------- | :---: | :----------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------- |
| **[`compile.ts`](./compile.ts)**                   |  151  | Master specification compilation, model merging & fallback layout generation         | `compileFormSpec`, `buildFallbackSections`, `mergeFieldWithModelProp`                           |
| **[`field-normalizer.ts`](./field-normalizer.ts)** |  182  | Physical-to-presentation normalization, widget inference & semantic width derivation | `deriveSemanticWidth`, `defaultWidthForLength`, `resolveWidgetType`, `modelPropToFormElement`   |
| **[`field-rules.ts`](./field-rules.ts)**           |  181  | Pure reactive field behaviors (transforms, cascading defaults, condition evaluation) | `applyFieldTransform`, `evaluateFieldCascade`, `evaluateFieldCondition`, `evaluateOnChangeRule` |
| **[`validation.ts`](./validation.ts)**             |  188  | Headless validation engine with nested recursive object (`PROP`) checking            | `validateValues`, `validateFormFields`, `validateSingleField`                                   |
| **[`layout-blocks.ts`](./layout-blocks.ts)**       |  71   | Contiguous tab clustering and container layout grouping                              | `buildRenderBlocks`, `getBlockGapSectionIndex`                                                  |
| **[`layout-grid.ts`](./layout-grid.ts)**           |  158  | 12-column responsive spans & compact banking input width caps                        | `getFieldColSpanClass`, `getGridColsClass`, `getInputWidthClass`                                |
| **[`path-utils.ts`](./path-utils.ts)**             |  128  | Pure, immutable flat & dot-notated record accessors                                  | `getFieldValue`, `setFieldValue`, `deleteFieldValue`                                            |
| **[`index.ts`](./index.ts)**                       |  22   | Unified barrel entry point exporting all 7 modules                                   | Re-exports all capabilities                                                                     |

---

## 📐 Semantic Width Tokens & High-Density Banking Layouts

To maintain compact banking density and prevent inputs from stretching across ultra-wide workstation monitors, widths are categorized into 7 semantic tokens:

|   Token    | Character Capacity |       12-Col Grid Span       |   Input Width Cap    | Typical Banking Usage                                                       |
| :--------: | :----------------: | :--------------------------: | :------------------: | :-------------------------------------------------------------------------- |
|  **`xs`**  |   $\le 6$ chars    | `col-span-12 md:col-span-2`  | `max-w-28` (~112px)  | Currency codes, branch codes, status flags, Time (`HH:mm`)                  |
|  **`sm`**  |   $\le 16$ chars   | `col-span-12 md:col-span-3`  | `max-w-44` (~176px)  | Account numbers, Dates, postal codes                                        |
|  **`md`**  |   $\le 40$ chars   | `col-span-12 md:col-span-4`  | `max-w-72` (~288px)  | Financial amounts, interest rates, customer short names, standard dropdowns |
|  **`lg`**  |   $\le 80$ chars   | `col-span-12 md:col-span-6`  | `max-w-md` (~448px)  | Full entity names, designations, titles                                     |
|  **`xl`**  |  $\le 150$ chars   | `col-span-12 md:col-span-8`  | `max-w-xl` (~576px)  | Street addresses, organizational structures                                 |
| **`xxl`**  |   $> 150$ chars    | `col-span-12 md:col-span-10` | `max-w-2xl` (~672px) | Narrative text, remarks, multiline descriptions                             |
| **`full`** |  Structured JSON   |        `col-span-12`         |   `w-full` (100%)    | Rich text remarks, embedded tables, full-width sections                     |

---

## 🔍 Validation Engine Capabilities

`validation.ts` evaluates form state against both physical database limits and presentation rules:

1. **Mandatory Required Check**: Distinguishes missing values (`undefined`, `null`, `""`, empty arrays) from valid falsy values (`false`, `0`).
2. **Physical Column Length**: Verifies string lengths against physical DDL column capacity (`ctx.length`).
3. **Numeric Bounds & Digits**: Validates number parseability, maximum physical digits, and `validation.min` / `validation.max` thresholds.
4. **Temporal Standards**: Validates ISO dates (`Date` / `DateTime`) and 24-hour time strings (`HH:mm` or `HH:mm:ss`).
5. **Pattern / Regex**: Safely evaluates custom `matches` regex patterns inside guarded blocks, returning author-defined `validation.message` strings.
6. **Recursive Sub-Properties (`PROP`)**: Traverses nested object fields (e.g. `AUDIT_DETAILS.reviewer`) and table rows (e.g. `ITEMS.0.code`).

---

## 🚀 Quick Reference & Usage Patterns

### 1. Compiling Form Specifications

```typescript
import { compileFormSpec } from "@/lib/cbs-form-spec";
import type { ModelConfigRecord, FormConfigRecord } from "@/lib/data-schemas";

// Case A: Fallback compilation (When model has no custom designer layout)
const fallbackSpec = compileFormSpec(modelRecord);
console.log(fallbackSpec.frmElements.sections.length); // 1 responsive card section

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
if (Object.keys(errors).length > 0) {
  console.error("Validation failed:", errors);
  // { balance: "Balance must be a valid number", openDate: "Open Date is required" }
}
```

### 3. Evaluating Reactive Conditions & Cascades

```typescript
import { evaluateFieldCondition, evaluateFieldCascade } from "@/lib/cbs-form-spec";

// Check interactive visibility condition (e.g. VISIBLE_WHEN / HIDDEN_WHEN)
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

## 🧪 Verification & Quality Gates

The engine is protected by a dedicated automated test harness (`scripts/verify/verify-cbs-form-spec.ts`) covering all 9 capability domains:

```bash
# Run isolated Form Spec verification suite (32 deterministic tests)
pnpm verify:form-spec

# Full quality gates (Zero errors required)
pnpm typecheck       # TypeScript compilation check
pnpm lint:fix        # Biome formatting and linting
pnpm verify:all      # All 14 master CBS domain verification harnesses
```

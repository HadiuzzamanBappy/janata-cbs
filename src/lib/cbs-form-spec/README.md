# 📋 CBS Form Spec & Compiler Engine (`@/lib/cbs-form-spec`)

A pure, deterministic compiler, layout validator, and runtime rules engine for the **Janata Core Banking Workbench**.

It bridges backend data schemas defined in **Model Config** (`SC.MODEL.CONFIG`) and visual presentation layouts created in **Form Config Designer** (`SC.FORM.CONFIG`), compiling them into a normalized, headless `CompiledFormSpec` consumed directly by `OpsForm`, `FormGrid`, and the `/api/form/[cmd]` endpoint.

---

## 📦 What It Contains

The library provides three core pure modules with zero React UI dependencies:

1. **`compileFormSpec(model, layout?)`**:
   Pure compiler that merges a `ModelConfigRecord` and an optional `FormConfigRecord` into a canonical `CompiledFormSpec`.
   - When an authorized layout is provided: compiles custom sections, visual widgets, and column spans (`layoutSource: "custom"`).
   - When no layout is provided: generates an automatic, responsive 12-column fallback grid (`layoutSource: "fallback"`).
   - Omit rule: strictly excludes properties flagged as `ARCHIVED`.

2. **`validateValues(spec, values)`**:
   Pure headless validator evaluating runtime draft values against the compiled specification:
   - Mandatory required checks (detects empty strings, `null`, `undefined`, empty arrays).
   - Numeric & amount validation (numeric strings, digit length boundaries).
   - ISO date formatting (`YYYY-MM-DD` and calendar validity).
   - Returns a clean `Record<string, string>` error map (`{}` when pristine).

3. **`colSpanForLength(prop)`**:
   Responsive grid utility calculating optimal 12-column span based on model property type and length constraints (e.g. 12 for `Textarea` or long text, 4 for short IDs, 6 for standard fields).

---

## 🏛️ Architectural Hierarchy & Invariants

```
┌─────────────────────────────────┐
│     Model Config (SC.MODEL)     │  <── Sole Authority on Data Schema
│  (Properties, Types, Rules)     │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Form Config (SC.FORM)       │  <── Pure Presentation Layer
│   (Sections, Widgets, Grid)     │      (Cannot fabricate models)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       compileFormSpec()         │  <── Pure Engine (@/lib/cbs-form-spec)
│     Produces: FormSpec          │      (Client, Server & Script Safe)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│    Runtime OpsForm / FormGrid   │  <── Consumes CompiledFormSpec
│   (Pure Dynamic Execution)      │      (Zero @fixtures, Zero Hardcoded Screens)
└─────────────────────────────────┘
```

- **Invariant 1:** Model Config is the sole authority for data schemas. Form Config only specifies visual arrangement and presentation widgets.
- **Invariant 2:** If a model has no custom form layout, `compileFormSpec(model, null)` guarantees the operator receives an immediately usable 12-column responsive form.
- **Invariant 3:** All functions are pure, side-effect-free, and execute identically on Node.js server routes, web browser clients, and test harnesses.

---

## 🚀 How to Use

### 1. Compiling a Form Specification

```typescript
import { compileFormSpec } from "@/lib/cbs-form-spec";
import type { ModelConfigRecord, FormConfigRecord } from "@/lib/data-schemas";

// Fallback compilation (No custom layout)
const fallbackSpec = compileFormSpec(modelRecord, null);
console.log(fallbackSpec.layoutSource); // "fallback"
console.log(fallbackSpec.presentation.sections.length); // 1 or more responsive sections

// Custom layout compilation
const customSpec = compileFormSpec(modelRecord, formConfigRecord);
console.log(customSpec.layoutSource); // "custom"
```

---

### 2. Validating Runtime Values on Commit

Used in `useFormState` and `useFormActions` to validate user inputs before transmitting wire payloads:

```typescript
import { validateValues } from "@/lib/cbs-form-spec";

const draftValues = {
  accountNo: "AC10001",
  balance: "invalid-amount", // will fail numeric check
  openDate: "", // will fail if required
};

const errors = validateValues(compiledSpec, draftValues);

if (Object.keys(errors).length > 0) {
  console.error("Validation failed:", errors);
  // { balance: "Balance must be a valid number", openDate: "Open Date is required" }
}
```

---

## 🛡️ Edge Cases Handled

1. **ARCHIVED Field Exclusion:**
   Model properties with `status === "ARCHIVED"` are automatically stripped from compiled specifications and flagged if present in designer layouts.
2. **Type-to-Widget Compatibility:**
   Validates that visual widgets (e.g. `amount`, `select`, `date`, `switch`) match underlying property storage types (e.g. `Number`, `Dropdown`, `Date`, `Boolean`).
3. **Empty & Null Draft Safety:**
   `validateValues(spec, null)` and `validateValues(spec, {})` safely check mandatory constraints without throwing runtime `TypeError` exceptions.
4. **Digit-Limit Constraints:**
   Checks numeric digit lengths against property `length` specifications (excluding negative signs and decimals).

---

## 🧪 Verification

Run the dedicated test suites:

```bash
# 1. Run isolated Form Spec Compiler & Validator unit tests (34 tests)
pnpm verify:form-spec

# 2. Run master end-to-end architecture verification (Phases 0-5)
pnpm verify:form-flow

# 3. Run all CBS master verification suites
pnpm verify:all
```

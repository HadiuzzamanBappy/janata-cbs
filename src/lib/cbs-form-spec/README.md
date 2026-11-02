# 📋 CBS Form Spec & Compiler Engine (`@/lib/cbs-form-spec`)

A pure, deterministic compiler, layout fallback generator, and headless runtime rules engine for the **Janata Core Banking Workbench**.

It bridges backend data schemas defined in **Model Config** (`SC.MODEL.CONFIG`) and visual presentation layouts created in **Form Config Designer** (`SC.FORM.CONFIG`), compiling them into a canonical `CompiledFormSpec` (`FormConfigRecord`) consumed by `OpsForm`, `FormRenderer`, and form state hooks.

---

## 📦 What It Contains

The library has **zero React UI dependencies**, zero legacy shims, and provides three focused functions:

1. **`compileFormSpec(model, layout?)`**:
   Pure compiler that merges a physical `ModelConfigRecord` (sole data schema authority) and an optional `FormConfigRecord` layout into a canonical `FormConfigRecord`.
   - **With Custom Layout**: Enriches layout fields with physical model properties (required flag, data type, physical length, and labels).
   - **Without Layout (Fallback)**: Automatically builds a canonical responsive 12-column card section (`sec_default`) with appropriate semantic width tokens (`xs`, `sm`, `md`, `lg`, `full`).

2. **`validateValues(spec, values)`**:
   Pure headless validator evaluating runtime draft values against the compiled specification:
   - Mandatory required checks (detects empty strings, `null`, `undefined`, and empty arrays).
   - Numeric & amount validation (numeric strings, digit boundaries).
   - ISO date formatting and calendar validity.
   - Text length limits (character boundary checks).
   - Returns a clean `Record<string, string>` error map (`{}` when pristine).

3. **`defaultWidthForLength(prop)`**:
   Responsive grid utility calculating optimal CBS semantic width tokens (`xs`, `sm`, `md`, `lg`, `full`) based on property length and width attributes.

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
│    Produces: FormConfigRecord   │      (Client, Server & Script Safe)
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     OpsForm / FormRenderer      │  <── Consumes Compiled Form Config
│   (Pure Dynamic Execution)      │      (Zero Hardcoded Field JSX)
└─────────────────────────────────┘
```

- **Invariant 1:** Model Config is the sole authority for data schemas. Form Config only specifies visual arrangement and presentation widgets.
- **Invariant 2:** If a model has no custom form layout, `compileFormSpec(model)` guarantees the operator receives an immediately usable 12-column responsive form.
- **Invariant 3:** All functions are pure, side-effect-free, and execute identically on Node.js server routes, web browser clients, and test harnesses.

---

## 🚀 How to Use

### 1. Compiling a Form Specification

```typescript
import { compileFormSpec } from "@/lib/cbs-form-spec";
import type { ModelConfigRecord, FormConfigRecord } from "@/lib/data-schemas";

// Fallback compilation (No custom layout)
const fallbackSpec = compileFormSpec(modelRecord);
console.log(fallbackSpec.frmElements.sections.length); // 1 responsive default section

// Custom layout compilation
const customSpec = compileFormSpec(modelRecord, formConfigRecord);
console.log(customSpec.title); // Layout title
```

---

### 2. Validating Runtime Values on Commit

Used in `useFormState` and `useFormActions` to validate user inputs before transmitting wire payloads:

```typescript
import { validateValues } from "@/lib/cbs-form-spec";

const draftValues = {
  accountNo: "AC10001",
  balance: "invalid-amount", // fails numeric check
  openDate: "", // fails if required
};

const errors = validateValues(compiledSpec, draftValues);

if (Object.keys(errors).length > 0) {
  console.error("Validation failed:", errors);
  // { balance: "Balance must be a valid number", openDate: "Open Date is required" }
}
```

---

## 🧪 Verification

Run the dedicated test suite:

```bash
# Run isolated Form Spec Compiler & Validator unit tests
pnpm verify:form-spec

# Run all CBS master verification suites
pnpm verify:all
```

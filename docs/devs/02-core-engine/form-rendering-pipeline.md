# ⚙️ Form Rendering Pipeline Architecture

## 1. Executive Summary & Purpose
This document details the lifecycle, execution flow, state management, and component architecture of the Dynamic Form Rendering Pipeline in `finxui-ref`.

The engine transforms parsed GMC model schemas into interactive, high-density React form controls, handling form state sync, validation, auto-calculations, and submission to the backend.

---

## 2. Rendering Pipeline Architecture

```mermaid
flowchart TD
    Payload["Raw GMC Payload (gRPC via /api/model/[cmd])"] --> Parser["Zod GMC Schema Parser (utils/schema-parser.ts)"]
    Parser --> Hook["useFormSchema Hook (hooks/use-form-schema.ts)"]
    Hook --> Host["FormScreen Host (components/form-screen.tsx)"]
    Host --> Renderer["FormGrid Layout Engine (components/form-grid.tsx)"]
    Host --> State["useFormState Hook (hooks/use-form-state.ts)"]
    Renderer --> Factory["FieldFactory (components/field-factory.tsx)"]
    Factory --> Control["shadcn/ui Control (src/components/ui)"]
```

---

## 3. Pipeline Component Responsibilities

### 1. `useFormSchema` ([src/features/screens/forms/hooks/use-form-schema.ts](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/forms/hooks/use-form-schema.ts))
- **Role:** Fetches and parses the GMC model schema for a given command ID.
- **State Ownership:** Manages schema loading, error state, and schema cache invalidation.

### 2. `FormScreen` ([src/features/screens/forms/components/form-screen.tsx](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/forms/components/form-screen.tsx))
- **Role:** Top-level host component for form rendering.
- **State Ownership:** Instantiates `useFormState`, manages form draft preservation in Zustand tab state (`useWorkbenchStore`), and handles submit button actions and header controls.

### 3. `FormGrid` ([src/features/screens/forms/components/form-grid.tsx](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/forms/components/form-grid.tsx))
- **Role:** Computes 12-column grid container layout (`grid grid-cols-12 gap-3`).
- **Responsibility:** Maps schema fields into grid cells and delegates rendering to `FieldFactory`.

### 4. `FieldFactory` ([src/features/screens/forms/components/field-factory.tsx](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/forms/components/field-factory.tsx))
- **Role:** Pure control lookup factory.
- **Responsibility:** Maps field types (`text`, `select`, `date`, `number`, `checkbox`, `textarea`) to low-level primitive design tokens in `src/components/ui/`.

---

## 4. Pipeline Rules & Best Practices

### Mandatory Rules (MUST)
- **MUST** encapsulate all control rendering inside `FieldFactory`.
- **MUST** isolate dynamic field state inside `useFormState` hook.
- **MUST** keep `FieldFactory` and `FormGrid` files strictly under **300 lines**.

### Prohibited Rules (MUST NOT)
- **MUST NOT** mutate global window state directly within field change handlers.
- **MUST NOT** trigger direct backend mutations without validating input data via Zod.

---

## 5. Verification & Extension Instructions

### Adding a New Custom Field Control
1. Update `FieldType` enum in [src/features/screens/forms/types.ts](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/forms/types.ts).
2. Add control matching branch in [field-factory.tsx](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/forms/components/field-factory.tsx).
3. Import required primitive token from `src/components/ui/`.
4. Run `pnpm typecheck` to verify complete control coverage.

---

## 6. Affected Documentation Updates
When modifying rendering pipeline components, update:
- [docs/devs/02-core-engine/form-rendering-pipeline.md](file:///d:/CBS/In_house/finx/finxui-ref/docs/devs/02-core-engine/form-rendering-pipeline.md)
- [docs/devs/02-core-engine/gmc-schema-spec.md](file:///d:/CBS/In_house/finx/finxui-ref/docs/devs/02-core-engine/gmc-schema-spec.md)


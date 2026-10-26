# 📐 CBS Data Schemas (`@/lib/data-schemas`)

The centralized Zod validation and TypeScript type-contract library for the **Janata Core Banking Workbench**.

It serves as the **Single Source of Truth** for all data entering or leaving the system: wire request envelopes, dynamic form configurations, enquiry specifications, user session models, and runtime environment validation.

---

## 📦 What It Contains

```text
src/lib/data-schemas/
├── common-schema.ts        # Universal wire request envelope (cbsWirePayloadSchema), audit models, and responses
├── env-schema.ts           # Runtime environment and secrets validation (envSchema)
├── auth-schema.ts          # Login credentials, session token contracts, and CurrentUser profile
├── form-schema.ts          # Dynamic GMC FormSchema, field definitions, sections, and tab layouts
├── form-config-schema.ts   # Form Designer Canvas and component layout schema models
├── inquiry-schema.ts       # Enquiry query parameters, filter operators, and high-density column specs
├── branch-schema.ts        # Core banking branch directory record schema (BranchRecord)
├── control-schema.ts       # System commands, alias mappings, and control table catalog models
├── user-group-schema.ts    # Role-Based Access Control (RBAC), user groups, and matrix permissions
├── menu-schema.ts          # Navigation menu item schema (MenuItem)
├── menu-catalog-schema.ts  # Flat menu item definition schema (SC.MENU)
├── menu-designer-schema.ts # Hierarchical visual menu tree schema (SC.MENU.TREE)
├── model-config-schema.ts  # Dynamic Model Builder & schema configuration models
└── index.ts                # Public barrel export
```

---

## 🏛️ Schema Architecture: Wire vs. Domain

Every banking entity has two layers defined within its schema file:
1. **Zod Runtime Schema (Validation)**: Executes runtime `.parse()` or `.safeParse()` to reject malformed wire payloads immediately.
2. **TypeScript Static Type (Compile-Time)**: Inferred automatically via `z.infer<typeof schema>` to guarantee complete end-to-end type safety without redundant type declarations.

---

## 🚀 How to Use

### 1. Pre-Flight Wire Payload Validation (`cbsWirePayloadSchema`)

Used in the HTTP client (`proxy-client.ts`) and API routes to ensure requests match the wire protocol before dispatching:

```typescript
import { cbsWirePayloadSchema } from "@/lib/data-schemas";

const result = cbsWirePayloadSchema.safeParse({
  servicePath: "default",
  requestType: "PUT",
  controlName: "ACCOUNT",
  recordFunction: "I",
  recordId: "10000001",
  data: { accountTitle: "Corporate Account" },
});

if (!result.success) {
  console.error("Invalid Wire Request:", result.error.issues);
}
```

---

### 2. Consuming Inferred Types in UI Components

Always import types directly from `@/lib/data-schemas`:

```typescript
import type { FormSchema, FormField, BranchRecord, CurrentUser } from "@/lib/data-schemas";

interface BranchDropdownProps {
  branches: BranchRecord[];
  onSelect: (branch: BranchRecord) => void;
}
```

---

### 3. Environment Fail-Fast Validation (`envSchema`)

```typescript
import { envSchema } from "@/lib/data-schemas";

// Automatically parsed at server startup in src/lib/core-config/env.ts
const validEnv = envSchema.parse(process.env);
```

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Common Wire Envelopes (`common-schema.ts`, `env-schema.ts`): **SEALED**

`cbsWirePayloadSchema`, `apiResponseSchema`, and `auditDataSchema` define the fundamental core banking wire protocol. They are finalized.

### 2. Domain Entity Schemas: **SCALABLE**

When the banking backend introduces a new table or screen model (e.g. `loan-schema.ts`):
1. Define the Zod schema:

   ```typescript
   export const loanRecordSchema = z.object({
     recordId: z.string(),
     accountNo: z.string(),
     principalAmount: z.number(),
     interestRate: z.number(),
   });
   export type LoanRecord = z.infer<typeof loanRecordSchema>;
   ```
2. Re-export in `index.ts`.
3. Create the corresponding parser in `src/lib/data-parsers/loan-parser.ts`.

---

## 🧪 Verification

Run the schema and environment verification suite:
```bash
pnpm verify:matrix
```

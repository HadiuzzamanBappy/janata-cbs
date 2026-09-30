# 🏗️ Runbook: Adding a New Domain Feature Module

## 1. Executive Summary & Purpose
This runbook provides step-by-step instructions for developers and AI agents adding a brand-new business domain module (e.g., `transfers`, `loans`, `deposits`) under `src/features/`.

All new features MUST adhere to Bulletproof React / Domain-Driven Design (DDD) rules to ensure clean isolation, zero cross-domain leaks, and strict encapsulation.

---

## 2. Step-by-Step Feature Creation Runbook

### Step 1: Create Feature Directory Structure
Create the new domain directory under `src/features/<domain-name>/`:

```text
src/features/<domain-name>/
├── index.ts               # Public API barrel export
├── types.ts               # Domain-specific TypeScript interfaces
├── schemas.ts             # Zod validation schemas
├── actions.ts             # Server Actions ("use server")
├── hooks/                 # Custom domain hooks
│   └── use-<domain>.ts
└── components/            # Domain components (Max 300 lines each)
    └── <domain>-main.tsx
```

### Step 2: Implement Zod Validation Schemas (`schemas.ts`)
Define request and response schemas:
```typescript
import { z } from "zod";

export const transferPayloadSchema = z.object({
  sourceAccount: z.string().min(1, "Source account is required"),
  targetAccount: z.string().min(1, "Target account is required"),
  amount: z.number().positive("Amount must be greater than zero"),
});

export type TransferPayload = z.infer<typeof transferPayloadSchema>;
```

### Step 3: Implement Server Actions or Route Handlers (`actions.ts`)
Create server actions or domain endpoints with session validation:
```typescript
"use server";

import { getSession } from "@/lib/redis/session";
import { transferPayloadSchema } from "./schemas";

export async function submitTransferAction(payload: unknown) {
  const session = await getSession();
  if (!session?.currUser) {
    throw new Error("Unauthorized session");
  }

  const validatedData = transferPayloadSchema.parse(payload);
  // Forward to /api/proxy or gRPC dispatch
  return { status: "SUCCESS", data: validatedData };
}
```

### Step 4: Expose Symbols in Public API Barrel (`index.ts`)
Export ONLY the symbols that external pages/components need:
```typescript
export * from "./actions";
export { TransferMain } from "./components/transfer-main";
export * from "./schemas";
export * from "./types";
```

### Step 5: Register Screen in Component Registry
If the feature provides a bespoke CBS screen override, register it in [src/features/screens/registry.tsx](file:///d:/CBS/In_house/finx/finxui-ref/src/features/screens/registry.tsx):
```typescript
"TRANSFER.EXECUTE": lazy(() => import("@/features/transfers").then(m => ({ default: m.TransferMain })))
```

---

## 3. Architectural Rules & Anti-Patterns

### Mandatory Rules (MUST)
- **MUST** export public feature symbols exclusively through `src/features/<domain>/index.ts`.
- **MUST NOT** import files directly from another feature's internal directories (e.g. `import { x } from '@/features/auth/components/login-form'`).

---

## 4. Verification & Testing

Verify feature encapsulation and build compliance:
```bash
pnpm typecheck
pnpm lint
pnpm build
```

---

## 5. Affected Documentation Updates
When creating a new domain feature, update:
- [docs/devs/05-developer-guides/adding-new-domain-feature.md](file:///d:/CBS/In_house/finx/finxui-ref/docs/devs/05-developer-guides/adding-new-domain-feature.md)
- [docs/devs/01-architecture/folder-structure.md](file:///d:/CBS/In_house/finx/finxui-ref/docs/devs/01-architecture/folder-structure.md)


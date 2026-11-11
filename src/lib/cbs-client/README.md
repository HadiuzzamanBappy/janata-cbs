# 🌐 CBS Micro-Client (`@/lib/cbs-client`)

A universal, type-safe client gateway and wire payload factory for the **Janata Core Banking Workbench**.

It acts as the single boundary between the React presentation layer and the server-side proxy (`/api/proxy`). It provides pre-flight schema validation, automatic toast alerts, session expiration detection (401), and standardized factories for all core banking operations.

---

## 📦 What It Contains

1. **`cbs.send` (`transport/proxy-client.ts`)**:
   - Type-safe HTTP fetch client dispatching payloads through `/api/proxy`.
   - Pre-flight validation against `cbsWirePayloadSchema` (requires valid UUIDv4 `idempotencyKey` on all mutation verbs via `useIdempotentSend()`, leaving reads key-free).
   - Automatic UI toast notifications for Success, Warning, and Banking Rule Rejections via `handleCbsResponseSemantics`.
   - Supports `AbortSignal` for request cancellation and runtime Zod `responseSchema` validation.

2. **Payload Factories (`payloads/`)**:
   - **`cbs.model(controlName)`**: Universal factory providing standard banking operations (`get`, `list`, `searchIds`, `getNewId`, `save`, `authorize`, `delete`, `hold`, `reverse`).
   - **`cbs.branch`**: Pre-bound model for the branch catalog (`SC_BRANCH`).
   - **`cbs.control`**: Pre-bound model for the command catalog (`SC_CONTROL`).
   - **`cbs.menu`**: Pre-bound model for the menu catalog (`SC_MENU`).
   - **`cbs.menuTree`**: Pre-bound model for hierarchical navigation trees (`SC_MENU_TREE` via `GUM`).
   - **`cbs.modelConfig`**: Dedicated metamodel builder (`GMC`, `SMC`, `AMC`) via `MODEL.CONFIG`.
   - **`cbs.formConfig`**: Dedicated form layout presentation builder (`GFC`, `SFC`) via `CONFIG.FORM`.
   - **`cbs.inquiryConfig`**: Dedicated enquiry table schema builder (`INQUIRY`).
   - **`cbs.inquiry`**: Dynamic tabular enquiry runtime query execution (`INQ`).
   - **`cbs.userSecurity`**: Password change (`CPW`).

---

## 🚀 How to Use

### 1. Unified Model Operations via `cbs.model`

Any dynamic operational table (`CUSTOMER`, `ACCOUNT`, `TELLER`, `LOAN`, etc.) uses the universal model factory:

```typescript
import { cbs } from "@/lib/cbs-client";

// Read an Account record ('GET')
const response = await cbs.send(cbs.model("ACCOUNT").get("10000001"), {
  successTitle: "Account Loaded",
});

if (response.status === "SUCCESS") {
  console.log("Account data:", response.data);
}

// Search IDs for lookups ('SBI')
const searchRes = await cbs.send(cbs.model("CUSTOMER").searchIds({ recordId: "90" }), {
  silent: true,
});

// Allocate next sequence ID ('GNI')
const newIdRes = await cbs.send(cbs.model("ACCOUNT").getNewId());
```

### 2. Save, Authorize, or Reverse Under Maker-Checker

```typescript
import { cbs } from "@/lib/cbs-client";

// Save / Commit Record ('PUT')
await cbs.send(
  cbs.model("CUSTOMER").save({ name: "John Doe", sector: "RETAIL" }, { recordId: "CUST-9901" }),
  {
    successMessage: "Customer record saved successfully",
  },
);

// Authorize pending record ('AUT')
await cbs.send(cbs.model("CUSTOMER").authorize("CUST-9901"), {
  successMessage: "Customer record authorized successfully",
});

// Reverse live record ('REV')
await cbs.send(cbs.model("CUSTOMER").reverse("CUST-9901"), {
  successMessage: "Transaction reversed",
});
```

### 3. Dynamic Inquiries with Filter Criteria

```typescript
import { cbs } from "@/lib/cbs-client";

const response = await cbs.send(
  cbs.inquiry.executeQuery("GET.BRANCH.TXNS", {
    curPage: 1,
    perPage: 25,
    queryString: [
      {
        selectFieldName: "BRANCH_CODE",
        selectFieldOperator: "EQ",
        selectFieldValue: "0101",
      },
    ],
  }),
);
```

### 4. Well-Known System Tables (Zero Hardcoding)

Use pre-bound instances for fixed core tables without hardcoding strings:

```typescript
import { cbs } from "@/lib/cbs-client";

// Fetch branch directory for switcher
const branches = await cbs.send(cbs.branch.list(), { silent: true });

// Fetch main user navigation tree (via GUM requestType)
const menuTree = await cbs.send(cbs.menuTree.get(), { silent: true });
```

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Transport Layer (`transport/proxy-client.ts`): **SEALED**

The transport mechanics are complete and finalized:

- Client-to-proxy wire routing (`/api/proxy`).
- Pre-flight Zod validation.
- Standard HTTP status code and error toast handling.
- `AbortSignal` and session expiration handling (401).
  **You do not need to modify or touch this transport layer.**

---

### 2. Payload Registration (`index.ts`): **SCALABLE**

When your core banking system introduces a new banking table or model, you **never** write new HTTP endpoints, fetch wrappers, or custom CRUD functions.

You simply call:

```typescript
cbs.model("YOUR_NEW_TABLE").get(id);
cbs.model("YOUR_NEW_TABLE").save(data);
cbs.model("YOUR_NEW_TABLE").authorize(id);
```

Or if it's a permanent core system table, register it in `index.ts` with `CbsControlTable`:

```typescript
import { CbsControlTable } from "@/types";
import { createModelPayloads } from "./payloads/base-model";

export const cbs = {
  // ...existing models
  loanProduct: createModelPayloads(CbsControlTable.LOAN_PRODUCT),
} as const;
```

---

## 🧪 Verification

Run the dedicated test suite:

```bash
pnpm verify:client
```

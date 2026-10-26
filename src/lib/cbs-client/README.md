# 🌐 CBS Micro-Client (`@/lib/cbs-client`)

A universal, type-safe client gateway and wire payload factory for the **Janata Core Banking Workbench**.

It acts as the single boundary between the React presentation layer and the server-side proxy (`/api/proxy`). It provides pre-flight schema validation, automatic toast alerts, session expiration detection (401), and standardized factories for all core banking operations.

---

## 📦 What It Contains

1. **`sendCbsRequest`** (`transport/proxy-client.ts`):
   - Type-safe HTTP fetch client dispatching payloads through `/api/proxy`.
   - Pre-flight validation against `cbsWirePayloadSchema` (fails fast on malformed requests before network calls).
   - Automatic UI toast notifications for Success, Warning, Error, and Session Expiry (401).
   - Supports `AbortSignal` for request cancellation and runtime Zod `responseSchema` validation.

2. **Payload Factories** (`payloads/`):
   - **`cbs.model(controlName)`**: Universal factory providing standard banking operations (`get`, `list`, `save`, `authorize`, `delete`, `hold`, `reverse`).
   - **`cbs.form`**: Dynamic form record actions (`fetchRecord`, `commitRecord`, `authorizeRecord`, `deleteRecord`, `holdRecord`, `reverseRecord`).
   - **`cbs.formConfig`**: Dedicated form configuration builder (`getConfig`, `saveConfig`) via `CONFIG.FORM`.
   - **`cbs.inquiry`**: Dynamic enquiry runtime execution (`executeQuery`).
   - **`cbs.userSecurity`**: Password change (`CPW`), sign-on username change (`CUN`), and reset requests.

---

## 🚀 How to Use

### 1. Unified Dispatch via `cbs.send`

Combine a payload factory with `cbs.send()` to execute operations:

```typescript
import { cbs } from "@/lib/cbs-client";

// Read an Account record
const response = await cbs.send(cbs.form.fetchRecord("ACCOUNT", "10000001"), {
  successTitle: "Account Loaded",
});

if (response.status === "SUCCESS") {
  console.log("Account data:", response.data);
}
```

### 2. Authorize or Reverse Under Maker-Checker

```typescript
import { cbs } from "@/lib/cbs-client";

// Authorize pending record
await cbs.send(cbs.form.authorizeRecord("CUSTOMER", "CUST-9901"), {
  successMessage: "Customer record authorized successfully",
});

// Reverse live record
await cbs.send(cbs.form.reverseRecord("CUSTOMER", "CUST-9901"), {
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

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Transport Layer (`transport/proxy-client.ts`): **SEALED**

The transport mechanics are complete and finalized:
- Client-to-proxy wire routing (`/api/proxy`).
- Pre-flight Zod validation.
- Standard HTTP status code and error toast handling.
- `AbortSignal` and session expiration handling.
  **You do not need to modify or touch this transport layer.**

---

### 2. Payload Registration (`index.ts`): **SCALABLE**

When your core banking system introduces a new banking table or model, you **never** write new HTTP endpoints, fetch wrappers, or custom CRUD functions.

You register it in `index.ts` with a single line:

```typescript
// Example: Adding Loan Product table
import { CbsControlTable } from "@/types";
import { createModelPayloads } from "./payloads/base-model";

export const cbs = {
  // ...existing models
  loanProduct: createModelPayloads(CbsControlTable.LOAN_PRODUCT),
} as const;
```

Once registered, all 7 operations (`get`, `list`, `save`, `authorize`, `delete`, `hold`, `reverse`) are immediately available with full TypeScript autocompletion:
```typescript
cbs.send(cbs.loanProduct.get("LOAN-1001"));
cbs.send(cbs.loanProduct.authorize("LOAN-1001"));
cbs.send(cbs.loanProduct.list());
```

---

## 🧪 Verification

Run the dedicated test suite:
```bash
pnpm verify:client
```

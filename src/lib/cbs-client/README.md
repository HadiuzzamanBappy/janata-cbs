# CBS Micro-Client Gateway (`@/lib/cbs-client`)

The **CBS Micro-Client Gateway** is the single, centralized isomorphic communication layer for the entire application. It bridges client-side React components and hooks with the Next.js BFF proxy route (`/api/proxy`) and downstream Core Banking Solution (CBS) backend services.

It delivers a **strictly typed, zero-boilerplate API** designed to build, consume, and scale backend operations without manual envelope assembly.

---

## Architecture Overview

```
src/lib/cbs-client/
├── payloads/                # Domain-specific typed payload builders
│   ├── base-model.ts        # Universal BaseModel factory template
│   ├── form.ts              # Generic Form Engine dispatcher (commit, fetch, authorize, etc.)
│   ├── inquiry.ts           # Dynamic Inquiries & Search Grids (INQ execution)
│   ├── menu.ts              # Menu Catalog (SC.MENU) & Tree Designer (SC.MENU.TREE)
│   ├── user-security.ts     # Staff security profile, credentials, and password reset
│   └── index.ts             # Payloads barrel export
├── transport/               # Wire transport, validation & error management
│   └── proxy-client.ts      # sendCbsRequest (pre-flight validation, 401 interception, toast alerts)
├── index.ts                 # Unified public facade (`cbs` singleton and default export)
└── README.md                # Gateway documentation & developer guide
```

---

## Mental Model & Core Pattern

All communication flows through a unified facade:

$$\text{Action} = \mathbf{cbs.send}(\text{payloadBuilder}(\dots), \text{options}?)$$

```typescript
import { cbs } from "@/lib/cbs-client";

// 1. Read single record
const res = await cbs.send(cbs.formConfig.get("ACCOUNT.V1"));

// 2. Commit a mutation with automatic UI toast
await cbs.send(
  cbs.userGroup.save(groupData, { recordId: "TELLER_ROLE" }),
  {
    successTitle: "Group Saved",
    successMessage: "Teller security matrix updated successfully.",
  }
);
```

### The Standard Wire Envelope
Every operation produces a strictly validated `CbsWirePayload`:
```json
{
  "servicePath": "default",
  "requestType": "PUT",
  "controlName": "SC.USER.GROUP",
  "recordFunction": "I",
  "recordId": "TELLER_ROLE",
  "authLevel": 1,
  "data": { "permissions": ["SEE", "INPUT"] }
}
```
*Note: The BFF proxy layer automatically injects `token`, `userId`, `branchCode`, and `clientId` from the authenticated HTTP-only session.*

---

## Active Subsystems

### 1. Standard Control Models (`cbs.formConfig`, `cbs.modelConfig`, `cbs.userGroup`)
Configured tables using the universal `createModelPayloads(CbsControlTable.<NAME>)` template expose a clean, uniform CRUD & Maker-Checker contract:

| Method | Request Verb | Record Function | Purpose |
| :--- | :---: | :---: | :--- |
| **`model.list(opts?)`** | `GRL` | `L` | Fetch directory / catalog of all records |
| **`model.get(id, opts?)`** | `GET` | `S` | Read single record without row lock |
| **`model.save(data, opts?)`** | `PUT` | `I` | Insert or update record (Maker draft) |
| **`model.authorize(id, opts?)`** | `AUT` | `A` | Approve pending record (Checker live promote) |
| **`model.delete(id, opts?)`** | `PUT` | `D` | Remove unauthorized record to delete table |
| **`model.hold(id, data?, opts?)`** | `HLD` | `H` | Park record draft in hold status |
| **`model.reverse(id, opts?)`** | `REV` | `R` | Reverse live accounting record with history |

#### Example:
```typescript
// Fetching a form definition:
const res = await cbs.send(cbs.formConfig.get("CUST.INDIVIDUAL"));

// Saving a user security group:
await cbs.send(cbs.userGroup.save(permissions, { recordId: "OFFICER" }));

// Authorizing a pending model config:
await cbs.send(cbs.modelConfig.authorize("GL.ACCOUNT"));
```

---

### 2. Generic Form Engine (`cbs.form`)
For dynamic, metadata-driven form screens where the target `controlName` is dynamic at runtime:

- **`cbs.form.fetchRecord(controlName, recordId, servicePath?)`** — Read record (`S`).
- **`cbs.form.commitRecord(controlName, data, opts?)`** — Commit new or amended record (`I`).
- **`cbs.form.authorizeRecord(controlName, recordId, servicePath?)`** — Maker-Checker authorize (`A`).
- **`cbs.form.deleteRecord(controlName, recordId, servicePath?)`** — Delete unapproved record (`D`).
- **`cbs.form.holdRecord(controlName, recordId, data?, servicePath?)`** — Park draft (`HLD`).
- **`cbs.form.reverseRecord(controlName, recordId, servicePath?)`** — Reverse live record (`REV`).
- **`cbs.form.listRecords(controlName, servicePath?)`** — Lookup directory rows (`GRL`).

---

### 3. Dynamic Inquiries & Search Grids (`cbs.inquiry`)
Powers dynamic search queries and column-driven data grids:

- **`cbs.inquiry.executeQuery(controlName, options?)`** — Executes criteria query (`INQ`):
  ```typescript
  const { data } = await cbs.send(
    cbs.inquiry.executeQuery("GET.CUSTOMER", {
      curPage: 1,
      perPage: 50,
      queryString: [
        { selectFieldName: "BRANCH", selectFieldOperator: "EQ", selectFieldValue: "1001" },
      ],
    }),
    { silent: true }
  );
  ```
- **`cbs.inquiry.fetchSingleRecord(controlName, recordId)`** — Fetches an enquiry item.
- Also inherits standard base methods (`.get`, `.list`, `.save`, `.authorize`) for `CbsControlTable.INQUIRY`.

---

### 4. Menu & Navigation (`cbs.menu`)
Manages flat catalog entries (`SC.MENU`) and visual hierarchical trees (`SC.MENU.TREE`):

- **Flat Menu Items**:
  - `cbs.menu.getCatalogList()` — Fetch list of menu items.
  - `cbs.menu.getMenuItem(id)` — Read specific menu item.
  - `cbs.menu.saveMenuItem(id, data)` — Commit menu definition.
  - `cbs.menu.authorizeMenuItem(id)` — Authorize menu definition.
  - `cbs.menu.deleteMenuItem(id)` — Delete menu definition.
- **Hierarchical Menu Trees**:
  - `cbs.menu.getTreeList()` — Fetch all menu trees.
  - `cbs.menu.getMenuTree(treeId?)` — Read tree structure (defaults to `"MAIN_MENU"`).
  - `cbs.menu.saveMenuTree(treeId, treeNodes)` — Save hierarchy JSON array.
  - `cbs.menu.authorizeMenuTree(treeId)` — Authorize live menu structure.
  - `cbs.menu.deleteMenuTree(treeId)` — Delete menu hierarchy.

---

### 5. Staff Security & Credentials (`cbs.userSecurity`)
Handles staff credential lifecycle and password administration:

- **`cbs.userSecurity.changePassword({ currPass, newPass, servicePath? })`** — Dispatches `CPW`.
- **`cbs.userSecurity.changeSignOnName({ oldUserName, newUserName, password, servicePath? })`** — Dispatches `CUN`.
- Inherits standard base methods (`.get`, `.save`, `.authorize`, `.delete`) for password reset table (`SC.USER.PASS.RESET`).

---

## How to Scale: Adding a New Model

You **never** need to create redundant wrapper files or boilerplate methods.

### Step 1: Add Table Name in `src/types/cbs.ts`
```typescript
export const CbsControlTable = {
  // ...
  LOAN_PRODUCT: "SC.LOAN.PRODUCT",
} as const;
```

### Step 2: Register in `src/lib/cbs-client/index.ts`
```typescript
import { CbsControlTable } from "@/types";
import { createModelPayloads } from "./payloads/base-model";

export const cbs = {
  // ...existing models
  loanProduct: createModelPayloads(CbsControlTable.LOAN_PRODUCT),
} as const;
```

### Step 3: Use Immediately in UI / Hooks
All 7 standard methods (`list`, `get`, `save`, `authorize`, `delete`, `hold`, `reverse`) are automatically available with full TypeScript autocompletion and runtime safety:
```typescript
// Read
const loan = await cbs.send(cbs.loanProduct.get("AGRI_01"));

// Commit
await cbs.send(cbs.loanProduct.save(payload, { recordId: "AGRI_01" }));

// Authorize
await cbs.send(cbs.loanProduct.authorize("AGRI_01"));
```

---

## Transport Options (`SendCbsOptions`)

`cbs.send` accepts an optional configuration object:

```typescript
export interface SendCbsOptions<T = unknown> {
  /** If true, suppresses automatic toast alerts (ideal for background queries) */
  readonly silent?: boolean;
  /** Toast alert title upon SUCCESS */
  readonly successTitle?: string;
  /** Toast alert description upon SUCCESS */
  readonly successMessage?: string;
  /** Toast alert description override upon error */
  readonly errorMessage?: string;
  /** AbortSignal to cancel in-flight HTTP requests */
  readonly signal?: AbortSignal;
  /** Runtime Zod schema to validate response data */
  readonly responseSchema?: z.ZodType<T>;
}
```

### Automatic Interceptions & Error Handling
1. **Pre-flight Validation**: Automatically validates `CbsWirePayload` before hitting the network, catching malformed payloads before making HTTP calls.
2. **Session Interception (401)**: Intercepts expired session tokens, renders a toast alert, and throws `"UNAUTHORIZED"` to trigger safe re-authentication.
3. **Response Validation**: When `responseSchema` is provided, ensures response data matches the expected type before resolving.

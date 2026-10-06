# CBS Micro-Client Gateway (`@/lib/cbs-client`)

The **CBS Micro-Client Gateway** is the single, centralized communication layer connecting UI components and screens with the downstream Core Banking Solution (CBS) backend and gRPC microservices.

It replaces ad-hoc `fetch()` calls and bespoke wire envelopes with a **strictly typed, zero-boilerplate fluent API**, standardizing request formatting, serialization, response decoding, and user notifications.

---

## Architecture Overview

```
src/lib/cbs-client/
├── contracts/               # Core Banking wire contracts & control tables
│   ├── request-types.ts     # CBS request types (GMC, GET, POST, PUT, DELETE, MNU, etc.)
│   ├── record-functions.ts  # Standard CBS functions ('I', 'S', 'A', 'D', 'R', 'H', 'L')
│   ├── control-tables.ts    # Control table names (MENU.TREE, USER.GROUP, INQUIRY, etc.)
│   ├── envelope-schema.ts   # CbsWirePayload and CbsApiResponse<T> schemas
│   └── index.ts             # Contracts barrel export
├── payloads/                # Domain-specific typed payload factories
│   ├── form-payloads.ts     # commitRecord, fetchRecord, searchRecords
│   ├── inquiry-payloads.ts  # executeQuery, fetchSchema
│   ├── menu-payloads.ts     # saveMenuHierarchy, saveMenuItem, deleteMenuItem
│   ├── user-group-payloads.ts # saveGroupPermissions, fetchGroups
│   ├── user-security-payloads.ts # resetPassword, unlockUserAccount
│   ├── cob-payloads.ts      # saveCobPipeline, triggerCobBatch
│   ├── model-config-payloads.ts # saveModelSchema, fetchModelSpec
│   └── index.ts             # Payloads barrel export
├── transport/               # HTTP wire transport & error management
│   └── proxy-client.ts      # sendCbsRequest with 401 interceptor & toast feedback
├── index.ts                 # Unified public facade (`cbs`)
└── README.md                # Documentation
```

---

## Core Concept & Syntax

All frontend requests dispatch via `cbs.send(...)` combined with a typed payload factory:

```typescript
import { cbs } from "@/lib/cbs-client";

// Format: cbs.send(payloadFactory(...), options?)
const response = await cbs.send(
  cbs.form.commitRecord("ACCOUNT", formData),
  {
    successTitle: "Account Created",
    successMessage: "Account record has been submitted successfully.",
  }
);
```

### Standard Wire Envelope Structure
Every request produced by `cbs` adheres to the canonical CBS wire format:
```json
{
  "servicePath": "default",
  "requestType": "GMC",
  "controlName": "ACCOUNT",
  "recordFunction": "I",
  "recordId": "1000001",
  "authLevel": 1,
  "data": { ... }
}
```

---

## Domain Payload Subsystems

### 1. Dynamic Forms (`cbs.form`)
- **`cbs.form.commitRecord(modelCode, data)`**  
  Commits a record creation (`recordFunction: "I"`).
- **`cbs.form.fetchRecord(modelCode, recordId)`**  
  Retrieves a record for viewing or editing (`recordFunction: "S"`).
- **`cbs.form.searchRecords(modelCode, filter)`**  
  Searches records matching criteria.

### 2. Inquiries (`cbs.inquiry`)
- **`cbs.inquiry.executeQuery(controllerName, criteria, pagination?)`**  
  Executes an inquiry query against the downstream service path (`requestType: "GET"`).
- **`cbs.inquiry.fetchSchema(inquiryCode)`**  
  Fetches inquiry grid layout and filter column definitions.

### 3. Menu & Navigation (`cbs.menu`)
- **`cbs.menu.saveMenuHierarchy(tree)`**  
  Saves the tree structure to control table `MENU.TREE`.
- **`cbs.menu.saveMenuItem(menuItem)`**  
  Creates or updates a single menu action item.
- **`cbs.menu.deleteMenuItem(itemId)`**  
  Deletes an item from the menu catalog.

### 4. User Groups & Permissions (`cbs.userGroup`)
- **`cbs.userGroup.saveGroupPermissions(groupId, permissions)`**  
  Updates the RBAC menu authorization matrix.

### 5. Staff Security & Credentials (`cbs.userSecurity`)
- **`cbs.userSecurity.resetPassword(userId, newPassword)`**  
  Resets staff credentials.
- **`cbs.userSecurity.unlockUserAccount(userId)`**  
  Clears lockout counters and unlocks user login.

### 6. Close of Business / COB (`cbs.cob`)
- **`cbs.cob.saveCobPipeline(stages)`**  
  Updates End-of-Day batch processing pipeline configuration.
- **`cbs.cob.triggerCobBatch()`**  
  Triggers immediate COB execution.

### 7. Data Dictionary & Model Config (`cbs.modelConfig`)
- **`cbs.modelConfig.saveModelSchema(modelName, schemaDef)`**  
  Saves data dictionary model fields and property constraints.

---

## Transport Options & Notifications

`cbs.send` accepts optional UI behavior options:

```typescript
export interface SendCbsOptions {
  /** If true, suppresses automatic toast alerts */
  silent?: boolean;
  /** Toast alert title upon SUCCESS */
  successTitle?: string;
  /** Toast alert description upon SUCCESS */
  successMessage?: string;
  /** Error alert override message */
  errorMessage?: string;
}
```

### Examples

#### Silent Data Fetching
```typescript
const { data } = await cbs.send(
  cbs.inquiry.executeQuery("GET.EMP.INFO", { branch: "JB9999" }),
  { silent: true }
);
```

#### Action with Confirmation Toast
```typescript
await cbs.send(
  cbs.userSecurity.unlockUserAccount("EMP0492"),
  {
    successTitle: "Account Unlocked",
    successMessage: "User EMP0492 can now sign in.",
  }
);
```

#### Automatic Session Interception
If the server responds with HTTP `401 Unauthorized`:
- Automatically triggers a `"Session Expired"` toast notification.
- Rejects the promise with an `"UNAUTHORIZED"` error to initiate re-authentication.

---

## Type Safety & Contracts

All contracts and enum definitions can be imported directly:

```typescript
import {
  type CbsWirePayload,
  type CbsApiResponse,
  type RecordFunction,
  type CbsRequestType,
  CONTROL_TABLES,
} from "@/lib/cbs-client";
```

# CBS Micro-Client Gateway (`@/lib/cbs-client`)

The **CBS Micro-Client Gateway** is the single, centralized isomorphic communication layer connecting client-side components and hooks with the Next.js proxy route (`/api/proxy`) and downstream Core Banking Solution (CBS) backend.

It provides a **strictly typed, zero-boilerplate API**, standardizing request formatting, wire envelope serialization, session expiration interception, and user notifications.

---

## Architecture Overview

```
src/lib/cbs-client/
├── payloads/                # Domain-specific typed payload builders
│   ├── form.ts              # formPayloads (commitRecord, fetchRecord, authorizeRecord, deleteRecord)
│   ├── inquiry.ts           # inquiryPayloads (executeQuery, fetchSingleRecord, getInquiryConfig, ...)
│   ├── menu.ts              # menuPayloads (getCatalogList, getMenuItem, getMenuTree, saveMenuTree, ...)
│   ├── model-config.ts      # modelConfigPayloads (getModelConfig, listModelConfigs, saveModelConfig, ...)
│   ├── user-group.ts        # userGroupPayloads (getGroup, saveGroup, authorizeGroup, deleteGroup)
│   ├── user-security.ts     # userSecurityPayloads (getUserProfile, changeSignOnName, changePassword, ...)
│   └── index.ts             # Payloads barrel export
├── transport/               # HTTP wire transport & error management
│   └── proxy-client.ts      # sendCbsRequest with 401 interception & toast notifications
├── types/                   # Canonical CBS wire contracts & control tables
│   ├── control-tables.ts    # CbsControlTable constants & type
│   ├── request-types.ts     # CbsRequestType verbs ('GET', 'PUT', 'INQ', 'AUT', etc.)
│   ├── wire.ts              # CbsWirePayload and DEFAULT_SERVICE_PATH
│   └── index.ts             # Types barrel export
├── index.ts                 # Unified public facade (`cbs` and default export)
└── README.md                # Gateway documentation
```

---

## Core Usage & Syntax

All client operations dispatch via `cbs.send(...)` combined with a domain payload builder:

```typescript
import { cbs } from "@/lib/cbs-client";

// Format: cbs.send(payloadBuilder(...), options?)
const response = await cbs.send(
  cbs.form.commitRecord("ACCOUNT", formData),
  {
    successTitle: "Account Created",
    successMessage: "Account record has been submitted successfully.",
  }
);
```

### Standard Wire Envelope Structure
Every request produced by `cbs` conforms to the canonical wire contract:
```typescript
{
  servicePath: "default",
  requestType: "PUT",
  controlName: "ACCOUNT",
  recordFunction: "I",
  recordId: "1000001",
  authLevel: 1,
  data: { ... }
}
```

---

## Domain Payload Subsystems

### 1. Dynamic Forms (`cbs.form`)
- **`cbs.form.fetchRecord(controlName, recordId, servicePath?)`** — Fetches record data (`recordFunction: 'S'`).
- **`cbs.form.commitRecord(controlName, data, options?)`** — Creates or updates a record (`recordFunction: 'I'`).
- **`cbs.form.authorizeRecord(controlName, recordId, servicePath?)`** — Authorizes a pending record (`recordFunction: 'A'`).
- **`cbs.form.deleteRecord(controlName, recordId, servicePath?)`** — Deletes or reverses a record (`recordFunction: 'D'`).

### 2. Inquiries (`cbs.inquiry`)
- **`cbs.inquiry.executeQuery(controlName, options?)`** — Executes a dynamic grid search query (`requestType: 'INQ'`).
- **`cbs.inquiry.fetchSingleRecord(controlName, recordId)`** — Fetches a single enquiry record.
- **`cbs.inquiry.getInquiryConfig(inquiryId)`** — Retrieves metadata definition for an enquiry.
- **`cbs.inquiry.saveInquiryConfig(inquiryId, data)`** — Saves enquiry configuration.
- **`cbs.inquiry.authorizeInquiryConfig(inquiryId)`** — Authorizes an enquiry definition.
- **`cbs.inquiry.deleteInquiryConfig(inquiryId)`** — Decommissions an enquiry.

### 3. Menu & Navigation (`cbs.menu`)
- **`cbs.menu.getCatalogList()`** — Fetches all flat menu items (`controlName: 'MENU'`).
- **`cbs.menu.getMenuItem(menuId)`** — Fetches an individual menu record.
- **`cbs.menu.saveMenuItem(menuId, data)`** — Commits a menu record.
- **`cbs.menu.authorizeMenuItem(menuId)`** — Authorizes a menu record.
- **`cbs.menu.deleteMenuItem(menuId)`** — Deletes a menu record.
- **`cbs.menu.getTreeList()`** — Fetches list of all menu tree configs (`controlName: 'MENU.TREE'`).
- **`cbs.menu.getMenuTree(treeId?)`** — Fetches full hierarchical menu tree.
- **`cbs.menu.saveMenuTree(treeId, treeNodes)`** — Saves hierarchical menu tree.
- **`cbs.menu.authorizeMenuTree(treeId)`** — Authorizes a menu tree.
- **`cbs.menu.deleteMenuTree(treeId)`** — Deletes a menu tree.

### 4. User Groups & Permissions (`cbs.userGroup`)
- **`cbs.userGroup.getGroup(groupId)`** — Fetches a group record or list (`controlName: 'USER.GROUP'`).
- **`cbs.userGroup.saveGroup(groupId, data)`** — Commits user group permission matrix.
- **`cbs.userGroup.authorizeGroup(groupId)`** — Authorizes a user group.
- **`cbs.userGroup.deleteGroup(groupId)`** — Decommissions a user group.

### 5. Staff Security & Credentials (`cbs.userSecurity`)
- **`cbs.userSecurity.getUserProfile(userId)`** — Fetches security profile (`controlName: 'USER.PASS.RESET'`).
- **`cbs.userSecurity.saveUserProfile(userId, data)`** — Commits reset or unlock profile.
- **`cbs.userSecurity.authorizeUserProfile(userId)`** — Authorizes credential reset.
- **`cbs.userSecurity.deleteUserProfile(userId)`** — Cancels credential reset request.
- **`cbs.userSecurity.changeSignOnName(params)`** — Dispatches sign-on name update (`requestType: 'CUN'`).
- **`cbs.userSecurity.changePassword(params)`** — Dispatches password update (`requestType: 'CPW'`).

### 6. Data Dictionary & Model Config (`cbs.modelConfig`)
- **`cbs.modelConfig.getModelConfig(modelId)`** — Fetches schema definition (`controlName: 'MODEL.CONFIG'`).
- **`cbs.modelConfig.listModelConfigs()`** — Fetches catalog of all configured models.
- **`cbs.modelConfig.saveModelConfig(modelId, data)`** — Commits model definition.
- **`cbs.modelConfig.authorizeModelConfig(modelId)`** — Authorizes live schema definition.
- **`cbs.modelConfig.deleteModelConfig(modelId)`** — Decommissions schema definition.

---

## Transport Options & Notifications

`cbs.send` accepts `SendCbsOptions`:

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
  /** Optional AbortSignal to cancel in-flight requests */
  signal?: AbortSignal;
}
```

### Examples

#### Silent Data Fetching
```typescript
const { data } = await cbs.send(
  cbs.inquiry.executeQuery("%ACCOUNT", { perPage: 25 }),
  { silent: true }
);
```

#### Action with Notification
```typescript
await cbs.send(
  cbs.userSecurity.changePassword({ currPass, newPass }),
  {
    successTitle: "Password Changed",
    successMessage: "Your password has been updated successfully.",
  }
);
```

#### Automatic Session Interception
When the server responds with HTTP `401 Unauthorized`:
- Renders an automatic `"Session Expired"` toast notification.
- Rejects with an `"UNAUTHORIZED"` error to prompt re-authentication.

---

## Direct Barrel Exports

In addition to `cbs`, all types and builders can be imported directly:

```typescript
import {
  cbs,
  sendCbsRequest,
  CbsControlTable,
  CbsRequestType,
  DEFAULT_SERVICE_PATH,
  type CbsWirePayload,
  type SendCbsOptions,
} from "@/lib/cbs-client";
```

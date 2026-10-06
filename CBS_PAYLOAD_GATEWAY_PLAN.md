# FinX CBS — Enterprise Micro-Client & Centralized Payload Architecture
> **Comprehensive System Audit & Implementation Plan**  
> *Authoritative blueprint tailored to FinX-UI's exact gRPC/REST gateway, Redis session layer, App Router API routes, and 30+ CBS feature call sites.*

---

## 1. Concrete System Audit: Where & How Payloads Exist in FinX Today

An exhaustive codebase audit of `src/` revealed **4 distinct payload channels** that currently bypass centralization:

### A. The Universal Proxy Wire Channel (`/api/proxy` & `src/lib/grpc/dispatch.ts`)
FinX uses an **Envelope Pattern** defined in `src/types/api.ts`:
```ts
export interface Envelope {
  servicePath: string;        // "default" (gRPC) or microservice routing ("urm", "customer")
  requestType: string;        // CBS Wire verb ("GRL", "GET", "PUT", "AUT", "DEL", "INQ", "CUN", "CPW")
  controlName?: string;       // Target Application/Table ("MENU", "USER.GROUP", "COB.REGISTRY", "?")
  branchCode: string;         // User branch or NEXT_PUBLIC_CENTRAL_BRANCH
  recordFunction: string;     // Temenos T24 operation ("S"=See, "I"=Input, "A"=Auth, "L"=List, "R"=Reverse)
  recordId: string;           // Target Record ID / CIF / Account No
  authLevel: number;          // 1 (Standard) to 4 (Supervisor/Authorizer)
  userId: string;             // Staff User ID
  clientId: string;           // CLIENT_ID (e.g., "WEB-CLIENT")
  data: Record<string, unknown>; // Domain body (form fields, query strings, tree nodes)
}
```

### B. Special Backend Microservice Conversions in `dispatch.ts`
`src/lib/grpc/dispatch.ts` contains **automatic request type re-mapping** based on `controlName`:
- When `controlName` contains `"USER"` and `requestType === "AUT"` &rarr; re-mapped to `"UAU"` (User Authorize).
- When `controlName` contains `"FUNDS.TRANSFER"` &rarr; re-mapped to `"AFT"` (Account Funds Transfer).
- When `controlName` contains `"CASH.TRANSFER"` &rarr; re-mapped to `"ACT"` (Account Cash Transfer).
- When `servicePath !== "default"` &rarr; routed to downstream REST microservices (`SERVICE_CUSTOMER_BASE_URL`, `SERVICE_URM_BASE_URL`).

### C. Dedicated App Route Call Sites (Bypassing Proxy)
- `/api/inquiry/[code]` &rarr; Fetches dynamic enquiry schema definitions.
- `/api/model/[code]` &rarr; Fetches dynamic GMC form schemas.
- `/api/menu` &rarr; Retrieves hierarchical navigation menu.
- `/api/login` & `/api/logout` &rarr; Session credential lifecycle.
- `/api/change-password` &rarr; Staff credential self-service.

### D. 30+ Fragmented Call Sites in Feature Hooks
Every custom screen hook currently repeats manual `fetch(appConfig.routes.api.proxy)` calls with hardcoded strings:
- `use-menu-catalog.ts` &rarr; `"GRL"`, `"MENU"`, `"L"` | `"GET"`, `"S"` | `"PUT"`, `"I"` | `"AUT"`, `"A"`
- `use-menu-designer.ts` &rarr; `"GET"`, `"MENU.TREE"`, `"S"` | `"PUT"`, `"I"` | `"AUT"`, `"A"`
- `use-user-group.ts` &rarr; `"GET"`, `"USER.GROUP"`, `"S"` | `"PUT"`, `"I"` | `"AUT"`, `"A"`
- `use-model-config.ts` &rarr; `"GET"`, `"MODEL.CONFIG"`, `"S"` | `"PUT"`, `"I"` | `"AUT"`, `"A"`
- `use-cob-registry.ts` &rarr; `"GET"`, `"COB.REGISTRY"`, `"S"` | `"PUT"`, `"I"` | `"AUT"`, `"A"`
- `use-user-pass-reset.ts` &rarr; `"GET"`, `"USER.PASS.RESET"`, `"S"` | `"PUT"`, `"I"` | `"AUT"`, `"A"`
- `inquiry-screen.tsx` &rarr; `"INQ"`, `queryString: [{ selectFieldName, selectFieldOperator, selectFieldValue }]`
- `form-screen.tsx` &rarr; `"PUT"`, `controlName: schema.code`, `"I"` | `"INQ"`, `"S"`
- `security-tab.tsx` &rarr; `"CUN"`, `controlName: "?"` | `"CPW"`, `controlName: "?"`

---

## 2. The Architectural Target: `src/lib/cbs-client/`

We construct a **microservice client package** under `src/lib/cbs-client/` that integrates cleanly with `src/lib/config` and `src/types/api.ts`:

```
src/lib/cbs-client/
│
├── contracts/                         # 1. ENUMS, CONSTANTS & PROTOCOL SCHEMAS
│   ├── request-types.ts               #    GRL, GET, PUT, AUT, DEL, HLD, INQ, CUN, CPW, GUM, UAU, AFT, ACT
│   ├── record-functions.ts            #    S (See), I (Input), A (Auth), D (Del), L (List), R (Reverse)
│   ├── control-tables.ts              #    MENU, MENU.TREE, USER.GROUP, COB.REGISTRY, MODEL.CONFIG, etc.
│   └── envelope-schema.ts             #    Zod schemas validating outbound payloads & API responses
│
├── payloads/                          # 2. DOMAIN PAYLOAD FACTORIES (Pure, Isolated Builders)
│   ├── menu-payloads.ts               #    Catalog list, tree save, tree authorize
│   ├── user-group-payloads.ts         #    Matrix get, save, authorize
│   ├── user-security-payloads.ts      #    Staff password reset, account unlock, change sign-on (CUN/CPW)
│   ├── cob-payloads.ts                #    Stage advance, batch run, authorization
│   ├── model-config-payloads.ts       #    Data dictionary schema get, put, auth
│   ├── inquiry-payloads.ts            #    Grid query with queryString formatting
│   ├── form-payloads.ts               #    Universal CRUD payload generation
│   └── index.ts                       #    Single barrel export for all payload creators
│
├── transport/                         # 3. TRANSPORT ENGINE (Type-safe Fetcher & Interceptors)
│   ├── proxy-client.ts                #    cbsClient.send(payload, options)
│   ├── interceptors.ts                #    401 unauth redirect, toast notifications, latency timing
│   └── types.ts                       #    SendOptions, TransportResult<T>
│
└── index.ts                           # PUBLIC SDK ENTRY POINT
```

---

## 3. Detailed Specification of the 3 Layers

### Layer 1: Protocol Contracts (`src/lib/cbs-client/contracts/`)
Completely removes string literals from UI code.

```ts
// src/lib/cbs-client/contracts/request-types.ts
export const CbsRequestType = {
  // Common CBS CRUD Operations
  RECORD_LIST: "GRL",
  RECORD_GET: "GET",
  RECORD_PUT: "PUT",
  RECORD_AUTH: "AUT",
  RECORD_DEL: "DEL",
  RECORD_HOLD: "HLD",
  RECORD_REVERSE: "REV",

  // Specialized CBS Verbs
  INQUIRY_EXEC: "INQ",
  MENU_TREE: "GUM",
  USER_AUTH: "UAU",
  ACCOUNT_FUNDS_TRANSFER: "AFT",
  ACCOUNT_CASH_TRANSFER: "ACT",

  // Staff Account & Security Verbs
  CHANGE_USER_NAME: "CUN",
  CHANGE_PASSWORD: "CPW",
} as const;

export type CbsRequestType = (typeof CbsRequestType)[keyof typeof CbsRequestType];

// src/lib/cbs-client/contracts/record-functions.ts
export const CbsRecordFunction = {
  SEE: "S",
  INPUT: "I",
  AUTHORIZE: "A",
  DELETE: "D",
  LIST: "L",
  REVERSE: "R",
} as const;

export type CbsRecordFunction = (typeof CbsRecordFunction)[keyof typeof CbsRecordFunction];

// src/lib/cbs-client/contracts/control-tables.ts
export const CbsControlTable = {
  MENU: "MENU",
  MENU_TREE: "MENU.TREE",
  USER_GROUP: "USER.GROUP",
  USER_PASS_RESET: "USER.PASS.RESET",
  COB_REGISTRY: "COB.REGISTRY",
  MODEL_CONFIG: "MODEL.CONFIG",
  INQUIRY: "INQUIRY",
} as const;
```

---

### Layer 2: Domain Payload Factories (`src/lib/cbs-client/payloads/`)
Every domain has an isolated builder file. If a backend request structure changes, **you edit only that single file**.

#### Example: `menu-payloads.ts`
```ts
import { CbsControlTable } from "../contracts/control-tables";
import { CbsRecordFunction } from "../contracts/record-functions";
import { CbsRequestType } from "../contracts/request-types";
import type { CbsWirePayload } from "../contracts/envelope-schema";

export const menuPayloads = {
  /** Fetch all active flat menu catalog items */
  getCatalogList: (): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_LIST,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.LIST,
    recordId: "",
  }),

  /** Get specific menu item definition */
  getMenuItem: (menuId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.SEE,
    recordId: menuId,
  }),

  /** Save menu catalog record */
  saveMenuItem: (menuId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: menuId,
    data,
  }),

  /** Save menu hierarchy tree structure */
  saveMenuTree: (treeId: string, treeData: unknown): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: treeId,
    data: { tree: treeData },
  }),

  /** Authorize modified menu tree (Maker-Checker) */
  authorizeMenuTree: (treeId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: treeId,
  }),
};
```

#### Example: `inquiry-payloads.ts`
```ts
import { CbsRequestType } from "../contracts/request-types";
import { CbsRecordFunction } from "../contracts/record-functions";
import type { CbsWirePayload } from "../contracts/envelope-schema";
import type { SelectionOperand } from "@/lib/schemas";

export const inquiryPayloads = {
  /** Format standard CBS grid execution query payload */
  executeQuery: (params: {
    controlName: string;
    criteria: Record<string, { value: string; operand: SelectionOperand; fieldType?: string }>;
    page: number;
    pageSize: number;
  }): CbsWirePayload => {
    const queryString = Object.entries(params.criteria)
      .filter(([_, f]) => Boolean(f.value?.trim()))
      .map(([fieldId, f]) => ({
        selectFieldName: fieldId,
        selectFieldType: f.fieldType || "text",
        selectFieldOperator: f.operand,
        selectFieldValue: f.value.trim(),
      }));

    return {
      servicePath: "default",
      requestType: CbsRequestType.INQUIRY_EXEC,
      controlName: params.controlName,
      recordFunction: CbsRecordFunction.SEE,
      recordId: "",
      data: {
        queryString,
        curPage: params.page,
        perPage: params.pageSize,
      },
    };
  },
};
```

---

### Layer 3: Unified Transport Client (`src/lib/cbs-client/transport/proxy-client.ts`)
A single, bullet-proof fetch gateway that replaces repetitive `fetch(appConfig.routes.api.proxy)` across all screens:

```ts
import { appConfig } from "@/lib/config";
import { toast } from "@/components/ui/toast";
import type { APIResponse } from "@/types";
import type { CbsWirePayload } from "../contracts/envelope-schema";

export interface SendCbsOptions {
  silent?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

export async function sendCbsRequest<T = unknown>(
  payload: CbsWirePayload,
  options?: SendCbsOptions,
): Promise<APIResponse<T>> {
  try {
    const res = await fetch(appConfig.routes.api.proxy, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      toast.add({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        type: "error",
      });
      throw new Error("UNAUTHORIZED");
    }

    const json = (await res.json()) as APIResponse<T>;

    if (json.status === "SUCCESS" && options?.successMessage) {
      toast.add({
        title: "Success",
        description: options.successMessage,
        type: "success",
      });
    }

    return json;
  } catch (err) {
    if (!options?.silent) {
      toast.add({
        title: "CBS Error",
        description:
          options?.errorMessage ||
          (err instanceof Error ? err.message : "CBS Gateway Communication Failed"),
        type: "error",
      });
    }
    throw err;
  }
}

export const cbsClient = {
  send: sendCbsRequest,
};
```

---

## 4. Before & After: Developer Code Comparison

### In `src/features/system/user-group/hooks/use-user-group.ts`
**Before (25 lines of noisy boilerplate):**
```ts
const res = await fetch(appConfig.routes.api.proxy, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    servicePath: "default",
    requestType: "AUT",
    controlName: "USER.GROUP",
    recordFunction: "A",
    recordId,
  }),
});
const json = await res.json();
if (json.status === "SUCCESS") {
  toast.add({ title: "Authorized", description: "...", type: "success" });
  setMode("VIEW");
}
```

**After (3 lines of clean, self-documenting code):**
```ts
const json = await cbsClient.send(userGroupPayloads.authorize(recordId), {
  successMessage: `Authorized live user group #${recordId}`,
});
if (json.status === "SUCCESS") setMode("VIEW");
```

---

## 5. Execution & Migration Phases

### Phase 1: SDK Foundation (`src/lib/cbs-client/`)
- [ ] Create `contracts/` (`request-types.ts`, `record-functions.ts`, `control-tables.ts`, `envelope-schema.ts`).
- [ ] Create `transport/` (`proxy-client.ts`, `interceptors.ts`, `types.ts`).
- [ ] Create domain payload modules in `payloads/` (`menu-payloads.ts`, `user-group-payloads.ts`, `user-security-payloads.ts`, `cob-payloads.ts`, `model-config-payloads.ts`, `inquiry-payloads.ts`, `form-payloads.ts`).
- [ ] Export everything via clean barrel in `src/lib/cbs-client/index.ts`.

### Phase 2: Feature Migration (Non-Breaking, File by File)
- [ ] Migrate `features/system/menu-catalog` and `menu-designer`.
- [ ] Migrate `features/system/user-group` and `user-pass-reset`.
- [ ] Migrate `features/system/cob-registry` and `model-config`.
- [ ] Migrate `features/system/inquiry-designer`.
- [ ] Migrate `features/screens/inquiries` and `features/screens/forms`.
- [ ] Migrate `features/settings/components/security-tab.tsx`.

### Phase 3: Validation & Quality Control
- [ ] `pnpm biome check --write` &mdash; 0 errors, 0 warnings.
- [ ] `pnpm tsc --noEmit` &mdash; 0 type errors across the entire project.
- [ ] Verify hot-reload on running dev server.

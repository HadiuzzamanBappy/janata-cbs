# 🧪 CBS Mock Services: In-Memory Core Banking Simulator (`@/lib/mock-services`)

A high-fidelity, in-memory **Core Banking Protocol Simulator** for the **Janata Core Banking Workbench**.

It powers the system when running in static mode (`DATA_SOURCE="static"` in `.env.local`), providing a 100% offline simulation of the CBS Core backend with **zero network sockets**, **zero external database dependencies**, and **exact wire protocol parity**.

---

## 📦 What It Contains

```text
src/lib/mock-services/
├── database-router.ts       # Resolves logical controlName to canonical CBS_DATABASE tables
├── operation-handlers.ts    # Pattern-based protocol handlers for CBS verbs (GUM, GMC, GRL, etc.)
├── auth-simulator.ts        # User authentication & JWT token generation from SYS_USER
├── response-factory.ts      # Standardized response envelopes (200, 404, 401, GrpcResponse)
├── index.ts                 # Public barrel: mockLogin, mockProcess, mockDispatch, getMockProxyResponse
└── README.md                # Documentation & architectural reference
```

---

## ⚙️ Core Architecture & Execution Flow

```mermaid
flowchart TD
    Client["Transport Interceptor (@/lib/infra-grpc)<br/>(loginProcess, grpcProcess, dispatch)"]
    
    Client --> Route["mock-services/index.ts<br/>(Request Dispatcher)"]

    Route -- "loginProcess" --> Auth["auth-simulator.ts<br/>(SYS_USER Authentication & Token Generation)"]
    Route -- "grpcProcess / dispatch" --> Op["operation-handlers.ts<br/>(RequestType Verb Router)"]

    Op -- "Table Query (GRL, GET)" --> Router["database-router.ts<br/>(Physical Table Resolver)"]
    Op -- "Menu (GUM)" --> Menu["SC_MENU_TREE_LIVE"]
    Op -- "Model Spec (GMC)" --> Model["SC_MODEL_CONFIG_LIVE"]
    Op -- "Inquiry (INQ)" --> Inq["SC_INQUIRY_CONFIG_LIVE"]
    Op -- "Next ID (GNI)" --> Seq["model.idDef.idPrefix"]
    Op -- "Mutations (PUT, AUT...)" --> Mut["Lifecycle Status (AU, HLD, DEL)"]

    Router --> DB[("CBS_DATABASE<br/>(fixtures/*.ts)")]
    
    Auth --> Resp["response-factory.ts"]
    DB --> Resp
    Resp --> Wire["Standard GrpcResponse / ApiResponse"]
```

---

## 🎯 Supported Core Protocol Verbs

Every operation follows canonical CBS request verbs without requiring ad-hoc alias maps or fuzzy guessing:

| Request Verb | Operation | Source / Handler | Returns |
|---|---|---|---|
| **`GUM`** | Get User Menu | `handleGetMenu()` | Hierarchical navigation tree from `SC_MENU_TREE` |
| **`GMC`** | Get Model Configuration | `handleGetModelConfig()` | Dynamic form & column definition from `SC_MODEL_CONFIG` |
| **`INQ`** | Execute Inquiry Query | `handleInquiry()` | Query rows matching target model from `SC_INQUIRY_CONFIG` |
| **`GRL`** | Generic Record List | `handleRecordList()` | Complete record collection (`table.LIST`) for `controlName` |
| **`GET`** | Get Single Record | `handleGetRecord()` | Exact record by ID (`table.LIVE[recordId]`) |
| **`GNI`** | Get Next ID Sequence | `handleNextId()` | Next sequential ID formatted with `idDef.idPrefix` |
| **`PUT`** | Create / Update Record | `handleMutation()` | In-memory record with `RECORD_STATUS: "INA"` |
| **`AUT`** | Authorize Record | `handleMutation()` | In-memory record with `RECORD_STATUS: "AU"` |
| **`DEL`** | Delete Record | `handleMutation()` | In-memory record with `RECORD_STATUS: "DEL"` |
| **`HLD`** | Hold Record | `handleMutation()` | In-memory record with `RECORD_STATUS: "HLD"` |
| **`REV`** | Reverse Record | `handleMutation()` | In-memory record with `RECORD_STATUS: "REV"` |

---

## 🗄️ Two-Tier Model to Physical Database Routing

In Core Banking, the frontend passes a logical `controlName` (e.g. `ACCOUNT`, `CUSTOMER`). The database router resolves this to the physical database table (`AC_ACCOUNT`, `CUST_CUSTOMER`) automatically:

```typescript
import { resolveTable } from "@/lib/mock-services/database-router";

// Automatically resolves 'ACCOUNT' -> 'AC_ACCOUNT' via SC_MODEL_CONFIG
const table = resolveTable("ACCOUNT");

if (table) {
  console.log("Physical table:", table.name); // 'AC_ACCOUNT'
  console.log("Records available:", table.getList().length);
}
```

---

## 🚀 How to Use

### 1. In Transport Layer (`@/lib/infra-grpc`)

Domain services call standard gRPC methods without knowing they are being intercepted:

```typescript
// Inside src/lib/infra-grpc/client.ts
import { isStaticMode } from "./client";
import { mockLogin, mockProcess } from "@/lib/mock-services";

export async function grpcProcess(req: GrpcRequest): Promise<GrpcResponse> {
  if (isStaticMode()) {
    return mockProcess(req);
  }
  // Otherwise, live HTTP/2 gRPC channel
  return liveClient.Process(req);
}
```

### 2. In Direct Server-Side Simulation

```typescript
import { getMockProxyResponse } from "@/lib/mock-services";

// Fetch list of Accounts
const accountList = getMockProxyResponse("GRL", "ACCOUNT");

// Fetch single Customer by ID
const customer = getMockProxyResponse("GET", "CUSTOMER", "CU1001");

// Generate Next ID for Account opening
const nextId = getMockProxyResponse("GNI", "ACCOUNT");
```

---

## 📈 How to Scale in the Future

The architecture is strictly data-driven:

* **To add a new business table (e.g. `LOAN`)**:
  1. Add `LN_LOAN.ts` in [`fixtures/`](file:///d:/Work/React/cbs/janata-cbs/fixtures/).
  2. Add `LOAN: LN_LOAN_TABLE` to `CBS_DATABASE` in [`fixtures/index.ts`](file:///d:/Work/React/cbs/janata-cbs/fixtures/index.ts).
  3. **Zero code changes needed in `mock-services`**! The database router immediately discovers and serves it.

* **To add a new CBS protocol verb (e.g. `VAL` for field validation)**:
  1. Add `handleValidation()` in [`operation-handlers.ts`](file:///d:/Work/React/cbs/janata-cbs/src/lib/mock-services/operation-handlers.ts).
  2. Map `reqType === "VAL"` in [`index.ts`](file:///d:/Work/React/cbs/janata-cbs/src/lib/mock-services/index.ts).

---

## 🧪 Verification & Testing

Run the dedicated 33-test suite covering authentication, gRPC simulation, and proxy CRUD matrices:

```bash
pnpm tsx scripts/verify-mock-service.ts
```

Run all system verification suites:

```bash
pnpm run verify:all
```

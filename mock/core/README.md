# 🧪 CBS Mock Core (`@mock/core`)

In-memory Core Banking protocol simulator for offline development (`DATA_SOURCE="static"` or `MOCK_CBS="true"`). Provides zero-socket simulation with strict wire parity to live gRPC endpoints.

---

## 📦 Directory Map

```text
mock/core/
├── auth-simulator.ts     # User authentication & token creation from SC_USER
├── database-router.ts    # Resolves controlName to physical tables via SC_MODEL_CONFIG
├── response-factory.ts   # Standardized envelopes (200, 404, 401, GrpcResponse)
├── handlers/             # Domain protocol handlers partitioned by CBS verb
│   ├── menu-handlers.ts      # GUM, GCM (Navigation tree)
│   ├── model-handlers.ts     # GMC, GFC (Metamodels & form specs)
│   ├── inquiry-handlers.ts   # INQ (Dynamic tabular inquiry executions)
│   ├── query-handlers.ts     # GET, S, GRL, SBI, RIL (Read, list & search)
│   └── mutation-handlers.ts  # PUT, AUT, DEL, HLD, REV, GNI (Mutations & IDs)
└── index.ts              # Public entry: mockLogin, mockProcess, mockDispatch, getMockProxyResponse
```

---

## 🎯 Supported Protocol Verbs & Handler Mapping

Requests dispatch dynamically by `requestType` to modular domain handlers:

| Verb(s)                         | Category            | Handler File           | Implementation           | Target Source                      |
| :------------------------------ | :------------------ | :--------------------- | :----------------------- | :--------------------------------- |
| **`GUM`**, **`GCM`**            | Navigation Menu     | `menu-handlers.ts`     | `handleGetMenu()`        | `SC_MENU_TREE`                     |
| **`GMC`**                       | Model Spec          | `model-handlers.ts`    | `handleGetModelConfig()` | `SC_MODEL_CONFIG`                  |
| **`GFC`**                       | Form Layout         | `model-handlers.ts`    | `handleGetFormConfig()`  | `SC_FORM_CONFIG`                   |
| **`INQ`**                       | Dynamic Inquiry     | `inquiry-handlers.ts`  | `handleInquiry()`        | `SC_INQUIRY_CONFIG` + Target Table |
| **`GET`**, **`S`**, **`GRV`**   | Read Record         | `query-handlers.ts`    | `handleSeeRecord()`      | Target Table `LIVE`                |
| **`GRL`**, **`GCQ`**, **`GMV`** | List Records        | `query-handlers.ts`    | `handleRecordList()`     | Target Table `getList()`           |
| **`SBI`**, **`RIL`**            | Search / ID List    | `query-handlers.ts`    | `handleSearchById()`     | Target Table `getIdList()`         |
| **`GNI`**                       | Sequence / Draft ID | `mutation-handlers.ts` | `handleNextId()`         | Model `IDDEF` or user ID           |
| **`PUT`**, **`SMC`**, **`SFC`** | Save Draft (Maker)  | `mutation-handlers.ts` | `handleMutation()`       | Writes `recStatus: "INA"`          |
| **`AUT`**, **`AMC`**            | Authorize (Checker) | `mutation-handlers.ts` | `handleMutation()`       | Writes `recStatus: "AU"`           |
| **`DEL`**, **`REV`**, **`HLD`** | Delete / Reverse    | `mutation-handlers.ts` | `handleMutation()`       | Status `"DEL"`, `"REV"`, `"HLD"`   |

---

## 🗄️ Database Resolution (`database-router.ts`)

Translates client `controlName` into physical table accessors via `SC_MODEL_CONFIG`:

```typescript
import { resolveTable } from "@mock/core/database-router";

const table = resolveTable("CONFIG.FORM"); // Resolves to SC_FORM_CONFIG

if (table) {
  const records = table.getList("LIVE"); // Array of live records
  const ids = table.getIdList("AC*"); // Matching record IDs
  const liveRec = table.LIVE["ACCOUNT,1.0.0"];
}
```

---

## 🚀 Execution Points

### 1. Transport Interception (`@/lib/infra-grpc`)

Intercepts gRPC calls during static/mock execution:
```typescript
import { isStaticMode } from "./client";
import { mockLogin, mockProcess } from "@mock/core";

export async function grpcProcess(req: GrpcRequest): Promise<GrpcResponse> {
  if (isStaticMode()) {
    return mockProcess(req);
  }
  return liveClient.Process(req);
}
```

### 2. Direct Server Dispatch (`getMockProxyResponse`)

Used by `/api/proxy` to service UI requests:
```typescript
import { getMockProxyResponse } from "@mock/core";

const menu = getMockProxyResponse("GUM");
const model = getMockProxyResponse("GMC", "ACCOUNT");
const form = getMockProxyResponse("GFC", "CONFIG.FORM", "ACCOUNT,1.0.0");
const record = getMockProxyResponse("GET", "ACCOUNT", "AC1001");
```

---

## ➕ Scaling: Adding Verbs or Tables

- **Add a Table**: Add `mock/db/<PREFIX>_<TABLENAME>.ts`, register in `CBS_PHYSICAL_TABLES`, and define in `SC_MODEL_CONFIG.ts`. Core automatically discovers and serves it without changes.
- **Add a Verb**: Implement the handler under `mock/core/handlers/<domain>-handlers.ts` and route `reqType` in `mock/core/index.ts`.

---

## 🧪 Verification

```bash
# Run mock services test suite
pnpm tsx scripts/verify/verify-mock-services.ts

# Run all 10 CBS verification suites
pnpm run verify:all
```

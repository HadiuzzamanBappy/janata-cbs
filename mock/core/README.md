# 🧪 CBS Mock Core (`@mock/core`)

In-memory Core Banking protocol simulator for offline development (`DATA_SOURCE="static"` or `MOCK_CBS="true"`). Provides zero-socket simulation with strict wire parity to live gRPC endpoints and `/api/proxy` responses.

---

## 🔎 How Mock Core & Mock DB Are Invoked in the Architecture

**Key Architectural Invariant**:
The browser / client **never** imports or executes `@mock/core` or `@mock/db` directly. Client code (in `src/features/*`, `src/components/*`, and `@/lib/cbs-client`) only calls standard HTTP endpoints like `/api/proxy` and `/api/login`.

Mock Core operates exclusively on the **Server side** (`"server-only"`):

```text
Browser Client (sendCbsRequest / useLogin)
          │
          │ HTTP fetch (POST)
          ▼
Next.js API Route (/api/proxy or /api/login)
          │
          ▼
Server-side Dispatcher (@/lib/infra-grpc)
  ├─ If serverConfig.dataSource === "static" (or isStaticMode())
  │    └─► @mock/core (mockDispatch / mockLogin / mockProcess)
  │             └─► @mock/core/database-router (resolves table)
  │                      └─► @mock/db/* (in-memory fixtures)
  │
  └─ Else (live gRPC core connection)
       └─► @grpc/grpc-js client
```

### Exact Call Sites in the Codebase

1. **`/api/proxy` → `dispatch()` (`src/lib/infra-grpc/dispatch.ts:145`)**:

   ```typescript
   if (isStaticMode()) {
     return mockDispatch(envelope); // Calls mock/core to simulate CBS execution
   }
   ```
2. **`/api/login` → `loginUser()` → `loginProcess()` (`src/lib/infra-grpc/client.ts`)**:

   ```typescript
   if (isStaticMode()) {
     return mockLogin(req); // Authenticates against mock/db/SC_USER
   }
   ```
3. **gRPC Transport Fallback → `financialProcess()` / `nonFinancialProcess()` (`src/lib/infra-grpc/client.ts`)**:

   ```typescript
   if (isStaticMode()) {
     return mockProcess(req); // Simulates unary gRPC responses
   }
   ```
4. **Verification Harness (`scripts/verify/verify-mock-core.ts`)**:
   Runs 13 standalone checks verifying database routing, protocol verbs, and envelopes.

---

## 📦 Directory Map

```text
mock/core/
├── database-router.ts        # Resolves controlName to physical tables via SC_MODEL_CONFIG
├── response-factory.ts       # Standardized envelopes (okResult, errorResult, notFoundResult, toGrpcResponse)
├── handlers/                 # Domain protocol handlers partitioned by CBS verb
│   ├── auth-handlers.ts      # Operator authentication & session minting (SC_USER)
│   ├── inquiry-handlers.ts   # INQ (Dynamic tabular inquiry executions & filters)
│   ├── menu-handlers.ts      # GUM, GCM (User navigation menu tree from MENU.TREE)
│   ├── model-handlers.ts     # GMC, GFC (Metamodels & dynamic form presentations)
│   ├── mutation-handlers.ts  # PUT, AUT, DEL, HLD, REV, TRV, SMC, AMC, SFC, SMR, DTR, ATT, CTT, AFT, GNI
│   ├── query-handlers.ts     # GET, S, SEE, GRV, GRL, GCQ, GMV, GGL, SBI, RIL
│   └── index.ts              # Handlers barrel export
└── index.ts                  # Public entry: mockLogin, mockProcess, mockDispatch, getMockProxyResponse
```

---

## 🎯 Supported Protocol Verbs & Handler Mapping

Requests dispatch dynamically by `requestType` to modular domain handlers:

| Verb(s)                                          | Category              | Handler File           | Implementation                  | Target Source / Behavior                                 |
| :----------------------------------------------- | :-------------------- | :--------------------- | :------------------------------ | :------------------------------------------------------- |
| **`LOGIN`**                                      | Operator Auth         | `auth-handlers.ts`     | `mockLogin()` / `handleLogin()` | `SC_USER` verification & session token generation        |
| **`GUM`**, **`GCM`**                             | Navigation Menu       | `menu-handlers.ts`     | `handleGetMenu()`               | Resolves `MENU.TREE` hierarchy                           |
| **`GMC`**                                        | Metamodel Spec        | `model-handlers.ts`    | `handleGetModelConfig()`        | Target model schema in `SC_MODEL_CONFIG`                 |
| **`GFC`**                                        | Form Layout           | `model-handlers.ts`    | `handleGetFormConfig()`         | Target form presentation in `SC_FORM_CONFIG`             |
| **`INQ`**                                        | Dynamic Inquiry       | `inquiry-handlers.ts`  | `handleInquiry()`               | `SC_INQUIRY_CONFIG` + Target Table query                 |
| **`GNI`**                                        | Sequence / Draft ID   | `mutation-handlers.ts` | `handleNextId()`                | Model `IDDEF` or user-prefixed draft ID generation       |
| **`SBI`**, **`RIL`**                             | Key / ID List Search  | `query-handlers.ts`    | `handleSearchById()`            | Target Table `getIdList()` with wildcard match           |
| **`GRL`**, **`GCQ`**, **`GMV`**, **`GGL`**       | Record Collections    | `query-handlers.ts`    | `handleRecordList()`            | Target Table `getList()`                                 |
| **`GET`**, **`S`**, **`SEE`**, **`GRV`**         | Read Record           | `query-handlers.ts`    | `handleSeeRecord()`             | Target Table `LIVE` or historical record snapshot        |
| **`PUT`**, **`SMC`**, **`SFC`**, **`SMR`**       | Save Draft (Maker)    | `mutation-handlers.ts` | `handleMutation()`              | Writes pending record with `recStatus: "INA"`            |
| **`AUT`**, **`AMC`**                             | Authorize (Checker)   | `mutation-handlers.ts` | `handleMutation()`              | Validates Maker-Checker rule, writes `recStatus: "AU"`   |
| **`DEL`**, **`HLD`**, **`REV`**, **`TRV`**, etc. | Lifecycle Transitions | `mutation-handlers.ts` | `handleMutation()`              | Updates record status to `"DEL"`, `"HLD"`, `"REV"`, etc. |

---

## 🗄️ Database Resolution (`database-router.ts`)

Translates client `controlName` into physical table accessors via `SC_MODEL_CONFIG`:

```typescript
import { resolveTable } from "@mock/core/database-router";

// Resolves control alias "CONFIG.FORM" or model "ACCOUNT" to underlying database fixture
const table = resolveTable("CONFIG.FORM"); // Resolves to SC_FORM_CONFIG

if (table) {
  const records = table.getList("LIVE"); // Array of live records
  const ids = table.getIdList("AC*"); // Matching record keys
  const liveRec = table.LIVE["ACCOUNT,1.0.0"];
}
```

---

## 🚀 Execution & Entrypoints

### 1. `mockDispatch(payload)`

Invoked by the server-side dispatcher (`src/lib/infra-grpc/dispatch.ts`) when `/api/proxy` receives a request under `DATA_SOURCE="static"`. It parses the wire envelope and routes to `getMockProxyResponse`.

### 2. `mockLogin(req)`

Invoked by `loginProcess()` (`src/lib/infra-grpc/client.ts`) when `/api/login` authenticates an operator under static mode.

### 3. `mockProcess(req)`

Invoked by `financialProcess()` / `nonFinancialProcess()` (`src/lib/infra-grpc/client.ts`) to return protobuf-compatible `GrpcResponse` objects for unary gRPC calls.

---

## ➕ Scaling: Adding Verbs or Tables

1. **Add a Table**:
   - Create `mock/db/<PREFIX>_<TABLENAME>.ts` implementing the table interface.
   - Register it in `mock/db/index.ts` under `CBS_PHYSICAL_TABLES`.
   - Define its metamodel mapping in `mock/db/SC_MODEL_CONFIG.ts`.
   - The database router automatically resolves and serves the table.

2. **Add or Extend a Protocol Verb**:
   - Implement the business logic in the corresponding handler under `mock/core/handlers/` (`query-handlers.ts`, `mutation-handlers.ts`, etc.).
   - Route the verb in `mock/core/index.ts` within `getMockProxyResponse()`.

---

## 🧪 Verification

```bash
# Run in-memory mock core verification suite (validates all 13 core capabilities)
pnpm verify:mock

# Run all 12 CBS domain verification suites
pnpm verify:all
```

# ⚡ CBS Infrastructure: gRPC Gateway (`@/lib/infra-grpc`)

A pure, server-only gRPC dispatching and authentication engine connecting the **Janata Core Banking Workbench (BFF)** to the Java Core Banking host and downstream gRPC services.

It enforces a strict security boundary (`import "server-only"`), maintains a lazy connection channel pool (`__grpcClientPool`), routes operations into **Financial (`FinancialProcess`)** vs. **Non-Financial (`NonFinancialProcess`)** RPCs, injects automatic idempotency keys, manages operator session lifecycle via Redis, and translates gRPC status codes to HTTP equivalents.

---

## 📦 What It Contains

```text
src/lib/infra-grpc/
├── auth.ts         # User authentication & session management (loginUser, logoutUser)
├── client.ts       # Channel pooling, TLS, 16 MB limit, RPC callers (loginProcess, financialProcess, nonFinancialProcess), status mapping
├── dispatch.ts     # Pure gRPC dispatcher routing by servicePath with env-based financial detection
├── generated/      # Protobuf compiled TypeScript stubs (ts-proto) for GrpcServiceClient, GrpcRequest, GrpcResponse
└── index.ts        # Server-only barrel export
```

---

## ⚙️ Core Architecture & Execution Pipeline

```text
Client Request via /api/proxy (HTTP JSON)
                 │
                 ▼
     [ 1. dispatch() ] (dispatch.ts)
                 │
                 ├─► DATA_SOURCE === "static" ──► mockDispatch() (@mock/core)
                 │
                 ▼
     [ 2. isFinancialRequest() ]
     Matches requestType against serverConfig.grpc.financialTransactionTypes
                 │
                 ▼
     [ 3. Idempotency Key Injection ]
     Auto-generates crypto.randomUUID() for financial requests if absent
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
 financialProcess()  nonFinancialProcess()  (client.ts)
       │                   │
       └─────────┬─────────┘
                 ▼
       Channel Pool (__grpcClientPool)
       TLS / Insecure, Keepalive (60s/20s), 16 MB max payload, Deadline
                 │
                 ▼
     [ 4. Standard Response Envelope ]
     ApiResponse<T> (Unified JSON with status, statusCode, data)
```

---

## 🏛️ Financial vs. Non-Financial Routing

1. **Financial Operations (`financialProcess`)**:
   - Matches codes configured in `GRPC_FINANCIAL_TRANSACTION_TYPES` (`ATT`, `CTT`, `AFT`).
   - Automatically attaches a `crypto.randomUUID()` `idempotencyKey` if omitted to prevent duplicate ledger entries.
2. **Non-Financial Operations (`nonFinancialProcess`)**:
   - All other verbs (`GET`, `PUT`, `AUT`, `GRL`, `GMC`, `GFC`, `INQ`, etc.).

---

## 🚀 How to Use

### 1. Dispatching a Banking Transaction via `dispatch()`

Used inside Next.js API routes (e.g. `/api/proxy`):

```typescript
import { dispatch } from "@/lib/infra-grpc";
import type { GrpcEnvelope } from "@/lib/data-schemas";

const envelope: GrpcEnvelope = {
  servicePath: "default",
  requestType: "PUT",
  controlName: "ACCOUNT",
  recordFunction: "I",
  recordId: "10000001",
  branchCode: "JB0001",
  authLevel: 1,
  userId: "TELLER01",
  data: {
    accountTitle: "Janata Corporate A/C",
  },
};

const response = await dispatch(envelope, token);
```

### 2. Service Routing via `servicePath`

The dispatcher extracts the first segment of `envelope.servicePath` (defaulting to `"default"`) and resolves the target gRPC address via `getServiceUrl()` in `src/lib/core-config/server.ts`.

### 3. Authentication & Session Management (`loginUser`, `logoutUser`)

```typescript
import { loginUser, logoutUser } from "@/lib/infra-grpc";

const result = await loginUser({ username: "teller01", password: "secret" });
await logoutUser();
```

### 4. Offline / Static Mock Fallback

When `serverConfig.dataSource === "static"`, `isStaticMode()` returns `true`:

- `dispatch()` routes to `mockDispatch()`
- `financialProcess()` / `nonFinancialProcess()` route to `mockProcess()`
- `loginProcess()` routes to `mockLogin()`

---

## 🛡️ Resilience Handled

1. **Strict Server Boundary (`import "server-only"`):** Keeps `@grpc/grpc-js` out of browser bundles.
2. **Connection Channel Pooling (`__grpcClientPool`):** Reuses persistent HTTP/2 channels per normalized `host:port` target.
3. **Message Limits, Keepalive & Deadlines:** 16 MB max send/receive message size, `60s / 20s` keepalive, and `serverConfig.grpc.timeoutMs` call deadlines on all RPCs including `loginProcess`.
4. **gRPC-to-HTTP Status Mapping:** `grpcStatusToHttp()` translates `@grpc/grpc-js` error codes (`CANCELLED` → `499`, `INVALID_ARGUMENT` → `400`, `UNAUTHENTICATED` → `401`, `PERMISSION_DENIED` → `403`, `NOT_FOUND` → `404`, `ALREADY_EXISTS` / `ABORTED` → `409`, `FAILED_PRECONDITION` → `412`, `RESOURCE_EXHAUSTED` → `429`, `UNIMPLEMENTED` → `501`, `UNAVAILABLE` → `503`, `DEADLINE_EXCEEDED` → `504`, `INTERNAL` / `DATA_LOSS` → `500`).

---

## 🧪 Verification

```bash
pnpm verify:grpc
```

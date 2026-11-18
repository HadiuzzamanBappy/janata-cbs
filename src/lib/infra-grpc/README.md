# ⚡ CBS Infrastructure: gRPC Gateway (`@/lib/infra-grpc`)

A pure, server-only gRPC dispatching and authentication engine connecting the **Janata Core Banking Workbench (BFF)** to the Java Core Banking host and downstream gRPC services.

It enforces a strict security boundary (`import "server-only"`), maintains a lazy connection channel pool (`__grpcClientPool`), routes operations into **Financial (`FinancialProcess`)** vs. **Non-Financial (`NonFinancialProcess`)** RPCs, forwards attempt-scoped idempotency keys, manages operator session lifecycle via Redis, and translates gRPC status codes to HTTP equivalents.

---

## 📦 What It Contains

```text
src/lib/infra-grpc/
├── auth.ts         # loginUser / logoutUser: core login, then createSession / destroySession in @/lib/infra-redis
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
     [ 3. Idempotency Key Forwarding ]
     Forwards client-supplied UUIDv4 idempotencyKey untouched to GrpcRequest
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
     [ 4. resolveCoreStatus() ]
     The core's status string is checked against apiStatusSchema; an unknown value is logged
     at error level and returned as ERROR, never as success
                 │
                 ▼
     [ 5. Standard Response Envelope ]
     ApiResponse<T> (Unified JSON with status, statusCode, data)
```

---

## 🏛️ Financial vs. Non-Financial Routing

1. **Financial Operations (`financialProcess`)**:
   - Matches codes configured in `GRPC_FINANCIAL_TRANSACTION_TYPES` (`ATT`, `CTT`, `AFT`).
   - Sent over the blocking, strong-consistency `FinancialProcess` RPC.
2. **Non-Financial Operations (`nonFinancialProcess`)**:
   - All other verbs (`GET`, `PUT`, `AUT`, `GRL`, `GMC`, `GFC`, `INQ`, etc.).
3. **Official Banking Idempotency Key Flow (Pure UUIDv4)**:
   - Attempt-scoped UUIDv4 keys are generated at the UI origin via `useIdempotentSend()` (reused across transient network/5xx retries, rotated on success or payload change), enforced on mutations by `cbsWirePayloadSchema` & `/api/proxy`, and forwarded untouched by `dispatch()`. Read operations pass without fake keys.

---

## 🚀 How to Use

### 1. Dispatching a Banking Transaction via `dispatch()`

Used inside Next.js API routes (e.g. `/api/proxy`). Never build the envelope by hand: `buildGrpcEnvelope()` in `src/app/api/_lib/envelope.ts` fills `clientId`, `userId` and `branchCode` from the server session, so the browser can't supply them.

```typescript
import { dispatch } from "@/lib/infra-grpc";
import { buildGrpcEnvelope } from "../_lib/envelope";

const envelope = buildGrpcEnvelope(session, body); // body: the validated cbsWirePayload
const response = await dispatch(envelope, session.token);
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
- `loginProcess()` routes to `handleLogin()`

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

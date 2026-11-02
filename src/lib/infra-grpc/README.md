# ⚡ CBS Infrastructure: gRPC & Microservices Gateway (`@/lib/infra-grpc`)

A high-performance, server-only RPC dispatching and authentication engine connecting the **Janata Core Banking Workbench (BFF)** to the Java Core Banking host and downstream banking microservices.

It enforces a strict security boundary (`import "server-only"`), maintains a lazy connection channel pool, classifies operations into **Financial** vs. **Non-Financial** execution pipelines, injects automatic idempotency keys, manages operator session lifecycle via Redis, and provides transparent protocol routing across both binary **gRPC** and **REST** microservices.

---

## 📦 What It Contains

```text
src/lib/infra-grpc/
├── auth.ts         # User authentication & session management (loginUser, logoutUser)
├── client.ts       # Channel pooling, TLS, unary RPC callers (grpcProcess, loginProcess), and status mappers
├── dispatch.ts     # Multi-protocol dispatcher routing by servicePath (gRPC vs. REST) with financial classification
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
      ┌──────────┴──────────┐
      ▼                     ▼
servicePath === "rest"  servicePath === "default" (or gRPC microservice)
      │                     │
      │           [ 2. classify() ]
      │           Determines: Financial vs Non-Financial
      │                     │
      │           [ 3. Idempotency Key Injection ]
      │           Automatic crypto.randomUUID() for Financial txns
      │                     │
      ▼                     ▼
[ executeRestTransport ] [ executeGrpcTransport ]
  HTTP fetch POST          grpcProcess() (client.ts)
      │                     │
      │              Channel Pool (__grpcClientPool)
      │              TLS / Insecure ChannelCredentials
      │              Keepalive (60s ping / 20s timeout)
      │                     │
      └──────────┬──────────┘
                 ▼
     [ 4. Standard Response Envelope ]
     ApiResponse<T> (Unified JSON with status, timestamp, data)
```

---

## 🏛️ Financial vs. Non-Financial Classification

In core banking, financial transactions carry strict ledger settlement and integrity requirements:

1. **Financial Operations (`financialProcess`)**:
   - Matches types defined in `appConfig.grpc.financialTransactionTypes` (e.g. `AFT` - Automated Fund Transfer, `ATT` - Account Transfer Transaction, `CTT` - Cash Transfer Transaction).
   - **Guaranteed Idempotency:** Automatically generates and attaches a unique `crypto.randomUUID()` idempotency key if one was not provided, preventing duplicate ledger entries.
2. **Non-Financial Operations (`nonFinancialProcess`)**:
   - Queries, lookups, schema inspections, menu retrievals (`GET`, `GRL`, `GMC`, `GFC`, `INQ`).
   - Dispatched through standard fast unary calls.

---

## 🚀 How to Use

### 1. Dispatching a Banking Transaction via `dispatch()`

Used inside Next.js API routes (e.g. `/api/proxy`):

```typescript
import { dispatch } from "@/lib/infra-grpc";
import type { GrpcEnvelope } from "@/lib/data-schemas";

const envelope: GrpcEnvelope = {
  servicePath: "default", // Routes to primary core gRPC host
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

const token = "session-jwt-or-bearer-token";
const response = await dispatch(envelope, token);

if (response.status === "SUCCESS") {
  console.log("Core banking ledger updated:", response.data);
} else {
  console.error("gRPC Error:", response.message, response.errors);
}
```

---

### 2. Microservice Routing via `servicePath`

The dispatcher dynamically inspects `envelope.servicePath`:
- `servicePath: "default"` → Dispatches via binary gRPC to `appConfig.grpc.host` (e.g., `localhost:9090`).
- `servicePath: "customer"` → Routes to `SERVICE_CUSTOMER_BASE_URL`.
- `servicePath: "urm"` → Routes to `SERVICE_URM_BASE_URL`.
- If a service in `SERVICES` specifies `protocol: "rest"`, `dispatch()` automatically falls back to HTTP REST JSON posting without changing caller code.

---

### 3. Authentication & Session Management (`loginUser`, `logoutUser`)

Centralized server-side authentication integrating with Redis session management:

```typescript
import { loginUser, logoutUser } from "@/lib/infra-grpc";

// In /api/login route:
const result = await loginUser({
  username: "teller01",
  password: "encrypted-password",
});

if (result.success) {
  console.log("User authenticated and Redis session established:", result.user);
}

// In /api/logout route:
await logoutUser();
```

---

### 4. Offline / Static Mock Core Engine Fallback

When `appConfig.dataSource === "static"`, `isStaticMode()` returns `true`:
- `grpcProcess()` redirects automatically to `mockProcess()` / `mockDispatch()`.
- `loginProcess()` redirects automatically to `mockLogin()`.
- Allows full development, UI testing, and verification suites to run independently without a running Java backend.

---

## 🛡️ Edge Cases & Resilience Handled

1. **Strict Server Boundary (`import "server-only"`):**
   Prevents `@grpc/grpc-js` and Node.js native crypto modules from ever leaking into client browser JavaScript.
2. **Connection Channel Pooling:**
   Reuses persistent HTTP/2 gRPC channels per server address using a global singleton map (`__grpcClientPool`). Avoids opening a new TCP handshake for every client request.
3. **Keepalive Heartbeat:**
   Channels are configured with `grpc.keepalive_time_ms: 60,000` and `grpc.keepalive_timeout_ms: 20,000` to prevent firewalls or cloud load balancers from silently dropping idle connections.
4. **Full Standard gRPC-to-HTTP Status Code Mapping:**
   `grpcStatusToHttp()` automatically translates native gRPC status codes into standard HTTP equivalents:
   - `OK (0)` ➔ `200 OK`
   - `CANCELLED (1)` ➔ `499 Client Closed Request`
   - `UNKNOWN (2)` ➔ `500 Internal Server Error`
   - `INVALID_ARGUMENT (3)` ➔ `400 Bad Request`
   - `DEADLINE_EXCEEDED (4)` ➔ `504 Gateway Timeout`
   - `NOT_FOUND (5)` ➔ `404 Not Found`
   - `ALREADY_EXISTS (6)` ➔ `409 Conflict`
   - `PERMISSION_DENIED (7)` ➔ `403 Forbidden`
   - `RESOURCE_EXHAUSTED (8)` ➔ `429 Too Many Requests`
   - `FAILED_PRECONDITION (9)` ➔ `412 Precondition Failed`
   - `ABORTED (10)` ➔ `409 Conflict`
   - `OUT_OF_RANGE (11)` ➔ `400 Bad Request`
   - `UNIMPLEMENTED (12)` ➔ `501 Not Implemented`
   - `INTERNAL (13)` ➔ `500 Internal Server Error`
   - `UNAVAILABLE (14)` ➔ `503 Service Unavailable`
   - `DATA_LOSS (15)` ➔ `500 Internal Server Error`
   - `UNAUTHENTICATED (16)` ➔ `401 Unauthorized`

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Transport Core & Channel Pooling: **SEALED**

Connection pooling, TLS creation, metadata forwarding, session auth hooks, and status code translation are complete and finalized.

### 2. Service Endpoints & Command Overlays: **SCALABLE**

When integrating new microservices or special command codes:
- **Adding Microservices:** Add endpoint to `SERVICES` in `src/lib/core-config/server.ts`.
- **Custom Request Type Overlays:** Add special command mapping in `REQUEST_TYPE_OVERLAYS` (e.g. `FUNDS.TRANSFER -> AFT`).

---

## 🧪 Verification

Run the infrastructure verification suite:
```bash
pnpm verify:grpc
```

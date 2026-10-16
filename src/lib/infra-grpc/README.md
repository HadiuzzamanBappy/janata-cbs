# ⚡ CBS Infrastructure: gRPC & Microservices Gateway (`@/lib/infra-grpc`)

A high-performance, server-only RPC dispatching engine connecting the **Janata Core Banking Workbench (BFF)** to the Java Core Banking host and downstream banking microservices.

It enforces a strict security boundary (`import "server-only"`), maintains a lazy connection channel pool, classifies operations into **Financial** vs. **Non-Financial** execution pipelines, injects automatic idempotency keys, and provides transparent protocol routing across both binary **gRPC** and **REST** microservices.

---

## 📦 What It Contains

```text
src/lib/infra-grpc/
├── client.ts       # Low-level gRPC channel pooling, TLS configuration, unary RPC callers, and status mappers
├── dispatch.ts     # High-level dispatcher routing by servicePath (gRPC vs. REST) with financial classification
├── generated/      # Protobuf compiled TypeScript stubs (ts-proto) for GrpcServiceClient, GrpcRequest, GrpcResponse
└── index.ts        # Server-only barrel export
```

---

## ⚙️ Core Architecture & Execution Pipeline

```text
Incoming Wire Envelope (from Next.js Server Action / API Route)
                     │
                     ▼
             [ 1. dispatch() ] (dispatch.ts)
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
  servicePath === "rest"   servicePath === "grpc"
         │                       │
         │             [ 2. classify() ]
         │             Determines: Financial vs Non-Financial
         │                       │
         │             [ 3. Idempotency Key Injection ]
         │             Automatic crypto.randomUUID() for Financial txns
         │                       │
         ▼                       ▼
 [ executeRestTransport ] [ executeGrpcTransport ]
   HTTP fetch POST          grpcProcess() (client.ts)
         │                       │
         │                Channel Pool (__grpcClientPool)
         │                TLS / Insecure ChannelCredentials
         │                Keepalive (60s ping / 20s timeout)
         │                       │
         └───────────┬───────────┘
                     ▼
         [ 4. Standard Response Envelope ]
         ApiResponse<T> (Unified JSON with status, timestamp, data)
```

---

## 🏛️ Financial vs. Non-Financial Classification

In core banking, financial transactions carry strict ledger settlement and ledger integrity requirements:

1. **Financial Operations (`financialProcess`)**:
   - Matches types defined in `GRPC_FINANCIAL_TRANSACTION_TYPES` (e.g. `AFT` - Account Funds Transfer, `ACT` - Account Cash Transfer).
   - **Guaranteed Idempotency:** Automatically generates and attaches a unique `crypto.randomUUID()` idempotency key if one was not provided, preventing duplicate ledger entries.
2. **Non-Financial Operations (`nonFinancialProcess`)**:
   - Queries, lookups, schema inspections, menu retrievals (`GET`, `GRL`, `INQ`).
   - Dispatched through standard fast unary calls.

---

## 🚀 How to Use

### 1. Dispatching a Banking Transaction via `dispatch()`

Used inside Next.js API routes (e.g. `/api/proxy` or Server Actions):

```typescript
import { dispatch } from "@/lib/infra-grpc";
import type { GrpcEnvelope } from "@/types";

const envelope: GrpcEnvelope = {
  servicePath: "default",          // Routes to primary core gRPC host
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
- `servicePath: "default"` → Dispatches via binary gRPC to `GRPC_HOST` (e.g., `localhost:9090`).
- `servicePath: "customer"` → Routes to `SERVICE_CUSTOMER_BASE_URL`.
- `servicePath: "urm"` → Routes to `SERVICE_URM_BASE_URL`.
- If a service in `SERVICES` specifies `protocol: "rest"`, `dispatch()` automatically falls back to HTTP REST JSON posting without changing caller code.

---

### 3. Direct Authentication (`loginProcess`)

Unauthenticated gRPC entry point for initial teller / operator login:

```typescript
import { loginProcess } from "@/lib/infra-grpc";

const loginResponse = await loginProcess({
  userName: "teller01",
  password: "encrypted-password",
  branchCode: "JB0001",
});
```

---

## 🛡️ Edge Cases & Resilience Handled

1. **Strict Server Boundary (`import "server-only"`):**
   Prevents `@grpc/grpc-js` and Node.js native crypto modules from ever being bundled into client browser JavaScript.
2. **Connection Channel Pooling:**
   Reuses persistent HTTP/2 gRPC channels per server address using a global singleton map (`__grpcClientPool`). Avoids opening a new TCP handshake for every client request.
3. **Keepalive Heartbeat:**
   Channels are configured with `grpc.keepalive_time_ms: 60,000` and `grpc.keepalive_timeout_ms: 20,000` to prevent firewalls or cloud load balancers from silently dropping idle connections.
4. **gRPC-to-HTTP Status Code Mapping:**
   `grpcStatusToHttp()` automatically translates native gRPC status codes into standard HTTP equivalents:
   - `DEADLINE_EXCEEDED (4)` ➔ `504 Gateway Timeout`
   - `UNAVAILABLE (14)` ➔ `503 Service Unavailable`
   - `UNAUTHENTICATED (16)` ➔ `401 Unauthorized`
   - `PERMISSION_DENIED (7)` ➔ `403 Forbidden`
   - `NOT_FOUND (5)` ➔ `404 Not Found`

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Transport Core & Channel Pooling: **SEALED**
Connection pooling, TLS creation, metadata forwarding, and status code translation are complete and finalized.

### 2. Service Endpoints & Command Overlays: **SCALABLE**
When integrating new microservices or special command codes:
- **Adding Microservices:** Add endpoint to `SERVICES` in `src/lib/core-config/server.ts`.
- **Custom Request Type Overlays:** Add special command mapping in `REQUEST_TYPE_OVERLAYS` (e.g. `FUNDS.TRANSFER -> AFT`).

---

## 🧪 Verification

Run the infrastructure verification suite:
```bash
pnpm verify:services
```

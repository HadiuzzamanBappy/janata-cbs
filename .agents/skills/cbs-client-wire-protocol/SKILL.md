---

name: cbs-client-wire-protocol
description: Use this skill when communicating between the frontend and backend, calling the /api/proxy endpoint, fetching dynamic GMC schemas, running inquiry queries, or executing record transactions.
---

# CBS Client Wire Protocol & Proxy Gateway Runbook

## Overview

Janata CBS adheres strictly to the **Backend-For-Frontend (BFF)** pattern. The browser client **NEVER** communicates directly with Java gRPC backends, databases, or Redis caches. All communication routes through the Next.js API proxy (`/api/proxy`) using the canonical wire request factories in `src/lib/cbs-client`.

---

## 1. Wire Request Factories (`src/lib/cbs-client`)

Always use the typed factory functions to construct outgoing wire payloads:

```ts
import {
  buildGetRecordRequest,
  buildPutRecordRequest,
  buildAuthorizeRecordRequest,
  buildInquiryRequest,
  buildGrlLookupRequest,
  cbsClient,
} from "@/lib/cbs-client";

// 1. Fetching a Form Record (GET, SEE)
const getPayload = buildGetRecordRequest({
  application: "ACCOUNT",
  recordId: "10001",
});
const response = await cbsClient.send(getPayload);

// 2. Committing a Record (PUT, INPUT)
const putPayload = buildPutRecordRequest({
  application: "ACCOUNT",
  recordId: "10001",
  data: updatedFields,
});

// 3. Authorizing a Record (AUT, AUTHORIZE)
const authPayload = buildAuthorizeRecordRequest({
  application: "ACCOUNT",
  recordId: "10001",
});

// 4. Executing an Enquiry (INQ, SEE)
const inqPayload = buildInquiryRequest({
  inquirySpec: "GET.EMP.INFO",
  criteria: { BRANCH_CODE: { value: "JB0001", operand: "EQ" } },
});
```

---

## 2. Server Boundary Rules (`import "server-only"`)

The backend dispatchers and gRPC clients live exclusively on the server side:
- **Server-Only Modules:** Any file inside `src/lib/infra-grpc/`, `src/lib/infra-redis/`, or `src/proxy.ts` must declare:

  ```ts
  import "server-only";
  ```
- **Prohibited Client Imports:** Client files (`"use client"`) must NEVER import:
  - `@grpc/grpc-js`
  - `@bufbuild/protobuf`
  - `ts-proto` generated stubs
  - `ioredis`
  - Node.js native modules (`fs`, `net`, `crypto` outside Web Crypto)

---

## 3. Zod Boundary Validation

Never pass raw client payloads to backend dispatchers without validating them first:
- All incoming requests must be parsed against Zod schemas in `src/lib/data-schemas/`.
- Use `safeParse()` and handle validation failures before invoking the gRPC dispatcher:

  ```ts
  const validation = requestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      { error: "VALIDATION_FAILED", details: validation.error.format() },
      { status: 400 }
    );
  }
  ```

---

## 4. Verification & Testing

Whenever you change wire factories, proxy logic, or backend dispatchers, run:

```bash
pnpm verify:client
pnpm verify:services
```

All wire factory tests must report `[PASS]` before finalizing changes.

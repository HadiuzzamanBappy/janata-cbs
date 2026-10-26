# 03: Server/Client Isolation & Boundary Protection

## 1. Strict Server Boundary (`"server-only"`)

- The browser client MUST NEVER import gRPC, Redis, or Node.js backend infrastructure directly.
- Every backend infrastructure module under `src/lib/infra-grpc/`, `src/lib/infra-redis/`, and `src/proxy.ts` must begin with:

  ```ts
  import "server-only";
  ```
- **Client gRPC Ban**: NEVER import `@grpc/grpc-js`, `@bufbuild/protobuf`, or `ts-proto` generated stubs into any file marked with `"use client"`.

## 2. API Proxy Gateway

- Client components interact with backend systems strictly through:
  - The API proxy (`/api/proxy` via `src/lib/cbs-client`)
  - Next.js Server Actions with internal error handling
- Zero direct database connections or raw TCP sockets in presentation logic.

## 3. The Validation Boundary (Zod)

- NEVER trust incoming raw JSON data from external payloads or client requests.
- All request payloads crossing into route handlers or Server Actions must be strictly validated using Zod schemas located in `src/lib/data-schemas/`.
- Use `.safeParse()` instead of throwing unhandled exceptions. Return typed error objects:

  ```ts
  const parsed = mySchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Validation failed" };
  }
  ```

## 4. Environment Variables & Secret Masking

- Server secrets (`REDIS_URL`, internal gRPC host addresses, master tokens) must NEVER have the `NEXT_PUBLIC_` prefix.
- Only safe presentation settings (e.g. `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_LOGOUT_TIME`) may use `NEXT_PUBLIC_`.

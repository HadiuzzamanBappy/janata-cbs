# ⚙️ Core Configuration (`@/lib/core-config`)

The central configuration engine for the **Janata Core Banking Workbench**.

It enforces a strict security boundary separating client-safe runtime constants from server-only secrets (such as Redis credentials, gRPC hosts, and internal microservice URLs) using Next.js `import "server-only"`.

---

## 📦 What It Contains

```text
src/lib/core-config/
├── client.ts    # Client-safe constants, routes, formatters, and storage keys
├── env.ts       # Validated server environment variables via Zod ('server-only')
├── server.ts    # Composed server configuration, gRPC settings, and service registry ('server-only')
└── index.ts     # Default entrypoint: re-exports clientConfig as appConfig for UI components
```

---

## 🚀 How to Use

### 1. In Client Components (`'use client'`) & Shared UI

Import from `@/lib/core-config`:

```typescript
import { appConfig } from "@/lib/core-config";

// Read client route or formatting rule
const timeoutMin = appConfig.logoutTime;
const currency = appConfig.format.currency; // "BDT"
const proxyEndpoint = appConfig.routes.api.proxy; // "/api/proxy"
const maxTabs = appConfig.workbench.maxOpenTabs; // 15
```

---

### 2. In Server Components, Server Actions & API Routes

Import from `@/lib/core-config/server`:

```typescript
import { appConfig, getServiceUrl } from "@/lib/core-config/server";

// Access validated runtime secrets & infrastructure endpoints
const grpcHost = appConfig.grpc.host;
const redisUrl = appConfig.redis.url;
const customerServiceUrl = getServiceUrl("customer");
```

> **Security Guard:** If a client component attempts to import from `@/lib/core-config/server`, the Next.js compiler will automatically fail the build.

---

## 📐 Rules for Scaling: Adding New Configurations

To keep the security boundary intact when adding new configurations, follow these strict rules:

### Rule 1: Adding a Server Secret / Environment Variable
1. Add the variable and validation rules to `envSchema` in `src/lib/data-schemas/env-schema.ts`.
2. Map it to `process.env.YOUR_VAR` in `src/lib/core-config/env.ts`.
3. Expose it under the relevant category (`grpc`, `redis`, `services`) in `src/lib/core-config/server.ts`.

### Rule 2: Adding a Public Client Setting
1. If it must be configurable per deployment, prefix with `NEXT_PUBLIC_` and add a fallback in `client.ts`:
   ```typescript
   export const clientConfig = {
     // ...
     featureFlag: process.env.NEXT_PUBLIC_FEATURE_FLAG === "true",
   };
   ```
2. If it is a static banking invariant (route, localStorage key, format), add it directly into `client.ts`.

### Rule 3: Adding a Microservice Endpoint
Add the endpoint entry to the `SERVICES` registry in `src/lib/core-config/server.ts`:
```typescript
export const SERVICES: Record<string, ServiceDef> = {
  default: { url: env.GRPC_HOST, protocol: "grpc" },
  customer: { url: env.SERVICE_CUSTOMER_BASE_URL, protocol: "grpc" },
  urm: { url: env.SERVICE_URM_BASE_URL, protocol: "grpc" },
  loan: { url: env.SERVICE_LOAN_BASE_URL, protocol: "grpc" }, // New service
};
```

---

## 🧪 Verification

Run the environment matrix and schema verification:
```bash
pnpm verify:matrix
```

# ⚙️ Core Configuration (`@/lib/core-config`)

The central configuration engine for the **Janata Core Banking Workbench**.

It enforces a strict security boundary separating client-safe runtime constants from server-only secrets (such as Redis credentials, gRPC hosts, and internal microservice URLs) using Next.js `import "server-only"`.

---

## 📦 What It Contains

```text
src/lib/core-config/
├── client.ts    # Client-safe constants, routes, formatters, and storage keys (clientConfig)
├── env.ts       # Validated server environment variables via Zod ('server-only')
├── server.ts    # Composed server configuration, gRPC settings, and service registry (serverConfig)
├── theme.ts     # Centralized banking theme & accent presets
└── index.ts     # Default entrypoint: re-exports client.ts and theme.ts (never env.ts or server.ts)
```

---

## 🚀 How to Use

### 1. In Client Components (`'use client'`) & Shared UI

Import from `@/lib/core-config`:

```typescript
import { clientConfig } from "@/lib/core-config";

// Read client route or formatting rule
const timeoutMin = clientConfig.logoutTime;
const currency = clientConfig.format.currency; // "BDT"
const proxyEndpoint = clientConfig.routes.api.proxy; // "/api/proxy"
const maxTabs = clientConfig.workbench.maxOpenTabs; // 15
```

---

### 2. In Server Components, Server Actions & API Routes

Import from `@/lib/core-config/server`:

```typescript
import { resolveService, serverConfig } from "@/lib/core-config/server";

// Access validated runtime secrets & infrastructure endpoints
const grpcHost = serverConfig.grpc.host;
const redisUrl = serverConfig.redis.url;
const urm = resolveService("finxurm"); // { name, address, protocol } or undefined
```

`serverConfig` spreads `clientConfig`, so server code needs only this one import.

> **Security guard:** `server.ts` and `env.ts` start with `import "server-only"`, so a client import fails the build, and `pnpm verify:layers` rejects any `"use client"` file that imports `@/lib/core-config/server`.

---

## 📐 Rules for Scaling: Adding New Configurations

To keep the security boundary intact when adding new configurations, follow these strict rules:

### Rule 1: Adding a Server Secret / Environment Variable

1. Add the variable and validation rules to `envSchema` in `src/lib/data-schemas/env-schema.ts`.
2. Map it to `process.env.YOUR_VAR` in `src/lib/core-config/env.ts`.
3. Expose it under the relevant category (`grpc`, `redis`, `auth`) in `src/lib/core-config/server.ts`.

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

No code change: add one env line, `SERVICE_<NAME>_URL`, where NAME is the jar name and the DB `servicePath`, then restart. `serviceEnvSchema` (`env-schema.ts`) collects every such key into `SERVICES`:

```env
SERVICE_FINXURM_URL=http://localhost:8282/finxurm/inq   # http(s):// → REST, POST to this exact URL
SERVICE_FINXLOAN_URL=localhost:8383                     # host:port  → gRPC
```

`default` is reserved for the core (`GRPC_HOST`). Start-up fails on any other `SERVICE_*` key, on `SERVICE_DEFAULT_URL` and on a bad address.

---

## 🧪 Verification

Run the environment matrix and schema verification:

```bash
pnpm verify:config
```

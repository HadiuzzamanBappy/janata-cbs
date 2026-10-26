# 🏛️ CBS Infrastructure: Domain Services & BFF Gateway (`@/lib/infra-services`)

The server-side Backend-for-Frontend (BFF) orchestration layer for the **Janata Core Banking Workbench**.

It sits directly between Next.js API Routes (`/api/form`, `/api/inquiry`, `/api/menu`, `/api/branches`, `/api/session`, `/api/login`) and backend infrastructure, providing **dual-mode switching** (live gRPC vs. offline static mocks), **transparent Redis caching**, and **automatic session context resolution**.

---

## 📦 What It Contains

```text
src/lib/infra-services/
├── service-context.ts  # Session token, user ID, branch code resolution, and command normalizer
├── auth-service.ts     # User authentication, credential validation, and session creation
├── form-service.ts     # Dynamic GMC form schema retrieval with version fallback (USER.MGT,NEW1 -> USER.MGT)
├── inquiry-service.ts  # Enquiry query execution and column specification resolver
├── menu-service.ts     # Navigation menu hierarchy provider (SC.MENU.TREE)
├── branch-service.ts   # Branch directory retrieval for branch switching and validation
├── control-service.ts  # Core banking table catalog (CONTROL) for command search
└── index.ts            # Server-only public barrel export ('server-only')
```

---

## ⚙️ Core Architecture & Execution Flow

```text
Next.js API Route (/api/form, /api/inquiry, /api/branches, etc.)
                          │
                          ▼
              [ Domain Service ] (e.g. form-service.ts)
                          │
                          ▼
        [ getOrSet() — Redis Read-Through Cache ]
        Returns cached spec if available (Cache Hit)
                          │ (Cache Miss)
                          ▼
            [ isStaticMode() Gate Switch ]
            (Driven by DATA_SOURCE in .env.local)
             ┌────────────┴────────────┐
             ▼                         ▼
   DATA_SOURCE === "static"   DATA_SOURCE === "grpc"
             │                         │
             ▼                         ▼
    [ getStaticData() ]        [ resolveServiceContext() ]
    Reads offline mock data    Validates session token & branch
    from mock-service.ts       Dispatches via grpcProcess()
             │                         │
             └────────────┬────────────┘
                          ▼
               [ Zod / Parser Stage ]
               parseGMC() / parseBranchesWirePayload()
                          ▼
               Returns Domain Model (Cached in Redis)
```

---

## 🚀 How to Use

### 1. In API Routes: Fetching Dynamic Form Schemas

```typescript
import { getFormData } from "@/lib/infra-services";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const command = searchParams.get("cmd") || "ACCOUNT";

  // Fetches from Redis cache, falls back to gRPC/mock, parses via GMC
  const schema = await getFormData(command);

  if (!schema) {
    return NextResponse.json({ error: "Form not found" }, { status: 404 });
  }

  return NextResponse.json(schema);
}
```

---

### 2. User Authentication & Login Pipeline

```typescript
import { loginUser } from "@/lib/infra-services";

const result = await loginUser({
  username: "AD028459",
  password: "secure-password",
});

if (result.success) {
  console.log("Logged in:", result.user?.userName, result.user?.branchCode);
} else {
  console.error("Login failed:", result.error);
}
```

---

### 3. Dual-Mode Operation (`DATA_SOURCE`)

You can toggle the entire backend behavior using `.env.local`:

- **Live Mode (`DATA_SOURCE="grpc"`):**
  Connects to the Java Core Banking host via `@grpc/grpc-js` channels.
- **Offline / CI Mode (`DATA_SOURCE="static"`):**
  Instantly serves realistic mock banking fixtures (`mock-service.ts`) without requiring a live VPN or backend server.

---

## 🛡️ Edge Cases & Resilience Handled

1. **Sub-Version Fallback (`form-service.ts`):**
   If an operator navigates to a specialized version (e.g., `USER.MGT,NEW1`) and the backend doesn't have a customized schema for it (404), the service automatically falls back to the base model table `USER.MGT`. The form renders seamlessly instead of failing with an error screen.
2. **Session Context Fail-Fast (`service-context.ts`):**
   `resolveServiceContext()` checks both token and user ID before making downstream network calls. If either is missing, it immediately throws `UNAUTHENTICATED` without wasting network roundtrips.
3. **Cookie Branch Resilience:**
   `resolveServiceContext()` checks the active branch cookie (`cbs_branch`), then falls back to `currUser.branchCode`, and finally to `appConfig.centralBranch`. This ensures multi-branch workstation operations never drop branch context.

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. BFF Gateway Architecture: **SEALED**

Dual-mode switching, session context resolution, version fallback mechanics, and Redis caching patterns are finalized.

### 2. Domain Services: **SCALABLE**

When adding a new business domain (e.g., Loan Product Service):
- Create `loan-service.ts` following the standard `getOrSet()` + `resolveServiceContext()` pattern.
- Add mock fixture to `mock-service.ts` under `getStaticData("LOAN")`.
- Export from `index.ts`.

---

## 🧪 Verification

Run the infrastructure test suite (tests both static and gRPC dual modes):
```bash
pnpm verify:services
```

# 🏛️ FinXUI Core Banking Workbench: Refactoring & Architecture Blueprint

## 1. Objective
The goal is to rebuild the **FinXUI Core Banking Workbench** from a tangled, monolithic-style Next.js application into a clean, modern, efficient, and highly maintainable enterprise application. We will not blindly copy the old project's structure. Instead, we will preserve its business capabilities (gRPC communication, Redis sessions, dynamic form rendering, bespoke workflows) while eliminating architectural weaknesses (flat dumping of components, mixed concerns, redundant data schemas, and fragile configurations).

---

## 2. Required Analysis of the Old Project

### A. Core Business Flow & Intended Behavior
- **Dynamic Schema Rendering**: The workbench loads its UI dynamically by fetching database form configurations (`GMC` payloads) from a live Java SE Core Banking backend over gRPC.
- **Bespoke Overrides**: If a screen requires logic too complex for the dynamic engine (e.g., `INQ.tsx`, `SC.CHANGE.PASS.tsx`), a custom React component overrides the dynamic fallback.
- **Session Management**: User auth tokens, branch IDs, and idempotency keys are managed through a sliding-expiry Redis session.
- **Tab/Window Panel Mode**: Users interact with the workbench either in browser popups (`window`) or an internal tabbed workspace (`panel`).

### B. Identified Weaknesses & Technical Debt
- **The "Syscomp" Dump**: `src/app/(core)/syscomp/` contains 22+ massive, tightly coupled `.tsx` files (some over 70KB) without domain segregation.
- **Mixed Concerns**: Data fetching (gRPC), state management, caching, and UI rendering are dangerously intertwined within components.
- **Schema Duplication**: The project historically juggled camelCase vs. UPPERCASE properties because backend structures evolved independently of frontend mocks.
- **Redundant Clients**: Two separate gRPC clients existed (`src/grpc/client.ts` vs `src/server/grpc-client.ts`), causing collisions.

---

## 3. New Project Design & Architecture

### 3.1 Base Project Setup
- **Framework**: **Next.js App Router (React 18/19)** (Provides built-in server actions, React Server Components, and optimized routing).
- **Language**: **TypeScript (Strict Mode)** (No implicit `any`, strict null checks).
- **Styling**: **Vanilla CSS / TailwindCSS** (Replacing complex styled-components or inline styles for performance).
- **State Management**: **Zustand** (Replacing complex/prop-drilled contexts for the Tab Manager and Workbench state).
- **RPC & Data Transport**: **@grpc/grpc-js** & **ts-proto** (For strictly-typed, server-only backend communication).
- **Caching & Auth**: **ioredis** (For high-speed, secure session stores).
- **Data Validation**: **Zod** (To validate all incoming gRPC payloads at the boundary before they hit the UI).

### 3.2 Project Architecture
**Domain-Driven, Layered Architecture:**
1. **Presentation Layer (Client)**: Dumb UI components (`src/components/ui`) and Smart Feature Domains (`src/features`).
2. **Gateway Layer (Next.js Server)**: Next.js Route Handlers (`/api/proxy`) act as the secure bridge.
3. **Transport Layer (Node.js)**: gRPC Client Singleton (`src/lib/core/grpc`).
4. **Data Dictionary Layer**: Zod schemas (`src/lib/schema`) representing the canonical Core Banking definitions.

**Dependency Direction:**
UI Components $\rightarrow$ Feature Hooks $\rightarrow$ API Route Handlers $\rightarrow$ gRPC Core $\rightarrow$ Java Backend

### 3.3 Complete Directory Structure
```text
finxui-v2/
├── .env.local                     # Environment variables (Centralized)
├── config.yml                     # Service Address Resolver configs
├── src/
│   ├── app/                       # Next.js App Router (Pure Routing)
│   │   ├── (auth)/login/          # Login Page
│   │   ├── (core)/                # Authenticated Workbench Layout
│   │   └── api/                   # Server API Boundaries
│   │       ├── proxy/route.ts     # Secure gRPC forwarder
│   │       └── model/[cmd]/       # Schema loader endpoint
│   │
│   ├── components/                # Reusable, Domain-Agnostic UI
│   │   ├── ui/                    # Atomic (Button, Input, Select, Table)
│   │   └── layout/                # Shell, Sidebar, TabBar
│   │
│   ├── features/                  # Domain-Driven Business Logic (Replacement for syscomp)
│   │   ├── auth/                  # Change Pass, Auth flows
│   │   ├── inquiries/             # INQ, GIR, SIR
│   │   ├── reporting/             # SC.REPORT.LINE
│   │   ├── system-config/         # SC.MODEL.CONFIG, SC.MENU.DESIGN
│   │   └── engine/                # sc-dynamic.tsx (Dynamic Form Builder)
│   │
│   ├── lib/                       # Core Infrastructure & Tools
│   │   ├── core/                  # grpc client, redis client, sessions
│   │   ├── schema/                # Zod validation schemas & types
│   │   └── utils/                 # Formatting, classnames (clsx)
│   │
│   └── store/                     # Zustand Global Stores (Workbench Tabs)
```

---

## 4. Feature / Module Migration Mapping

| Old Implementation | New Location | Action | Reason |
| :--- | :--- | :--- | :--- |
| `src/app/(core)/syscomp/SC.DYNAMIC.tsx` | `src/features/engine/DynamicForm.tsx` | **Refactor** | Must be decoupled from raw API calls. Will solely accept parsed schemas as props. |
| `src/app/(core)/syscomp/INQ.tsx` | `src/features/inquiries/InquiryEngine.tsx` | **Redesign** | Massive file. Break into smaller components: InquiryFilters, InquiryResultsTable. |
| `src/server/grpc-client.ts` | **Removed** | **Remove** | Duplicated logic. Consolidate entirely into `src/lib/core/grpc.ts`. |
| `src/server/model-source.ts` | `src/lib/schema/schema-parser.ts` | **Refactor** | Enforce strict UPPERCASE parsing. Strip legacy camelCase fallbacks. |
| `src/lib/model/static-specs.ts` | `src/lib/schema/static-mocks.ts` | **Keep** | Retain for offline dev, but format strictly matching DB schemas. |
| Tab Manager / Component View | `src/store/workbench-store.ts` | **Replace** | Replace heavy context providers with a lightweight Zustand store. |

---

## 5. Process Modernization

### Schema Fetching & Validation
- **Old Approach**: `model-source.ts` manually mapped fields using nullish coalescing `??` across 3-4 possible legacy names.
- **New Approach**: **Should Replace**. Use `Zod` schemas to validate the raw `GMC` payload exactly as the Java backend sends it. If it fails validation, it drops early, preventing runtime React crashes.

### Component Routing & Registry
- **Old Approach**: A global `component-registry.ts` hardcoded mapping strings to massive React imports.
- **New Approach**: **Should Refactor**. Use React `lazy()` or Next.js `dynamic()` imports for the feature domains so the browser doesn't load a 5MB bundle of every bespoke screen on startup.

### State Management
- **Old Approach**: Passing props infinitely down the tree or using heavy React Context for active tabs.
- **New Approach**: **Should Replace**. Use `Zustand` for the `TabManager`. The state lives outside the React tree, vastly improving rendering performance when switching tabs.

---

## 6. Data, State, & Security Architecture

- **State**:
  - **Server State**: React Server Components (RSC) fetch initial schemas. Client-side mutations are handled via standard React hooks talking to `/api/proxy`.
  - **Client State**: UI interactions (typing, opening menus) are local state. Tab management is Zustand global state.
- **Security**:
  - Browser **NEVER** communicates with gRPC directly.
  - Auth tokens are stored securely in Redis, keyed by an HTTP-only secure cookie session ID. The browser only holds a session ID.
- **Integration (gRPC)**:
  - All outgoing requests to Java Core are routed through a single `dispatch(ProcessKind, Payload)` function to ensure consistent idempotency key and trace ID injection.

---

## 7. Development & Migration Strategy

**Practical Step-by-Step Order for the Developer:**

### Step 1: The Core Foundation
1. Bootstrap Next.js App Router (`finxui-v2`).
2. Setup `.env.local` and `config.yml` loader.
3. Build the `Zustand` store for Tab Management.
4. Build the core layout (Sidebar, Tab Header, Empty Main View).

### Step 2: The Secure Bridge (Infrastructure)
1. Setup `ioredis` client and session manager (`src/lib/core/redis-session.ts`).
2. Generate protobuf stubs (`ts-proto`).
3. Build the singleton gRPC client (`src/lib/core/grpc.ts`).
4. Build `/api/proxy/route.ts` and verify connection to Java backend.

### Step 3: The Dynamic Engine (The Heart)
1. Build `schema-parser.ts` using strict `Zod` validation matching the UPPERCASE DB model.
2. Build Atomic UI Components (`src/components/ui/Input.tsx`, `Select.tsx`).
3. Build `src/features/engine/DynamicForm.tsx` to automatically render those atomic components based on the parsed schema.

### Step 4: Iterative Feature Porting
1. Port authentication (Login / Logout).
2. Port static/bespoke screens (`syscomp/*`) one by one into their respective `src/features/[domain]/` folders.
3. For each port: Extract pure UI, move data fetching to `/api/proxy`, and register via lazy-loading.

---

### Final Blueprint Validation Check
**Did we lose functionality?** No. gRPC payloads, dynamic rendering, custom overrides, and session management remain identical in purpose.
**Did we inherit bad practices?** No. We eliminated flat dumping, mixed concerns, and schema inconsistencies.
**Priority:** Correctness $\rightarrow$ Simplicity $\rightarrow$ Maintainability $\rightarrow$ Performance $\rightarrow$ Scalability.

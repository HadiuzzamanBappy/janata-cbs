# 🏛️ Janata CBS Core Banking Workbench (v2)
## Senior Developer Takeover & Architecture Questionnaire

> This document contains the **8 Critical Takeover Questions** designed for an experienced Next.js / Full-Stack developer stepping in to take ownership of this codebase from start to end without gaps.

---

### 1. The Entry Point & BFF Boundary
> **"When a user opens a screen or clicks 'Submit' on a form, walk me through the full request lifecycle from the browser to the backend."**

* **What to inspect:**
  * Which client hook/service triggers the request?
  * Exactly which route handler (`src/app/api/...`) or Server Action receives it?
  * Where does the `server-only` boundary kick in, and where does it translate that HTTP payload into the gRPC client call?
* **Exact Code Targets:**
  * The UI submit trigger (`src/features/operations/forms/ops-form.tsx` & `use-form-actions.ts`).
  * The isomorphic client gateway (`src/lib/cbs-client/transport/proxy-client.ts`).
  * The BFF route handler (`src/app/api/proxy/route.ts`).
  * The server-only gRPC dispatcher (`src/lib/infra-grpc/dispatch.ts`).
  * The gRPC client channel pool and error mapper (`src/lib/infra-grpc/client.ts`).

---

### 2. The Dynamic Schema-Driven Engine (The Heart of the App)
> **"Show me how a dynamic form configuration travels from raw definition to being rendered as interactive UI on screen."**

* **What to inspect:**
  * Where is the schema parsed and validated before rendering? (e.g. `form-config-schema.ts`).
  * Which component takes that validated config and iterates over the 12-column grid?
  * How does the field factory know whether to render a text input, dropdown, date picker, or custom component?
* **Exact Code Targets:**
  * The root schema-parser function (`src/lib/data-parsers/gmc-parser.ts`).
  * The container component that iterates the fields (`src/features/operations/forms/components/form-grid.tsx`).
  * The field registry and factory components (`src/features/operations/forms/components/fields/*`).

---

### 3. Screen Registration & Dynamic Loading
> **"If the backend asks to load screen code `'ACC_OPEN_01'`, how does the frontend decide what component to render?"**

* **What to inspect:**
  * Where is the single unified `ComponentLoader`?
  * How does the code decide between a purely dynamic schema form vs. a hardcoded custom override component?
  * Where is the screen registry where bespoke screens are mapped?
* **Exact Code Targets:**
  * The screen registry map file (`src/features/screens/registry.tsx`).
  * The dynamic loader component (`src/features/screens/loader.tsx`).
  * The command launcher (`src/features/screens/launcher.ts`).

---

### 4. Dual-Mode Workspace & Multi-Tab State
> **"How do you handle Tab state, and what happens when an officer switches between internal tabs (`panel` mode) vs. popup windows (`window` mode)?"**

* **What to inspect:**
  * Where does the launcher decide whether to open a browser window or spawn a new tab in the shell?
  * In the Zustand store, how is individual tab state (form dirty state, input values, active tab index) kept isolated so one tab doesn't bleed state into another?
  * What happens to form state when a tab is unmounted or hidden?
* **Exact Code Targets:**
  * The launcher function (`src/features/screens/launcher.ts`).
  * The Zustand store managing tabs and panel state (`src/store/workbench/workbench-store.ts`).
  * Tabbar and shell layout components (`src/components/layout/tabbar/*`).

---

### 5. Offline Mocks vs. Live gRPC Switching
> **"How does the app toggle between live gRPC and static fixture data (`MODEL_SOURCE=grpc` vs `static`)?"**

* **What to inspect:**
  * Where is `MODEL_SOURCE` checked in runtime?
  * Where are the mock data loaders located (e.g. `fixtures/form-configs.ts`)?
  * Does the switch happen transparently at the service layer, or does the API route handle the branching?
* **Exact Code Targets:**
  * Configuration validation (`src/lib/core-config/server.ts`).
  * The mock provider service (`src/lib/infra-services/mock-service.ts`).
  * Static fixtures directory (`fixtures/*`).

---

### 6. Caching & Circuit Breaker Logic
> **"Walk me through the Redis caching strategy and the fail-open circuit breaker."**

* **What to inspect:**
  * Where is the Redis client initialized with the circuit breaker?
  * If Redis crashes mid-session, where is the catch block that falls through directly to the Java backend without returning a 500 to the user?
  * How and when are cache keys invalidated?
* **Exact Code Targets:**
  * The Redis client wrapper (`src/lib/infra-redis/client.ts`).
  * Cache utilities and get-or-set fallbacks (`src/lib/infra-redis/cache.ts`).
  * Cache invalidation endpoint (`src/app/api/cache/route.ts`).

---

### 7. Form Validation & Submission Payload Building
> **"When a user types into a dynamic form, how is field-level validation and form submission handled?"**

* **What to inspect:**
  * Are you using React Hook Form, TanStack Form, or custom state in Zustand?
  * How are backend-defined validation rules (required, min/max, regex pattern, cross-field dependencies) applied at runtime?
  * Where does the form assemble the final payload before dispatching?
* **Exact Code Targets:**
  * Form state hook (`src/features/operations/forms/hooks/use-form-state.ts`).
  * Form actions hook (`src/features/operations/forms/hooks/use-form-actions.ts`).
  * Record delta calculation helper (`src/lib/cbs-record/delta.ts`).

---

### 8. Authentication, Session & Workstation Rights
> **"How does the app protect routes and verify officer permissions per branch/screen?"**

* **What to inspect:**
  * Is route protection handled in `middleware.ts` or inside layout wrappers?
  * Where is the officer's token/session stored (HTTP-only cookie, Redis session store)?
  * How does a screen check if the officer has permission to view or execute a specific transaction?
* **Exact Code Targets:**
  * Next.js route protection middleware (`src/middleware.ts` / layout wrappers).
  * Session retrieval and Redis session store (`src/lib/infra-redis/session.ts`).
  * Role and right validation guards (`src/lib/cbs-access/record-guard.ts`).

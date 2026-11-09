# Janata CBS Workbench — Intern Developer Master Curriculum & Study Plan

> **Purpose**: A comprehensive, self-contained educational curriculum for an intern developer joining the **Janata CBS** engineering team.
> **Guiding Principle**: Zero generic fluff, but **100% complete coverage** of every language, library, framework, and design pattern used in this project.
> Once completed, the intern will thoroughly understand every concept, type signature, and tool used in this repository and can build and debug features even completely offline.

---

## Table of Contents

1. [Study Track Overview & Progression](#1-study-track-overview--progression)
2. [Phase 1: Language & Type System Mastery (TypeScript 5.9+)](#phase-1-language--type-system-mastery-typescript-59)
3. [Phase 2: Modern Styling & Density (Tailwind CSS v4 & OKLCH)](#phase-2-modern-styling--density-tailwind-css-v4--oklch)
4. [Phase 3: React 19 Core & Advanced Component Architecture](#phase-3-react-19-core--advanced-component-architecture)
5. [Phase 4: Next.js 16 (App Router) & Backend-for-Frontend (BFF)](#phase-4-nextjs-16-app-router--backend-for-frontend-bff)
6. [Phase 5: State Management & Client Stores (Zustand 5 & Context)](#phase-5-state-management--client-stores-zustand-5--context)
7. [Phase 6: Server State, Caching & Data Layer (TanStack Query v5)](#phase-6-server-state-caching--data-layer-tanstack-query-v5)
8. [Phase 7: Schema Validation & Invariant Modeling (Zod 4)](#phase-7-schema-validation--invariant-modeling-zod-4)
9. [Phase 8: Drag-and-Drop Interaction Engineering (@dnd-kit)](#phase-8-drag-and-drop-interaction-engineering-dnd-kit)
10. [Phase 9: Enterprise Server Infrastructure (gRPC, Protobuf & Redis)](#phase-9-enterprise-server-infrastructure-grpc-protobuf--redis)
11. [Phase 10: Banking Domain Architecture & Headless Engines](#phase-10-banking-domain-architecture--headless-engines)
12. [Graduation Project: Independent Verification & Screen Build](#12-graduation-project-independent-verification--screen-build)

---

## 1. Study Track Overview & Progression

| Phase        | Core Subject                | Why It Matters in Janata CBS                                                  | Estimated Study Time |
| :----------- | :-------------------------- | :---------------------------------------------------------------------------- | :------------------- |
| **Phase 1**  | **TypeScript 5.9 (Strict)** | Zero `any` policy, discriminated unions for wire blocks & command parsing.    | 4 Days               |
| **Phase 2**  | **Tailwind CSS v4**         | OKLCH tokens, 12-col responsive grids, 1366x768 workstation density.          | 3 Days               |
| **Phase 3**  | **React 19 Deep Dive**      | Actions, `useActionState`, `useOptimistic`, pure memoization, context trees.  | 5 Days               |
| **Phase 4**  | **Next.js 16 App Router**   | Async request APIs, Route Handlers, `"server-only"` boundary, BFF Proxy.      | 5 Days               |
| **Phase 5**  | **Zustand 5 State Stores**  | Two-tier form state (keystroke isolation), MDI Workbench tab management.      | 4 Days               |
| **Phase 6**  | **TanStack Query v5**       | Server-state caching, lookup prefetching, dynamic query cancellation.         | 3 Days               |
| **Phase 7**  | **Zod 4 Runtime Contracts** | Runtime validation of untrusted core responses, type inferencing (`z.infer`). | 3 Days               |
| **Phase 8**  | **@dnd-kit Engineering**    | Visual Form Designer & Menu Designer drag-drop tree reordering.               | 4 Days               |
| **Phase 9**  | **gRPC, Protobuf & Redis**  | HTTP/2 binary transport, Redis session stores & circuit breaker fallback.     | 4 Days               |
| **Phase 10** | **CBS Domain Engines**      | RIDASHL access matrix, Four-Eyes, touch-only record diffs, GMC compiler.      | 5 Days               |

---

## Phase 1: Language & Type System Mastery (TypeScript 5.9+)

### Core Concepts to Learn

1. **Strict Type Narrowing & Discriminated Unions:**
   - How TypeScript uses literal discriminant fields (`type: "field" | "card" | "tab-group"`).
   - Exhaustive type checking with the `never` type in `switch` statements.
2. **Generics & Constraints:**
   - Constrained generics: `<T extends Record<string, unknown>>`.
   - Generic factory signatures used in `@/lib/cbs-client` and `@/lib/cbs-record`.
3. **Advanced Utility Types:**
   - `Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `Record<K, V>`.
   - Conditional types: `T extends infer U ? ... : ...`.
   - Template literal types for command grammar (e.g. `` `${CbsVerb} ${string}` ``).
4. **Zero-Assertion Discipline:**
   - Why type casting (`as SomeType`) hides bugs and is forbidden in our quality gates.
   - Using type guards (`isRenderField(block): block is RenderField`) instead of casts.

### Homework & Practical Drills

- [ ] **Drill 1.1**: Build a discriminated union modeling a banking transaction with 3 types (`Deposit`, `Withdrawal`, `Transfer`). Write an exhaustive processor function that computes fees and fails at compile time if a new transaction type is added.
- [ ] **Drill 1.2**: Write a generic object diff function `diff<T extends object>(baseline: T, current: T): Partial<T>` that recursively extracts only changed primitive properties without using `any`.
- [ ] **Codebase Inspection**: Read [`src/lib/cbs-form-spec/layout-blocks.ts`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-form-spec/layout-blocks.ts) to see how `RenderBlock` discriminated unions are typed and narrowed.

---

## Phase 2: Modern Styling & Density (Tailwind CSS v4 & OKLCH)

### Core Concepts to Learn

1. **Tailwind CSS v4 Architecture:**
   - The new `@theme` directive in CSS replacing `tailwind.config.js`.
   - Modern color spaces: **OKLCH** vs sRGB/HSL (perceptual lightness uniformity).
2. **Semantic Design Tokens:**
   - Color abstractions: `bg-card`, `bg-popover`, `text-muted-foreground`, `border-border`, `bg-primary/10`.
   - Never hardcoding numeric hex/palette values (e.g. forbid `bg-blue-600` or `#1e40af`).
3. **Banking Compact Density Conventions:**
   - Workstation density: compact `h-8` / `h-9` inputs, `text-xs`, tight padding (`px-2 py-1`).
   - Tabular and numerical data: `font-mono` and `tabular-nums` alignment for financial figures.
   - Screen resolution resilience: ensuring layouts work flawlessly on 1366x768 teller terminals up to 4K displays.
4. **12-Column Responsive Layout Grid:**
   - Fluid grid columns (`grid grid-cols-12 gap-2`).
   - Field spans (`col-span-12 sm:col-span-6 md:col-span-4 lg:col-span-3`).
   - Class merging via `cn()` (`clsx` + `tailwind-merge`).

### Homework & Practical Drills

- [ ] **Drill 2.1**: Construct a pure HTML/Tailwind form row containing 4 banking inputs: Account Number (4 cols), Currency (2 cols), Amount (3 cols), and Status Badge (3 cols) using OKLCH semantic tokens.
- [ ] **Drill 2.2**: Write a Tailwind utility class composition that displays money values with right-aligned monospace numbers, subtle currency symbols, and green/red OKLCH indicators for positive/negative balances.
- [ ] **Codebase Inspection**: Study [`src/app/globals.css`](file:///d:/Work/React/cbs/janata-cbs/src/app/globals.css) and [`src/features/form-engine/components/field-grid.tsx`](file:///d:/Work/React/cbs/janata-cbs/src/features/form-engine/components/field-grid.tsx).

---

## Phase 3: React 19 Core & Advanced Component Architecture

### Core Concepts to Learn

1. **React 19 Server & Client Mental Model:**
   - `"use client"` vs `"use server"` vs `"server-only"`.
   - Where components execute and the serialization boundary across props.
2. **React 19 Hooks & Primitives:**
   - `useActionState`: Managing asynchronous form transitions and server responses.
   - `useOptimistic`: Instant UI updates for banking operations with automatic rollback on error.
   - Direct Context reading with the `use()` hook.
   - Passing Promises as props and resolving them inside `<Suspense>`.
3. **High-Performance Form Re-render Prevention:**
   - Understanding why traditional `onChange` at form root thrashes 500+ fields.
   - React state colocation: keeping draft keystroke states inside atomic widgets.
   - `useRef` vs reactive Zustand subscriptions for non-visual mutable tracking.
4. **Compound Component Patterns:**
   - Building accessible primitives (Tabs, Accordions, Dialogs) using `@base-ui/react` and Radix foundations.

### Homework & Practical Drills

- [ ] **Drill 3.1**: Build a parent form with 100 inputs where typing in Input #1 does _not_ trigger a re-render of Input #2 through #100. Verify with React DevTools profiler.
- [ ] **Drill 3.2**: Create an action form using React 19's `useActionState` that submits a mock deposit, shows an optimistic status indicator with `useOptimistic`, and gracefully rolls back if the action rejects.
- [ ] **Codebase Inspection**: Review [`src/features/form-engine/components/field-atom.tsx`](file:///d:/Work/React/cbs/janata-cbs/src/features/form-engine/components/field-atom.tsx) to see how atomic field subscription is achieved.

---

## Phase 4: Next.js 16 (App Router) & Backend-for-Frontend (BFF)

### Core Concepts to Learn

1. **Next.js 16 Asynchronous Request APIs (Crucial Breaking Change!):**
   - In Next.js 16, `cookies()`, `headers()`, `params`, and `searchParams` are Promises and **must be awaited**:

     ```ts
     const cookieStore = await cookies();
     const { id } = await params;
     ```

2. **Route Handlers (`app/api/*/route.ts`):**
   - Handling `GET`, `POST`, `PUT`, `DELETE` via `NextRequest` and `NextResponse`.
   - Streaming responses and binary Protobuf responses.
3. **The BFF Proxy Architecture:**
   - Why browsers NEVER speak directly to backend microservices or core banking engines.
   - Centralized proxying via `app/api/proxy/route.ts`.
   - Passing session cookies, injecting operator audit headers, and handling core timeouts.
4. **Middleware & Route Guards:**
   - Session validation and redirecting unauthenticated operators to `/login`.

### Homework & Practical Drills

- [ ] **Drill 4.1**: Create a Next.js 16 Route Handler that parses an asynchronous route parameter `params`, reads an authenticated HTTP-only cookie, and validates the request body using a schema.
- [ ] **Drill 4.2**: Implement a proxy route that accepts a JSON command from the client, validates the caller's session token, stamps `x-operator-id` and `x-branch-code` headers, and forwards to a mock backend.
- [ ] **Codebase Inspection**: Study [`src/app/api/proxy/route.ts`](file:///d:/Work/React/cbs/janata-cbs/src/app/api/proxy/route.ts) and [`src/proxy.ts`](file:///d:/Work/React/cbs/janata-cbs/src/proxy.ts).

---

## Phase 5: State Management & Client Stores (Zustand 5 & Context)

### Core Concepts to Learn

1. **Zustand 5 Architecture:**
   - Creating slice-based Zustand stores with `create()`.
   - Scoped stores using React Context (`createStore` factory + `useStore(selector)`).
   - Why global singleton stores are dangerous for multi-tab MDI interfaces (tabs overwrite each other).
2. **Two-Tier Form State Pattern:**
   - **Tier 1 (Kernel/Draft State):** Isolated inside `FormKernelStore`. Holds raw keystrokes without notifying parent.
   - **Tier 2 (Record State):** Baseline snapshot and committed records.
3. **Selector Optimization:**
   - Extracting only necessary state: `useWorkbenchStore((s) => s.activeTabId)`.
   - Preventing unnecessary component renders when unrelated state slices change.

### Homework & Practical Drills

- [ ] **Drill 5.1**: Build a scoped tab store factory where each browser tab instance has its own isolated form values, dirty flags, and history, even when rendering two forms simultaneously on the same screen.
- [ ] **Drill 5.2**: Implement an Undo/Redo history stack in Zustand for a form field without causing excessive heap allocations.
- [ ] **Codebase Inspection**: Read [`src/features/form-engine/store/form-kernel-store.ts`](file:///d:/Work/React/cbs/janata-cbs/src/features/form-engine/store/form-kernel-store.ts) and [`src/store/workbench/workbench-store.ts`](file:///d:/Work/React/cbs/janata-cbs/src/store/workbench/workbench-store.ts).

---

## Phase 6: Server State, Caching & Data Layer (TanStack Query v5)

### Core Concepts to Learn

1. **Query Key Factories:**
   - Structured hierarchical query keys: `['form-config', screenId]`, `['lookup', tableName]`.
2. **Stale Time vs Garbage Collection Time (gcTime):**
   - CBS configuration data (rarely changes): long `staleTime: 10 * 60 * 1000`.
   - Transactional account balances (volatile): zero `staleTime`.
3. **Query Invalidation & Optimistic Mutations:**
   - Invalidating query caches after commit (`queryClient.invalidateQueries`).
   - Aborting in-flight queries when an operator switches screens or cancels an inquiry (`AbortSignal`).

### Homework & Practical Drills

- [ ] **Drill 6.1**: Implement a custom hook `useModelLookup(tableName, filter)` with TanStack Query that caches results for 15 minutes, deduplicates requests across multiple dropdowns, and supports keyboard filtering.
- [ ] **Drill 6.2**: Write an inquiry hook with TanStack Query that cancels pending HTTP requests whenever the operator changes a filter parameter before the previous response returns.
- [ ] **Codebase Inspection**: Check [`src/features/system/form-config/hooks/use-fc-catalog.ts`](file:///d:/Work/React/cbs/janata-cbs/src/features/system/form-config/hooks/use-fc-catalog.ts).

---

## Phase 7: Schema Validation & Invariant Modeling (Zod 4)

### Core Concepts to Learn

1. **Zod Runtime Type Inference:**
   - Generating TypeScript contracts from schemas: `type FormConfig = z.infer<typeof formConfigSchema>;`.
2. **Safe Parsing vs Throwing:**
   - Why core banking APIs should use `.safeParse()` instead of `.parse()` to avoid unhandled runtime crashes.
   - Formatting Zod errors into user-friendly validation checklists (`zodError.format()`).
3. **Complex Zod Validations:**
   - Refinements (`.refine()`, `.superRefine()`) for cross-field business logic (e.g. `startDate <= endDate`).
   - Custom transforms and defaults for handling nullable backend responses.

### Homework & Practical Drills

- [ ] **Drill 7.1**: Write a Zod schema validating a Bank Loan Application: Applicant Name (min 3 chars), Monthly Income (> 0), Loan Amount (> 0), and a refinement rule ensuring Loan Amount cannot exceed 10x Monthly Income.
- [ ] **Drill 7.2**: Write a schema that validates an API response which could be either a success payload or a banking core error envelope, generating typed discriminated unions.
- [ ] **Codebase Inspection**: Study all schemas in [`src/lib/data-schemas/`](file:///d:/Work/React/cbs/janata-cbs/src/lib/data-schemas/).

---

## Phase 8: Drag-and-Drop Interaction Engineering (@dnd-kit)

### Core Concepts to Learn

1. **@dnd-kit Architecture:**
   - `DndContext`, `Sensors` (Pointer, Keyboard), `CollisionDetection` (closestCenter, rectIntersection).
   - Draggable (`useDraggable`) vs Droppable (`useDroppable`) vs Sortable (`useSortable`).
2. **Visual Feedback & Drag Overlays:**
   - Using `<DragOverlay>` to render smooth, floating clones while dragging without disrupting grid layout.
   - Calculating drop indicators between blocks (`between-block-drop-zone.tsx`).
3. **Tree & Nested Container Reordering:**
   - Handling drop operations across different hierarchy levels:
     - Dropping a field directly onto the Root Canvas.
     - Dropping a field inside a Section Card.
     - Dropping a field inside a specific Tab in a Tab Group.
   - Moving whole containers and tabs without losing child items.

### Homework & Practical Drills

- [ ] **Drill 8.1**: Create a small two-column sortable list using `@dnd-kit/sortable` where items can be reordered within a column or dragged across columns.
- [ ] **Drill 8.2**: Implement a canvas where items can either be dropped freely or placed into a grouped box, updating an underlying hierarchical data structure immutably.
- [ ] **Codebase Inspection**: Study [`src/features/system/form-config/components/designer/designer-canvas.tsx`](file:///d:/Work/React/cbs/janata-cbs/src/features/system/form-config/components/designer/designer-canvas.tsx) and [`src/features/system/menu-designer/hooks/use-canvas-dnd.ts`](file:///d:/Work/React/cbs/janata-cbs/src/features/system/menu-designer/hooks/use-canvas-dnd.ts).

---

## Phase 9: Enterprise Server Infrastructure (gRPC, Protobuf & Redis)

### Core Concepts to Learn

1. **gRPC Protocol & Protobuf:**
   - Why core banking uses HTTP/2 gRPC instead of standard REST (binary efficiency, strict contracts, multiplexing).
   - Reading `.proto` files (`proto/service.proto`).
   - Generating TypeScript stubs with `ts-proto` (`pnpm proto:gen`).
2. **Server-Side Redis Operations:**
   - Distributed session storage with TTLs.
   - Read-through caching of menu trees and form configurations.
   - **Fail-Open Circuit Breakers**: If Redis goes down, the banking application must continue functioning gracefully with in-memory fallbacks rather than crashing.
3. **Structured Logging & PII Redaction:**
   - Regulatory requirements for masking Personally Identifiable Information (PII).
   - Auto-redacting account numbers, passwords, and tokens before logging to console or file.

### Homework & Practical Drills

- [ ] **Drill 9.1**: Write a Protobuf definition for an Account Balance inquiry service. Compile it to TypeScript stubs using `ts-proto`.
- [ ] **Drill 9.2**: Write a Redis cache wrapper function with an automatic circuit breaker: if Redis does not respond within 300ms, execute the fallback fetcher and return data seamlessly.
- [ ] **Codebase Inspection**: Read [`src/lib/infra-grpc/client.ts`](file:///d:/Work/React/cbs/janata-cbs/src/lib/infra-grpc/client.ts), [`src/lib/infra-redis/cache.ts`](file:///d:/Work/React/cbs/janata-cbs/src/lib/infra-redis/cache.ts), and [`src/lib/core-logger/redact.ts`](file:///d:/Work/React/cbs/janata-cbs/src/lib/core-logger/redact.ts).

---

## Phase 10: Banking Domain Architecture & Headless Engines

### Core Concepts to Learn

1. **The RIDASHL Security Matrix:**
   - `R` (Read), `I` (Input), `D` (Delete), `A` (Authorize), `S` (Select), `H` (Hold), `L` (List).
   - Clearance levels (1 through 9).
   - How action bar buttons (`action-buttons.tsx`) dynamically enable/disable based on operator rights.
2. **Four-Eyes Principle (Maker-Checker):**
   - The user who created or last modified a record (`Maker`) can **never** authorize that record (`Checker`).
   - How `record-guard.ts` detects maker collision and displays a contextual explanation tooltip.
3. **Delta Mutation Calculation (`cbs-record`):**
   - Why banking cores forbid sending full JSON records on edit (race condition protection and audit integrity).
   - Taking a deep baseline snapshot when a record is fetched.
   - Computing the mathematical diff: sending **only** the touched fields in the update payload.
4. **Form Spec Compilation (`cbs-form-spec`):**
   - The separation between **Data Model** (metamodel columns, types, lengths) and **Form Config** (visual order, widgets, tabs, cards).
   - The compilation pipeline transforming raw specs into `RenderBlock[]`.

### Homework & Practical Drills

- [ ] **Drill 10.1**: Test the Maker-Checker rule: Write a function `canAuthorize(record, currentUser)` that rejects authorization if `record.inputter === currentUser.id` or if `currentUser.clearance < record.requiredClearance`.
- [ ] **Drill 10.2**: Run the delta mutation engine: Take an account record with 20 fields. Change 1 field. Verify that `calculateFormDelta()` outputs an object with only that 1 modified field.
- [ ] **Codebase Inspection**: Study [`src/lib/cbs-access/record-guard.ts`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-access/record-guard.ts) and [`src/lib/cbs-record/delta-engine.ts`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-record/delta-engine.ts).

---

## 12. Graduation Project: Independent Verification & Screen Build

To graduate from the study plan and become a fully capable contributor on Janata CBS, the intern must complete the following comprehensive project completely:

### Phase 1: Pass All Domain Verification Harnesses

Run the complete standalone verification suite and understand why each suite exists:

```bash
pnpm verify:all
```
Ensure all 13 suites pass cleanly:

1. `verify:access` (RIDASHL & Maker-Checker)
2. `verify:record` (Delta mutations & diffing)
3. `verify:form-spec` (GMC layout compiler)
4. `verify:command` (Command grammar & aliases)
5. `verify:client` (Wire request payload factories)
6. `verify:parsers` (Wire decoders & Protobuf unpackers)
7. `verify:schemas` (Zod runtime schemas)
8. `verify:config` (Environment matrix)
9. `verify:logger` (PII redaction)
10. `verify:utils` (Currency, date, account masking)
11. `verify:grpc` (Transport client)
12. `verify:mock` (Offline mock engine & fixtures)
13. `verify:screen` (Screen state lifecycle)

### Phase 2: Build an Operational Feature Offline

Even without an active internet connection or live Java server:

1. Enable mock core mode in `.env.local`:

   ```env
   CBS_MOCK_CORE=true
   ```
2. Create a new banking domain screen (e.g. `FX.TRADE` - Foreign Exchange Spot Trade).
3. Register the model schema in `mock/db/SC_MODEL_CONFIG.ts`.
4. Register the visual presentation layout in `mock/db/SC_FORM_CONFIG.ts`.
5. Register the screen mapping in `src/features/workbench/registry.tsx`.
6. Add the navigation command in `mock/db/SC_CONTROL.ts`.
7. Launch `pnpm dev`, open the Command Gateway (`Ctrl+K`), type `FX.TRADE`, and verify:
   - Form fields render with 12-column grid density.
   - Money amounts format automatically with monospace font.
   - Making an edit creates a touch-only delta payload on save.
   - Quality gates pass: `pnpm lint:fix`, `pnpm typecheck`, `pnpm verify:all`.

# 🛡️ Janata CBS Workbench — Master Architecture & Security Audit Checklist

> **Purpose:** This document is the authoritative engineering and security checklist for the **Janata CBS Core Banking Workbench (`finx-ui`)**. Use this checklist during code reviews, refactoring phase gates, security audits, and agentic coding sessions to ensure the codebase remains **modular, centralized, simplified, dead-code-free, and resilient against security breaches**.

---

## 📋 Table of Contents

1. [Pillar 1: Security & Anti-Breach Governance](#1-security--anti-breach-governance)
2. [Pillar 2: Centralization & Single Source of Truth (DRY)](#2-centralization--single-source-of-truth-dry)
3. [Pillar 3: Modularity & Layer Discipline](#3-modularity--layer-discipline)
4. [Pillar 4: Dead Code & "Zero Legacy" Elimination](#4-dead-code--zero-legacy-elimination)
5. [Pillar 5: Simplification & Complexity Reduction](#5-simplification--complexity-reduction)
6. [Automated Audit Command Suite](#6-automated-audit-command-suite)

---

## 1. Security & Anti-Breach Governance

In an enterprise banking system, data corruption and security breaches originate from unchecked trust boundaries, maker-checker bypasses, token leaks, and cross-window state manipulation.

### 1.1 Trust Boundary Validation (Zod Defense)

- [ ] **Zero Unchecked Boundary Payloads**: Every external input into the BFF proxy (`/api/proxy`), route parameters, URL `searchParams`, and cross-window events (`BroadcastChannel`, `postMessage`) **must** pass Zod `.safeParse()`.
- [ ] **No Naked Casts at Boundaries**: Never use `as Type` on external query strings or storage values (e.g., `searchParams.get("mode") as CbsScreenMode` is strictly banned; use `cbsScreenModeSchema.safeParse(...)`).
- [ ] **Audit Command**:

  ```bash
  grep -rn 'searchParams\.get' src/app | grep 'as '
  ```

  _Target: 0 matches._

### 1.2 Maker-Checker Principle (Four-Eyes Enforcement)

- [ ] **Strict Segregation of Duties**: A user whose `userId` matches the transaction's `recordInputter` or who authored the current working draft can **never** authorize that same transaction.
- [ ] **Centralized Logic**: Four-Eyes validation must exclusively evaluate through `@/lib/cbs-access` (`evaluateCbsAccess`).
- [ ] **UI Explanations**: When authorization is locked due to Four-Eyes, surface an explicit `<Tooltip>`: _"Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction."_
- [ ] **Dual-Gate Verification**: Even if a compromised client toggles a disabled button in DevTools, the backend proxy (`/api/proxy`) must reject the authorization with HTTP 403 / Domain Access Error.

### 1.3 Strict Server-Side Boundary (`"server-only"`)

- [ ] **Driver Isolation**: Packages dealing with transport and databases (`@grpc/grpc-js`, `ioredis`, internal network endpoints, secrets) must remain strictly server-side and import `"server-only"`.
- [ ] **Client Immunity**: The browser bundle must never import or pack backend proto stubs or Redis connection instances.

### 1.4 Cross-Window & Multi-Tab Isolation

- [ ] **Origin Verification**: Every `window.addEventListener("message", ...)` must check `if (e.origin !== window.location.origin) return;`.
- [ ] **Detached Popup Protection**: Popups must never be exposed to public query string parameters that leak tokens or customer balances. Large working payloads must travel through centralized session storage (`cbsStorage`), keyed by unpredictable tab IDs (`tabId`), never in URL query strings.
- [ ] **No Immediate Deletion Race**: Never delete a staged draft in the opener window before the detached window has mounted and claimed the payload.

### 1.5 Banking-Grade Logging & PII Redaction

- [ ] **Zero Raw `console.*`**: `console.log`, `console.warn`, and `console.error` are banned in production code. All logs must use `@/lib/core-logger` (`logger.*`).
- [ ] **PII Masking**: Customer passwords, national IDs, PAN/card numbers, account numbers, and JWT session tokens must be automatically masked by the logging engine before emission.
- [ ] **Audit Command**:

  ```bash
  grep -rn 'console\.' src | grep -v 'core-logger'
  ```

  _Target: 0 matches._

---

## 2. Centralization & Single Source of Truth (DRY)

Whenever domain logic is duplicated, branches drift, inconsistencies arise, and security patches fail to cover all call sites.

| Domain Area               | Canonical Single Source                                                                               | Forbidden Anti-Patterns                                                                                    |
| :------------------------ | :---------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Record Editability**    | `@/lib/cbs-access` (`isRecordEditable`, `evaluateCbsAccess`)                                          | Hardcoding `mode !== CbsRecordFunction.INPUT` across multiple screen/designer files.                       |
| **Storage & Caching**     | `@/lib/core-utils` (`cbsStorage`) & `@/lib/infra-redis`                                               | Direct `localStorage.*` or `sessionStorage.*` calls with duplicate `try/catch` blocks.                     |
| **Draft State Lifecycle** | `@/lib/cbs-screen/workbench-bus.ts` (`setWorkbenchDraft`, `getWorkbenchDraft`, `clearWorkbenchDraft`) | Custom `sessionStorage.setItem` scattered across executor files; wiping drafts before hydration completes. |
| **API & Transport**       | `@/lib/cbs-client` (`cbs.*`, `cbsAuth.*`)                                                             | Direct `fetch()` calls inside UI components or hooks.                                                      |
| **Session & Branch**      | `useSessionStore` (`@/store/session`)                                                                 | Reading session cookies manually or reading branch info from DOM attributes.                               |
| **Screen Navigation**     | `cbsCommand.execute("COMMAND ...")`                                                                   | Using `<Link href="/screen/...">` or `router.push()` to switch banking screens.                            |
| **Status Vocabulary**     | `CBS_RECORD_STATUS_DEFINITIONS` (`@/types`)                                                           | Hand-crafting record status filter options in inquiries or audit headers.                                  |

---

## 3. Modularity & Layer Discipline

The repository enforces a strict unidirectional downward architecture:

```text
L6: App Router (src/app)
 └── L5: Features (src/features)
      └── L4: Components & Engines (src/components)
           └── L3.5: Client Stores & Contexts (src/store, src/hooks)
                └── L3: Business Logic (src/lib/cbs-*)
                     └── L2: Pure Infra & Parsers (src/lib/data-parsers, infra-*)
                          └── L1: Pure Utilities (src/lib/core-utils, core-logger)
                               └── L0: Types & Schemas (src/types, data-schemas)
```

### 3.1 Invariant Rules

- [ ] **Zero Upward Dependencies**: Lower layers must **never** import from higher layers. Specifically, `src/lib` must **never** import from `@/store`, `@/components`, `@/features`, or `@/app`.
- [ ] **Decoupled Notification**: When a lower layer (`cbs-command`) needs to notify a higher layer (`store`), it must register via an Adapter Bus (`registerCommandAdapter`) or dispatch an event.
- [ ] **Barrel Encapsulation**: Always import from the public barrel (`@/lib/cbs-access`, `@/store`), never deep inside the module internals (`@/lib/cbs-access/record-guard`).
- [ ] **Automated Layer Audit**:

  ```bash
  pnpm verify:layers
  ```

  _Target: 0 violations._

---

## 4. Dead Code & "Zero Legacy" Elimination

Dead code bloats bundles, confuses developers, and creates unmaintained security vulnerabilities.

### 4.1 Strict Cleanup Standards

- [ ] **Zero Compatibility Shims**: Do not maintain backward-compatibility shims, legacy aliases, or dual parameter support (e.g., supporting both `?id=` and `?recordId=`). Fix all call sites immediately.
- [ ] **No `@deprecated` Aliases**: If a function or type is superseded, migrate consumers and delete the old definition.
- [ ] **Zero Dead Exports**: Remove exports that are never imported outside their declaration file. If a symbol is only required by verification suites, mark it with `/** @internal */` or test through public contracts.
- [ ] **No Dead UI Variants**: Avoid keeping obsolete component variants (e.g., `variant="legacy"` in card containers).
- [ ] **Audit Command**:

  ```bash
  grep -rn '@deprecated' src
  grep -rn 'legacy' src/components src/features
  ```

  _Target: 0 matches._

---

## 5. Simplification & Complexity Reduction

Complex, heavily nested code obscures bugs. Prefer simple, declarative, readable code over clever abstractions.

### 5.1 File Size Budgets

- [ ] **Components**: $\le 300$ lines (stretch up to $350$ only for highly cohesive presentation blocks).
- [ ] **Hooks, Stores, Helpers**: $\le 250$ lines (stretch up to $280$ for comprehensive domain rules).
- [ ] **Decomposition Rule**: If a file exceeds budget, split along natural domain lines (e.g., separate canvas renderers from inspector forms).

### 5.2 Single-Pass Processing (No Redundant Passes)

- [ ] **Protobuf Decode**: Decode response envelopes **once** in the BFF proxy (`decodeResponse`). Client parsers consume already-decoded objects.
- [ ] **Inquiry Parsing**: Parse inquiry table records **once** in the BFF proxy. The client receives clean domain rows.
- [ ] **Notification Deduplication**: Network/mutation errors must toast **once** at the transport layer (`proxy-client.ts`). Avoid catching and re-toasting the same error in UI hooks.

### 5.3 Deterministic Types & Zero Casts

- [ ] **No Type Escapes**: Banish `as unknown as T` casts. If types diverge, update the canonical Zod schema in L0 (`data-schemas`) and re-derive TypeScript types via `z.infer`.
- [ ] **Standardized Store Factory**: Use generic scoped store factories (`createScopedStore`) instead of repeating 40 lines of context + `useRef` boilerplate in every provider.

---

## 6. Automated Audit Command Suite

Run this full suite before declaring any feature or refactoring phase complete:

```bash
# 1. Code Style, Formatting & Hygiene (Zero warnings/errors)
pnpm lint:fix

# 2. Strict Type Check (Zero TypeScript errors)
pnpm typecheck

# 3. Layer Boundary & Architectural Invariants
pnpm verify:layers

# 4. Domain & Security Verification Suites
pnpm verify:access       # Maker-Checker (Four-Eyes) & RIDASHL rights
pnpm verify:screen       # Popup state, action bar & workbench draft lifecycle
pnpm verify:command      # Terminal grammar, RBAC & navigation
pnpm verify:client       # Wire client, transport & error handling
pnpm verify:schemas      # Zod validation contracts
pnpm verify:logger       # PII redaction & structured log engine

# 5. Full Offline Suite
pnpm verify:all
```

---

## 7. Pre-Commit Verification Checklist

Before creating a commit, check off every box:

- [ ] **Security**: Are all inputs validated with Zod `.safeParse()`? Is Maker-Checker enforced?
- [ ] **Centralization**: Is this logic written once in its canonical layer?
- [ ] **Layer Integrity**: Did I avoid any upward or deep barrel bypass imports?
- [ ] **No Dead Code**: Have all unused variables, functions, and shims been deleted?
- [ ] **File Budget**: Are all modified files within their line budgets?
- [ ] **Zero Regressions**: Did `pnpm verify:all` pass with 16/16 suites green?

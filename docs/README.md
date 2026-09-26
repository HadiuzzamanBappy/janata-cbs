# 🏛️ Janata CBS Core Banking Workbench — Developer Documentation Hub

Welcome to the official developer documentation for the **Janata CBS Core Banking Workbench (`finx-ui`)**.

This application is an enterprise-grade Next.js App Router (React 19) frontend refactored into a clean **Domain-Driven Architecture (DDD)**. It acts as the dynamic presentation layer and Backend-for-Frontend (BFF) proxy for the Java Core Banking Engine.

---

## 🗺️ Master Documentation Sitemap

### [01. System Architecture & Governance](file:///d:/Work/React/cbs/finx-ui/docs/01-architecture/overview.md)
- [01-architecture/overview.md](file:///d:/Work/React/cbs/finx-ui/docs/01-architecture/overview.md) — 3-Tier Core Banking Topology, tier boundaries, and system flow.
- [01-architecture/folder-structure.md](file:///d:/Work/React/cbs/finx-ui/docs/01-architecture/folder-structure.md) — Domain-Driven Design (DDD) rules, public API barrel exports, and file size limits.
- [01-architecture/security-and-secrets.md](file:///d:/Work/React/cbs/finx-ui/docs/01-architecture/security-and-secrets.md) — `import "server-only"` guards, secret isolation, HTTP-only session cookies, and security invariants.
- [01-architecture/code-review-standards.md](file:///d:/Work/React/cbs/finx-ui/docs/01-architecture/code-review-standards.md) — Master 12-phase audit checklist for code reviews and PR approvals.

### [02. Core Dynamic Engine Platform](file:///d:/Work/React/cbs/finx-ui/docs/02-core-engine/gmc-schema-spec.md)
- [02-core-engine/gmc-schema-spec.md](file:///d:/Work/React/cbs/finx-ui/docs/02-core-engine/gmc-schema-spec.md) — Dynamic GMC payload format, Zod schemas, sensitive field password masking, and 12-column grid math.
- [02-core-engine/form-rendering-pipeline.md](file:///d:/Work/React/cbs/finx-ui/docs/02-core-engine/form-rendering-pipeline.md) — Pipeline lifecycle: `useSchema` $\rightarrow$ `DynamicForm` $\rightarrow$ `FormRenderer` $\rightarrow$ `FieldFactory` $\rightarrow$ `shadcn/ui`.
- [02-core-engine/component-loader.md](file:///d:/Work/React/cbs/finx-ui/docs/02-core-engine/component-loader.md) — Unified `ComponentLoader`, custom screen overrides (`INQ`, `SC.CHANGE.PASS`), dual-mode display, and window pop-out manager.

### [03. Business Domain Modules](file:///d:/Work/React/cbs/finx-ui/docs/03-domain-features/auth-and-session.md)
- [03-domain-features/auth-and-session.md](file:///d:/Work/React/cbs/finx-ui/docs/03-domain-features/auth-and-session.md) — Login flows, sliding Redis session state, and password change controls.
- [03-domain-features/workspace-and-windows.md](file:///d:/Work/React/cbs/finx-ui/docs/03-domain-features/workspace-and-windows.md) — Tabbed workspace state (`useWorkbenchStore`), draft preservation, menu tree parser (`MNU`), and pop-out windows.
- [03-domain-features/inquiries.md](file:///d:/Work/React/cbs/finx-ui/docs/03-domain-features/inquiries.md) — Inquiry engine screens (`INQ`, `GIR`, `SIR`), search filter builders, and high-density `@tanstack/react-table` data grids.
- [03-domain-features/reporting-studio.md](file:///d:/Work/React/cbs/finx-ui/docs/03-domain-features/reporting-studio.md) — Reporting viewers and report line designer (`SC.REPORT.LINE.tsx`).
- [03-domain-features/system-config.md](file:///d:/Work/React/cbs/finx-ui/docs/03-domain-features/system-config.md) — Administrative form builder (`SC.FORM.BUILDER.tsx`), model config, and menu tree editor.

### [04. Data Flow & API Transport](file:///d:/Work/React/cbs/finx-ui/docs/04-data-flow-and-api/grpc-and-bff-proxy.md)
- [04-data-flow-and-api/grpc-and-bff-proxy.md](file:///d:/Work/React/cbs/finx-ui/docs/04-data-flow-and-api/grpc-and-bff-proxy.md) — Next.js `/api/proxy` route handler, session verification, `Envelope` contract, and gRPC client connection pool.
- [04-data-flow-and-api/dynamic-api-integration.md](file:///d:/Work/React/cbs/finx-ui/docs/04-data-flow-and-api/dynamic-api-integration.md) — Dynamic API concept, `recordFunction` codes (`S`, `M`, `A`, `D`), and standardized `APIResponse<T>` contract.
- [04-data-flow-and-api/caching-strategy.md](file:///d:/Work/React/cbs/finx-ui/docs/04-data-flow-and-api/caching-strategy.md) — 3-tier read-through caching (Memory $\rightarrow$ Redis $\rightarrow$ Core DB) and fail-open circuit breaker rules.
- [04-data-flow-and-api/error-handling-and-alerts.md](file:///d:/Work/React/cbs/finx-ui/docs/04-data-flow-and-api/error-handling-and-alerts.md) — Error boundaries, status code mappings, and `useAlertStore` modal alerts.

### [05. Operational Developer Runbooks](file:///d:/Work/React/cbs/finx-ui/docs/05-developer-guides/quickstart-setup.md)
- [05-developer-guides/quickstart-setup.md](file:///d:/Work/React/cbs/finx-ui/docs/05-developer-guides/quickstart-setup.md) — Local setup, environment variables (`.env.local`), and `pnpm` scripts.
- [05-developer-guides/adding-new-domain-feature.md](file:///d:/Work/React/cbs/finx-ui/docs/05-developer-guides/adding-new-domain-feature.md) — Step-by-step runbook for scaffolding a new domain module under `src/features/`.
- [05-developer-guides/static-mock-mode.md](file:///d:/Work/React/cbs/finx-ui/docs/05-developer-guides/static-mock-mode.md) — Running offline with static fixture specs (`MODEL_SOURCE=static`).
- [05-developer-guides/git-workflow-and-commits.md](file:///d:/Work/React/cbs/finx-ui/docs/05-developer-guides/git-workflow-and-commits.md) — Git commit conventions, imperative mood summaries, commit scopes, and Husky hooks.

---

## ⚡ Quick Start Checklist for Day 1

```bash
# 1. Install dependencies
pnpm install

# 2. Run TypeScript type check
pnpm typecheck

# 3. Start local development server
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to access the application.

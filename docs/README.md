# 🏛️ Janata CBS Core Banking Workbench — Developer Documentation Hub

Welcome to the official developer documentation for the **Janata CBS Core Banking Workbench (`finx-ui`)**.

This application is an enterprise-grade Next.js App Router (React 19) frontend refactored into a clean **Domain-Driven Architecture (DDD)**. It acts as the dynamic presentation layer and Backend-for-Frontend (BFF) proxy for the Java Core Banking Engine.

---

## 🗺️ Master Documentation Sitemap

### 00. Refactoring Progress & Checklists
- [Master Refactoring Audit Plan](00-refractor/refractor.md) — Legacy inventory, syscomp mapping, and refactoring audit plan.
- [Refactoring Progress Checklist](00-refractor/refractor-checklist.md) — Step-by-step checklist of refactored domain modules.
- [Legacy Src Component Checklist](00-refractor/legacy-src-checklist.md) — syscomp files migration status.
- [Future Architecture Upgrades](00-refractor/future-architecture-upgrades.md) — Planned technical enhancements & upgrades.
- [AI Agent Development Guide](00-refractor/agent-development-guide.md) — AI agent rules and workflow guide.

### 01. System Architecture & Governance
- [Overview & Topology](01-architecture/overview.md) — 3-Tier Core Banking Topology, tier boundaries, and system flow.
- [Folder Structure & DDD](01-architecture/folder-structure.md) — Domain-Driven Design (DDD) rules, public API barrel exports, and file size limits.
- [Security & Secrets](01-architecture/security-and-secrets.md) — `import "server-only"` guards, secret isolation, HTTP-only session cookies, and security invariants.
- [Code Review Standards](01-architecture/code-review-standards.md) — Master 12-phase audit checklist for code reviews and PR approvals.

### 02. Core Dynamic Engine Platform
- [GMC Payload Spec](02-core-engine/gmc-schema-spec.md) — Dynamic GMC payload format, Zod schemas, sensitive field password masking, and 12-column grid math.
- [Form Rendering Pipeline](02-core-engine/form-rendering-pipeline.md) — Pipeline lifecycle: `useSchema` $\rightarrow$ `DynamicForm` $\rightarrow$ `FormRenderer` $\rightarrow$ `FieldFactory` $\rightarrow$ `shadcn/ui`.
- [Component Loader & Pop-outs](02-core-engine/component-loader.md) — Unified `ComponentLoader`, custom screen overrides (`INQ`, `SC.CHANGE.PASS`), dual-mode display, and window pop-out manager.

### 03. Business Domain Modules
- [Auth & Session](03-domain-features/auth-and-session.md) — Login flows, sliding Redis session state, and password change controls.
- [Workspace & Windows](03-domain-features/workspace-and-windows.md) — Tabbed workspace state (`useWorkbenchStore`), draft preservation, menu tree parser (`MNU`), and pop-out windows.
- [Inquiries Engine](03-domain-features/inquiries.md) — Inquiry engine screens (`INQ`, `GIR`, `SIR`), search filter builders, and high-density `@tanstack/react-table` data grids.
- [Reporting Studio](03-domain-features/reporting-studio.md) — Reporting viewers and report line designer (`SC.REPORT.LINE.tsx`).
- [System Config Tools](03-domain-features/system-config.md) — Administrative form builder (`SC.FORM.BUILDER.tsx`), model config, and menu tree editor.

### 04. Data Flow & API Transport
- [gRPC & BFF Proxy](04-data-flow-and-api/grpc-and-bff-proxy.md) — Next.js `/api/proxy` route handler, session verification, `Envelope` contract, and gRPC client connection pool.
- [Dynamic API Architecture](04-data-flow-and-api/dynamic-api-integration.md) — Dynamic API concept, `recordFunction` codes (`S`, `M`, `A`, `D`), and standardized `APIResponse<T>` contract.
- [Caching & Circuit Breaker](04-data-flow-and-api/caching-strategy.md) — 3-tier read-through caching (Memory $\rightarrow$ Redis $\rightarrow$ Core DB) and fail-open circuit breaker rules.
- [Error Handling & Alerts](04-data-flow-and-api/error-handling-and-alerts.md) — Error boundaries, status code mappings, and `useAlertStore` modal alerts.

### 05. Operational Developer Runbooks
- [Quickstart Local Setup](05-developer-guides/quickstart-setup.md) — Local setup, environment variables (`.env.local`), and `pnpm` scripts.
- [Scaffold New DDD Feature](05-developer-guides/adding-new-domain-feature.md) — Step-by-step runbook for scaffolding a new domain module under `src/features/`.
- [Offline Static Mock Mode](05-developer-guides/static-mock-mode.md) — Running offline with static fixture specs (`MODEL_SOURCE=static`).
- [Git Workflow & Commit Rules](05-developer-guides/git-workflow-and-commits.md) — Git commit conventions, imperative mood summaries, commit scopes, and Husky hooks.

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

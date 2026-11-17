# 🏛️ Janata CBS Core Banking Workbench — Developer Documentation Hub

Welcome to the official developer documentation for the **Janata CBS Core Banking Workbench (`finx-ui`)**.

This application is an enterprise-grade Next.js App Router (React 19) frontend refactored into a clean **Domain-Driven Architecture (DDD)**. It acts as the dynamic presentation layer and Backend-for-Frontend (BFF) proxy for the Java Core Banking Engine.

> [!NOTE]
> The rules every change must follow live in [AGENTS.md](../../AGENTS.md) and [.agents/rules/](../../.agents/rules/). This hub only lists pages that exist. To add a page, create `docs/devs/<path>.md`, then add it both to this sitemap and to `DEV_NAV_GROUPS` in [src/features/docs/config.ts](../../src/features/docs/config.ts).

---

## 🗺️ Master Documentation Sitemap

### 00. Refactoring

- [Master Refactoring Audit Plan](00-refractor/refractor.md) — A leaves-to-root audit: red flags per layer, before/after patterns, and exit gates for each phase.

### 01. Engineering Reference

- [Project Tree](PROJECT_TREE.md) — Annotated repository and `src/` layer structure.
- [Library Checklist](LIB_CHECKLIST.md) — Review checklist for `src/lib` modules: headless, unidirectional, deterministic, and within the size budget.
- [Developer Study Plan](PROJECT_STUDY_PLAN.md) — Onboarding curriculum covering every language, library and pattern used in the repository.

---

## ⚡ Quick Start Checklist for Day 1

```bash
# 1. Install dependencies
pnpm install

# 2. Configure the local environment (offline mock mode works with no backend)
cp .env.example .env.local

# 3. Run the quality gates
pnpm typecheck
pnpm lint
pnpm verify:all

# 4. Start local development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

name: documentation-authoring
description: Use this skill when writing, updating, or reviewing developer portals (docs/devs/), end-user manuals (docs/manual/), or Mermaid diagrams.
---

# Documentation Authoring Runbook

This skill provides standards for writing technical architecture portals, end-user banking manuals, and diagrams in Janata CBS.

## 1. Developer / Architecture Portal (`docs/devs/`)

- **Target Audience:** Developers, architects, maintainers, code reviewers, and AI coding agents.
- **Source of Truth:** Base all documentation strictly on active codebase implementation; never invent imaginary APIs, routes, or workflows.
- **Content Requirements:** Document WHAT, WHY, HOW, module boundaries, dependencies, lifecycle, and security (`"server-only"`).
- **Format:** Use standard alerts (`> [!NOTE]`, `> [!IMPORTANT]`). The in-app portal resolves every link from its root (`/devs/...`) and cannot open source files, so in `docs/devs` link only to other portal pages (written relative to `docs/devs/`) and write source files as code paths (`src/lib/cbs-access/record-guard.ts`). Never use `file:///` links.
- **Register every page:** add a new page to the sitemap in `docs/devs/README.md` and to `DEV_NAV_GROUPS` in `src/features/docs/config.ts`.

## 1a. Module READMEs (`src/**/README.md`, `mock/**/README.md`)

- Every `src/lib/*` unit and every engine in `src/components/cbs-*-engine` has a README next to its code; links there are relative to the file.
- Document contracts a reader can't get from `index.ts`: invariants, wire formats, lifecycles, where the module is called from. Don't copy facts that have a home elsewhere (quality gates and size budgets → `AGENTS.md`, layer ranks → `scripts/verify/verify-layers.ts`, env keys → `.env.example`); link to them.
- Every code sample must compile against the current barrel and use the project's own rules (enums instead of literals, `logger` instead of `console`, `sendMutation()` for mutations). Verify examples by running them, not by reading them.
- No line counts, test counts or line-number references: they drift.

## 2. User Manuals & Banking Portals (`docs/manual/`)

- **Target Audience:** Bank tellers, branch officers, and managers (non-technical end users).
- **Tone:** Business-focused and goal-oriented. Zero tech jargon (do NOT mention React, Next.js, gRPC, Redis, APIs, or schemas).
- **Exact UI Match:** Mirror the exact screen names, button tooltips, field labels and statuses shown on screen. The record statuses are `New Draft`, `Pending Approval`, `Authorized`, `Held`, `Reversed` and `Deleted` (`CBS_RECORD_STATUS_DEFINITIONS` in `src/types/status.ts`).
- **Required Sections for Manuals:**
  1. Overview & Purpose
  2. Who Can Use This Feature (Roles / Entitlements)
  3. Prerequisites
  4. Step-by-Step Procedure & Expected Results
  5. Troubleshooting & Validation Errors
  6. Related Tasks

## 3. Mermaid Diagram Standards

- **No Hardcoded Fills:** Never use hardcoded inline styles (e.g. `style Node fill:#0f172a`). Diagrams must adapt automatically to light and dark themes.
- **Transparent Labels:** Edge connectors and text labels must be clean and transparent without grey rectangle background boxes.
- **Flowchart Types:** Use `flowchart TD` or `flowchart LR` with clean bordered box nodes.

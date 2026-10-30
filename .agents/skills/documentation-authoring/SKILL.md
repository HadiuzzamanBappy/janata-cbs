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
- **Format:** Reference actual file paths using clickable markdown links. Use standard alerts (`> [!NOTE]`, `> [!IMPORTANT]`).

## 2. User Manuals & Banking Portals (`docs/manual/`)

- **Target Audience:** Bank tellers, branch officers, and managers (non-technical end users).
- **Tone:** Business-focused and goal-oriented. Zero tech jargon (do NOT mention React, Next.js, gRPC, Redis, APIs, or schemas).
- **Exact UI Match:** Mirror exact screen names, action buttons, field labels, and workflow statuses (`Draft`, `Pending Approval`, `Completed`, `Rejected`).
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

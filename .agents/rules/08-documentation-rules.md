# 📚 Documentation Rules & Guidelines

This rule file defines the mandatory authoring standards for all documentation files in the repository.

## 1. Developer / Architecture Portal Rules (`docs/devs/`)

- **Target Audience:** Write for developers, architects, maintainers, reviewers, and AI coding agents.
- **Source of Truth:** Base all claims on the actual repository; never invent architecture, APIs, file paths, business rules, or behavior.
- **Core Requirements:** Clearly document WHAT, WHY, HOW, scope, responsibilities, dependencies, boundaries, and lifecycle.
- **Concrete References:** Reference actual files, folders, modules, functions, components, and configuration where relevant.
- **Invariants:** Clearly define architectural invariants using `MUST`, `MUST NOT`, `SHOULD`, and `SHOULD NOT`.
- **Data Flow & Contracts:** Document data flow, API/data contracts, state ownership, validation, authentication, authorization, and error handling.
- **Security:** Document security boundaries and sensitive-data handling (`"server-only"`, session cookies).
- **Verification:** Include testing and verification requirements (`pnpm typecheck`, `pnpm format`).
- **Portal Routing:** Markdown portals are dynamically served via `src/app/[docs]/` (`layout.tsx` and `[[...slug]]/page.tsx`). Never create parallel route folders in `src/app/` for new documentation hubs.

---

## 2. User Manual / User Portal Rules (`docs/manual/`)

- **Target Audience:** Write for end users of the banking portal (tellers, officers, managers), NOT developers.
- **Goal-Oriented:** Explain the user's goal, not the underlying technical implementation.
- **Zero Tech Jargon:** Do NOT mention code, APIs, databases, Next.js, React, gRPC, internal services, or architecture.
- **Comprehensive Structure:** Clearly explain WHAT the feature is, WHO can use it, WHEN to use it, prerequisites, and HOW to complete the task.
- **Exact UI Match:** Use the exact UI labels, menu names, buttons, fields, tabs, and messages used by the application.
- **Step-by-Step Procedures:** Give procedures in the exact order the user should perform them.
- **Form Fields:** Explain required and optional fields, input formats, and important restrictions.
- **Financial Statuses:** For financial operations, distinguish `Draft`, `Pending Approval`, `Completed`, `Rejected`, and `Failed` states.
- **Security & Privacy:** Never ask users to share passwords, PINs, OTPs, or authentication codes. Use fictional example data only.
- **Mandatory Sections:** Every user manual page MUST include:
  1. Overview & Purpose
  2. Who Can Use This Feature
  3. Prerequisites
  4. Step-by-Step Procedure & Expected Results
  5. Troubleshooting & Validation Errors
  6. Related Tasks

---

## 3. Mermaid Diagram & Visualization Standards

- **No Hardcoded Fills:** Do NOT add hardcoded fixed fill styles (e.g. `style Node fill:#0f172a`) inside Mermaid diagram code blocks.
- **Theme Adaptability:** All diagrams MUST use clean, un-filled bordered box nodes that automatically adapt to light and dark theme switching.
- **Transparent Labels:** Edge/connector text labels MUST render transparently over lines without blocky grey or dark rectangle background fills.
- **Diagram Conversions:** Only convert existing text ASCII box-art into compact Mermaid flowcharts (`flowchart TD` or `flowchart LR`). Do NOT create new un-requested diagrams.


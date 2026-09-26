# 📚 Runbook: Extending Documentation Pages & Creating New Doc Modules

## 1. Executive Summary & Architecture Overview

The **Platform Documentation Engine** located at `src/features/docs/` provides a highly reusable, domain-driven presentation layer for rendering markdown documentation.

It currently powers two dedicated route portals:
1. **Developer Hub** (`http://localhost:3000/devs`) — Powered by `docs/devs/` & `dev-nav-config.ts`
2. **Officer Operating Manual** (`http://localhost:3000/manual`) — Powered by `docs/manual/` & `manual-nav-config.ts`

This guide explains step-by-step how to:
- **Task A**: Add new markdown pages or navigation items to an existing portal.
- **Task B**: Scaffold a brand-new documentation module/portal (e.g. `/audit`, `/system-admin`).

---

## 2. Task A: Adding a New Page to an Existing Portal

To add a new documentation page to `/devs` or `/manual`:

### Step 1: Create the Markdown File
Create your markdown file in the appropriate directory:
```text
docs/devs/<category-folder>/<page-name>.md
# or for user manuals:
docs/manual/<category-folder>/<page-name>.md
```

*Example*: `docs/devs/05-developer-guides/extending-doc-portal-or-creating-new-module.md`

### Step 2: Register Item in Navigation Config
Open the relevant navigation configuration file:
- `src/features/docs/config/dev-nav-config.ts` (for `/devs`)
- `src/features/docs/config/manual-nav-config.ts` (for `/manual`)

Add your page entry inside the appropriate `NavGroup`:
```typescript
{
  label: "Extending & Creating Doc Modules",
  href: "/devs/05-developer-guides/extending-doc-portal-or-creating-new-module",
  keywords: ["docs", "portal", "manual", "scaffold", "navigation"],
}
```

### Step 3: Link in Portal README
Update `docs/devs/README.md` or `docs/manual/README.md` to link to your new markdown document.

---

## 3. Task B: Creating a Brand-New Documentation Portal

To create a brand-new portal (e.g., `/audit-manual` at `http://localhost:3000/audit-manual`):

### Step 1: Create Content Directory
Create a subfolder under `docs/`:
```text
docs/audit-manual/
├── 01-getting-started/
│   └── audit-overview.md
└── README.md
```

### Step 2: Create Navigation Config
Create `src/features/docs/config/audit-nav-config.ts`:
```typescript
import { ShieldCheck } from "lucide-react";
import type { NavGroup } from "./types";

export const AUDIT_NAV_GROUPS: NavGroup[] = [
  {
    id: "01-getting-started",
    title: "01. Audit Overview",
    icon: ShieldCheck,
    items: [
      {
        label: "Audit Overview",
        href: "/audit-manual/01-getting-started/audit-overview",
        keywords: ["audit", "compliance", "logs"],
      },
    ],
  },
];
```

### Step 3: Export Navigation Config in Feature Barrier
In `src/features/docs/index.ts`:
```typescript
export * from "./config/audit-nav-config";
```

### Step 4: Register Portal in Unified Layout
Add a matching branch in [src/app/[docs]/layout.tsx](file:///d:/Work/React/cbs/finx-ui/src/app/[docs]/layout.tsx):

```tsx
const isManual = portal === "manual";
const isAudit = portal === "audit-manual";

const navGroups = isAudit
  ? AUDIT_NAV_GROUPS
  : isManual
  ? MANUAL_NAV_GROUPS
  : DEV_NAV_GROUPS;

const sidebarTitle = isAudit
  ? "CBS - Audit Manual"
  : isManual
  ? "CBS - User Manual"
  : "CBS - Developer";

const headerTitle = isAudit
  ? "CBS Compliance & Audit Manual"
  : isManual
  ? "CBS Officer Operating Manual"
  : "CBS Developer Hub";
```

That's it! Because [src/app/[docs]/[[...slug]]/page.tsx](file:///d:/Work/React/cbs/finx-ui/src/app/[docs]/[[...slug]]/page.tsx) uses a dynamic route segment (`[docs]`), it automatically renders all markdown documents under `docs/audit-manual/` at `http://localhost:3000/audit-manual/` with zero app folder cloning!

---

## 4. Architectural Rules & Best Practices

- **Zero Duplicate UI Code**: Always consume `DocSidebar`, `DocHeader`, and `DocSearchDialog` from `@/features/docs`. Do not clone sidebar components into route folders.
- **Server File Isolation**: Never import `readDocFile` or `node:fs` inside client components or client-facing barrel files (`src/features/docs/index.ts`). Always import `readDocFile` directly from `@/features/docs/utils/doc-file-reader`.
- **Multiple Accordion Expansion**: `DocSidebar` supports expanding multiple menu categories concurrently via the `multiple` prop on `Accordion`.

---

## 5. Verification Checklist

Always run typecheck and formatting after adding pages or portals:
```bash
pnpm typecheck
pnpm format
```

---

## 6. Quick Documentation Checklist for Developers

When authoring or modifying documentation:

### A. Developer Docs (`docs/devs/`)
- **Accurate & Verified:** Verify file paths, code symbols, and APIs against current codebase before writing.
- **Define Boundaries:** Explicitly define invariants using `MUST` / `MUST NOT` rules and security boundaries (`"server-only"`, session isolation).
- **Clean Diagrams:** Use un-filled, theme-adaptive bordered-box Mermaid diagrams with transparent connector labels. Avoid hardcoded fixed background fill styles (`style ... fill:#...`).

### B. User Manual (`docs/manual/`)
- **Zero Tech Jargon:** Write strictly for banking tellers and officers—do not mention code, gRPC, React, APIs, or internal databases.
- **Exact UI Match:** Use exact button names, menu titles, form field labels, and messages as seen in the application.
- **Standard Structure:** Every manual page MUST include: Overview, Target Audience, Prerequisites, Step-by-Step Procedure, Validation Errors, and Related Tasks.

### C. Mermaid Diagram & Visualization Standards
- **No Hardcoded Fills:** Do NOT add fixed fill styles inside Mermaid blocks (e.g. `style Node fill:#0f172a`).
- **Theme Adaptability:** Use clean, un-filled bordered box nodes that adapt dynamically to light/dark themes.
- **Transparent Labels:** Connector text labels MUST render transparently over lines without blocky background boxes.
- **ASCII Conversions:** Only convert existing ASCII box-art into compact Mermaid flowcharts (`flowchart TD`/`LR`). Do NOT create unrequested new diagrams.

> 💡 *For the full AI agent ruleset, see [`.agents/rules/07-documentation-rules.md`](file:///d:/Work/React/cbs/finx-ui/.agents/rules/07-documentation-rules.md).*



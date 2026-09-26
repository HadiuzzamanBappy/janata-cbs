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

### Step 4: Create App Router Route Portal
Create directory `src/app/(docs)/audit-manual/`:

#### 1. Layout (`src/app/(docs)/audit-manual/layout.tsx`):
```tsx
"use client";

import { useState } from "react";
import {
  AUDIT_NAV_GROUPS,
  DocHeader,
  DocSearchDialog,
  DocSidebar,
} from "@/features/docs";

export default function AuditDocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground antialiased">
      <DocSidebar
        portalTitle="CBS - Audit Manual"
        portalHomeHref="/audit-manual"
        navGroups={AUDIT_NAV_GROUPS}
      />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <DocHeader onOpenSearch={() => setSearchOpen(true)} />
        <main className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
      <DocSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        navGroups={AUDIT_NAV_GROUPS}
      />
    </div>
  );
}
```

#### 2. Catch-All Page (`src/app/(docs)/audit-manual/[[...slug]]/page.tsx`):
```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "@/features/docs";
import { readDocFile } from "@/features/docs/utils/doc-file-reader";

export const dynamic = "force-dynamic";

export default async function AuditDocPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const {
    relativePath,
    content: fileContent,
    exists,
  } = readDocFile(slug, "audit-manual");

  if (!exists) {
    notFound();
  }

  return (
    <article className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <span className="text-primary font-semibold">audit-manual/</span>
          <span>{relativePath}</span>
        </div>
        <span className="text-muted-foreground/60">Audit System Manual</span>
      </div>
      <div className="rounded-xl border bg-card p-8 md:p-10 shadow-xs leading-relaxed text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {fileContent}
        </ReactMarkdown>
      </div>
    </article>
  );
}
```

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

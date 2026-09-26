---
trigger: always_on
---

# 06: Styling, Sizing & UI Design Rules (Tailwind v4 & shadcn)

- **Tailwind v4 & OKLCH Semantic Tokens:** Style exclusively using Tailwind v4 utility classes linked to `globals.css` semantic design tokens (`bg-primary`, `bg-card`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`). NEVER use hardcoded static color classes (e.g. `bg-blue-600`, `text-zinc-900`).
- **High-Density Compact Sizing:** Banking screens require maximum screen real estate:
  - **Inputs & Controls:** Use compact control height (`h-9 text-xs`).
  - **Typography Consistency:** Use `text-xs font-medium` for form labels, table data cells, and badges; `text-sm font-semibold` for section headers and tabs; `text-xs font-mono` for transaction IDs, codes, dates, and keyboard shortcuts.
  - **Grid & Spacing:** Use compact padding (`p-2` / `p-3`, `gap-2`, `space-y-3`). Dynamic forms MUST use the 12-column grid (`col-span-12`, `sm:col-span-6`, `sm:col-span-4`, `sm:col-span-3`).
- **CTA & Topbar Icon Box Uniformity:** Action buttons and topbar icons MUST use uniform styling: `size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0 hover:bg-primary/20 transition`.
- **Flush Layout Grid Alignment:** Sidebar header, topbar header, and workbench header MUST maintain exact vertical alignment and height (`h-14` or `h-16`).
- **shadcn/ui & Base UI Purity:** Leverage `src/components/ui/` primitives directly (`Input`, `Select`, `DatePicker`, `Button`, `Dialog`, `Table`, `Badge`, `Alert`). Do NOT construct redundant custom HTML elements if a shadcn/ui primitive exists.
- **Conditional Styling with `cn()`:** Always use the `cn()` utility (`clsx` + `tailwind-merge`) for conditional class combinations.
- **Dynamic Brand Accent Colors:** Active tabs (`bg-primary/15 text-primary border-primary`), active sidebar items, active indicators, and focus rings (`ring-ring`) MUST depend dynamically on `var(--primary)` to support multi-theme accent switching.


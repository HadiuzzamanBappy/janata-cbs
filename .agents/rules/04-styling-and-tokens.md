# 04: Styling, Tailwind v4 & Base UI Design Tokens

## 1. Tailwind v4 & OKLCH Semantic Tokens

- Style exclusively using Tailwind v4 utility classes mapped to CSS variables in `globals.css`:
  - `bg-primary`, `bg-card`, `bg-background`, `bg-muted`
  - `text-foreground`, `text-muted-foreground`, `text-primary`
  - `border-border`, `ring-ring`
  - Status: `text-success`, `text-warning`, `text-info`, `text-destructive` (with `bg-*/10`, `border-*/30` tints). Selection/hover/drop-target states use `primary`.
- **NEVER** hardcode static Tailwind color numbers (e.g. `bg-blue-600`, `text-zinc-900`, `text-gray-500`).

## 2. Dynamic Accent Switching

- Active tabs (`bg-primary/15 text-primary`), active sidebar indicators, and focus rings (`ring-ring`) MUST resolve dynamically through `var(--primary)` to support theme accent changes without code edits.

## 3. Base UI & Component Patterns

- Use Base UI primitives and `src/components/ui/` components directly (`Input`, `Select`, `Button`, `Dialog`, `Table`, `Badge`, `Alert`).
- **Trigger Pattern:** In Base UI components, use `render={<Component />}` rather than `asChild` to preserve exact TypeScript prop types.
- **CTA Uniformity:** Screen header actions always use `ActionBtn` (`src/components/cbs-screen/header/action-btn.tsx`): an icon button (`h-7 w-9`) whose `defaultTooltip` names the action and whose `reason` explains why it's disabled. Never hand-style a screen action button.
- **Vendored primitives:** `src/components/ui/` is shadcn / Base UI as shipped. Don't hand-edit it; re-add a primitive with `pnpm ui:add <name>`.

## 4. Class Merging & Layout Density

- Always combine conditional class names using `cn()` from `@/lib/core-utils` (`clsx` + `tailwind-merge`).
- Forms use the 12-column grid system (`col-span-12`, `sm:col-span-6`, etc.) with compact density (`h-8 text-xs`, IDs/dates in `font-mono`).

## 5. Banking Typography & Numeric Alignment

- **Tabular Figures:** All monetary amounts, balances, exchange rates, and transaction IDs must use `font-mono` and `tabular-nums` (`font-variant-numeric: tabular-nums`) for strict vertical alignment.
- **Sanctioned Micro-Type Scale:** Below `text-xs` (12px), use only the sanctioned theme tokens defined in `globals.css`:
  - `text-2xs` (11px): Field labels, compact table cells.
  - `text-3xs` (10px): Status badges, metadata.
  - Arbitrary pixel text (`text-[9px]`, `text-[11px]`) is strictly forbidden (unreadable on 768px branch terminals).

## 6. Viewport Ergonomics & Layout Invariants

- **Fixed Header & Bounded Scroll:** Outer screen scaffolds must use `h-full flex flex-col overflow-hidden`. The action header stays pinned; only the form or table body scrolls (`flex-1 overflow-y-auto`). The overall browser window must never scroll.
- **Zero Layout Shift (CLS = 0):** Error states must not expand or push adjacent grid columns. Errors render via fixed containers, tooltips, or the validation drawer.
- **High-Contrast Focus:** All interactive controls (inputs, buttons, selects, checkboxes) must display `focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none` for rapid, error-free keyboard navigation.

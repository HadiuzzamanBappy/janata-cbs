# 06: Styling and UI Toolkit (Tailwind v4 & shadcn)

- **Tailwind v4 / OKLCH**: Style exclusively with Tailwind v4 classes using OKLCH theme variables from `globals.css` (e.g., `bg-[var(--surface)]`).
- **Typography Consistency**: Use `text-sm font-medium` for menus/tabs/titles, and `text-xs font-mono` for codes/shortcuts.
- **CTA Icon Box Uniformity**: Topbar action buttons MUST use: `size-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0`.
- **Flush Layout Grid**: Sidebar and topbar headers MUST maintain exact vertical/horizontal alignment (`h-16`).
- **shadcn/ui Purity**: Leverage `src/components/ui/` primitives directly. Do not build custom elements if a shadcn primitive exists.
- **Clsx/Tailwind-merge**: Use the `cn()` utility for conditional class names.

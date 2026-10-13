# 05: Form Performance & High-Density State

## 1. Two-Tier Form State (Prevent Keystroke Thrashing)
Dynamic core banking screens frequently hold 50–100 fields with live validations.
- **Tier 1 (Local Field State):** Inputs and field components manage their own local state or form hook refs. Never trigger global Zustand store dispatches on individual character keystrokes.
- **Tier 2 (Tab Store Synchronization):** The global tab store receives changes only via:
  - Debounced synchronization (`400ms`), or
  - Field blur (`onBlur`), or
  - Explicit action triggers (e.g. Save, Validate, Next Section)
  - Alongside a lightweight boolean flag: `isDirty: true`.

## 2. High-Density Layout Rules
- **Maximum Screen Real Estate:** Banking workflows demand maximum visibility.
  - Inputs & Controls: Use compact height (`h-9 text-xs`).
  - Table Cells & Badges: Use `text-xs font-medium` and compact padding (`p-2`, `py-1.5`).
  - Dates, IDs, and Account Numbers: Use `text-xs font-mono`.
- **12-Column Responsive Grid:** Dynamic GMC forms MUST use the 12-column layout (`col-span-12`, `sm:col-span-6`, `sm:col-span-4`, `sm:col-span-3`).
- **Unconstrained Stretch:** Screen canvas elements must use `w-full flex-1` without restrictive `max-w-*` boundaries on desktop viewports.

## 3. Keyboard-First Operator UX
- All input fields must support tab indexing and fast key navigation.
- Hotkey handlers in `src/lib/cbs-hotkeys` (Enter to advance, Esc to cancel/close dialogs, F-keys for common actions) must not conflict with browser default keys.

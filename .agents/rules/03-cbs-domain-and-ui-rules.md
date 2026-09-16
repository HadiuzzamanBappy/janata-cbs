# Core Banking System (CBS) Domain & UI Architecture Rules

These rules govern all UI components, layout structures, state management, and banking navigation paradigms in `finxui-ref`. AI Agents MUST enforce these rules without exception.

---

## 1. Multi-Tab & Window Architecture (Banking Domain)

- **Multi-Instance Window Execution**: Clicking a menu item, topbar link, or command palette result MUST ALWAYS create a **brand-new unique tab instance** (`uniqueInstanceId`). NEVER reuse or jump back to an existing open tab.
- **Universal Tab Position Badge**: Every tab in `<TabBar />` MUST display its **1-based universal position index (`index + 1`)** as a small badge on the **left side** of the tab.
- **Clean Title Strings**: Tab title properties MUST remain pure screen titles (e.g. `General Inquiry (GIR)`). NEVER embed count suffixes (like `(1)`) into the title string property itself.
- **Destructive Action Confirmations**: Mass actions (such as *Close All Tabs*) MUST prompt a confirmation modal (`<Dialog />`) before executing destructive state resets.

---

## 2. Layout & Shell Architecture

- **Off-Canvas Sidebar (`collapsible="offcanvas"`)**: The main application sidebar MUST use `collapsible="offcanvas"` so it slides 100% off-screen when collapsed. DO NOT leave a collapsed icon rail.
- **Flush Header Alignment**: The `<SidebarHeader />` height MUST match the `<TopBar />` height (`h-16` / 64px) for a flush border line across the entire layout.
- **Full-Width Workspace Body**: Content inside workspace screen windows MUST be **full width (`w-full flex-1`)**. DO NOT place fixed max-width constraints (e.g., `max-w-5xl`) on workspace body containers.
- **Headerless Screen Containers**: Workspace screen windows MUST NOT contain window card headers (`<CardHeader>`). The workspace area is reserved strictly for screen body content.

---

## 3. TopBar & CTA Design System

- **Branch Switcher CTA**: The topbar branch button trigger MUST display only branch code and type (e.g., `[JB9999] • Head Office`) as a single-line label in clean font-mono (`text-sm font-semibold font-mono`).
- **Live Search in Dropdown Headers**: Popup menus containing large lists (e.g., Branch Switcher) MUST feature an interactive search field in the header with live filtering.
- **Consistent CTA Icon Boxes**: Action buttons on the topbar MUST use consistent icon box styling (`size-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center shrink-0`).
- **No Divider Clutter**: DO NOT add vertical divider lines between right-side topbar action buttons.

---

## 4. Global Command Search (`Ctrl+K`) & RBAC

- **Global Keybinding**: The global command search modal MUST be triggered via `Ctrl+K` / `⌘K` keydown listeners or topbar search triggers.
- **Top-Center Modal Alignment**: Position command dialogs near top-center (`top-12 translate-y-0 sm:top-16`) with compact viewport sizing (`max-w-lg sm:max-w-xl`).
- **Role-Based Access Control (RBAC)**: Filter command results dynamically based on `user.role` (Administrators access system admin tools like Form Builder, COB Registry, User Groups; General Users access operational screens).
- **`cmdk` Store Context**: `<CommandDialog />` MUST wrap `{children}` inside `<Command>` so `cmdk` store context (`.subscribe`) is always available to child inputs.

---

## 5. Component Integrity & Verification

- **Atomic UI Primitives**: DO NOT embed business logic or hardcoded mock data inside `src/components/ui/` primitives. Keep them atomic and reusable.
- **Base UI `render` Prop**: Use `render={<Component />}` for Base UI triggers (`DropdownMenuTrigger`, `TooltipTrigger`, `DialogClose`) instead of `asChild`.
- **Zero Build Regression**: Always run `pnpm typecheck` and `pnpm build` after code edits to guarantee 0 TypeScript compilation or Next.js build errors.

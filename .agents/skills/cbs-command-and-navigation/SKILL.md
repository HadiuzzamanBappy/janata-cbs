---

name: cbs-command-and-navigation
description: >-
Use this skill when adding new screens, registering screen aliases, implementing quick actions, or wiring user navigation and hotkeys.
---

# CBS Command Gateway & Navigation Runbook

## Overview

In Janata CBS, screen navigation does **NOT** use standard Next.js `<Link>` tags or `router.push()`. Navigating via URLs destroys active form draft sessions and tab state. All screen opening and function dispatching is handled through the **CBS Command Gateway** (`cbsCommand.execute()`).

---

## 1. Navigating Between Screens

### The Invariant

> **NEVER use `<Link href="/screen/...">` or `router.push()` to switch or open banking screens.**

### The Correct Command Dispatch

Use `cbsCommand.execute()` or the `data-cbs-command` DOM attribute:

```tsx
import { cbsCommand } from "@/lib/cbs-command";

// Programmatic execution
cbsCommand.execute("ACCOUNT I 10001", { title: "Account 10001" });

// Declarative DOM button execution (handled by global delegation in WorkbenchShell)
<button data-cbs-command="SC.MENU.DESIGN" data-cbs-label="Menu Designer">
  Open Menu Designer
</button>;
```

---

## 2. Command Syntax Standards

The Command Gateway supports standard core-banking shorthand and canonical aliases:

1. **Base Application Navigation:**
   - `"USER"` → Opens blank USER form in SEE mode.
2. **Auto-Authorize Comma Shorthand:**
   - `"USER,"` → Opens USER in auto-authorize mode.
3. **Explicit Record & Function Lookup:**
   - `"USER 1001"` → Fetches record 1001 in default mode.
   - `"USER I 1001"` → Fetches record 1001 in INPUT mode.
   - `"USER S 1001"` → Fetches record 1001 in SEE (read-only) mode.
4. **Inquiry Queries:**
   - `"INQ GET.EMP.INFO"` → Opens the inquiry results viewer.
5. **Canonical System Aliases:**
   - `"MD"` → Resolves to `SC.MENU.DESIGN`
   - `"UG"` → Resolves to `SC.USER.GROUP`
   - `"MC"` → Resolves to `SC.MODEL.CONFIG`
   - `"RB"` → Resolves to `SC.REPORT.BUILDER`
   - `"MNU"` → Resolves to `SC.MENU`
6. **Quick Actions:**
   - `"DARK"` → Toggles dark mode.
   - `"LOGOUT"` → Triggers session sign-off.

---

## 3. Registering New Screens (`src/features/workbench/registry.tsx`)

When adding a custom screen component:
1. Register its canonical command key in `BESPOKE_SCREENS` inside `src/features/workbench/registry.tsx`:

   ```tsx
   const BESPOKE_SCREENS: Record<string, ScreenComponent> = {
     "SC.MENU": SysMenuCatalog,
     "SC.MY_NEW_TOOL": MyNewToolComponent,
   };
   ```
2. The `resolveScreen()` engine will automatically handle aliasing, inquiry routing, and dynamic GMC form fallbacks.

---

## 4. Dual Workspace Contract (`panel` vs `window` mode)

- **Internal Tabs (`panel` mode):**
  - Rendered inside the main dashboard workbench.
  - Tabs are managed in-memory via `WorkbenchStore`.
- **Detached Windows (`window` mode):**
  - Rendered via `window.open()` as autonomous instances under `/screen/[id]`.
  - Communicates cross-window updates using `BroadcastChannel("cbs_workbench_bus")`.

---

## 5. Verification & Testing

Whenever you modify command parsing, aliases, or screen routing, run:

```bash
pnpm verify:command
```

Ensure all 20 command gateway test cases pass cleanly.

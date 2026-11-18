---

name: cbs-command-and-navigation
description: Use this skill when adding new screens, registering screen aliases, implementing quick actions, or wiring user navigation and hotkeys.
---

# CBS Command Gateway & Navigation Runbook

Every banking screen opens from a **command string** through `cbsCommand.execute()`. Changing the URL would lose the open tabs and drafts, so `<Link href="/screen/...">` and `router.push()` are never used to switch screens. They're used only for sign-on redirects and the docs portal. Reference: `src/lib/cbs-command/README.md`.

---

## 1. Opening a screen

```tsx
import { cbsCommand } from "@/lib/cbs-command";

cbsCommand.execute("ACCOUNT I 1001"); // workspace tab
cbsCommand.execute("CUSTOMER S 9001", { target: "popup" }); // detached window
const parsed = cbsCommand.parse("ACCOUNT,1.0.0 I 1001"); // no side effects (previews, autocomplete)

// Declarative: WorkbenchShell delegates clicks on any element with data-cbs-command
<button data-cbs-command="SC.MENU.DESIGN" data-cbs-label="Menu Designer">
  Menu Designer
</button>;
```

`execute()` shows parse and permission errors to the user itself, unless `{ silent: true }` is passed.

## 2. Grammar (what `cbsCommand.parse()` returns)

| Command                                                      | Result                                                                     |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `ACCOUNT`                                                    | mode `IDLE` (record search)                                                |
| `ACCOUNT,`                                                   | mode `IDLE`, `authLevel: 0` (zero-auth entry)                              |
| `CUSTOMER,KYC`                                               | version `KYC`                                                              |
| `ACCOUNT 1001`                                               | record `1001`, mode `S`                                                    |
| `ACCOUNT S\|I\|A\|D\|R\|H 1001`                              | that function's mode                                                       |
| `ACCOUNT L`                                                  | function `L`, mode `IDLE`                                                  |
| `INQ GET.EMP.INFO` / `INQ S …` / `INQUIRY …`                 | inquiry, mode `S`                                                          |
| `MD`, `MC`, `FC`, `IC`                                       | `SC.MENU.DESIGN`, `SC.MODEL.CONFIG`, `SC.FORM.CONFIG`, `SC.INQUIRY.CONFIG` |
| `SETTINGS`, `SETTINGS:<tab>`, `PROFILE`, `THEME`, `SECURITY` | settings dialog (`profile`, `appearance`, `security`)                      |

There are no `DARK`, `LOGOUT` or other "quick action" commands: unknown words parse as form screens. The security check (`validateSecurityPermissions`) requires a signed-in user, rejects users with `commandLine === false`, and requires the RIDASHL right for any function code.

## 3. Which component renders a command

`resolveScreen()` in `src/features/workbench/registry.tsx` resolves the alias, then picks, in order: a `BESPOKE_SCREENS` entry → `OpsInquiry` for an `INQ`/`INQUIRY` prefix → `OpsForm` for everything else. **Form and inquiry screens need no code**: they come from the core's Model, Form and Inquiry config (offline: `mock/db`).

## 4. Adding a bespoke screen (system or admin tools only)

1. Build the screen in `src/features/system/<name>/`. Export it from the feature's `index.ts` as a `CbsScreenComponent` (props `CbsScreenProps` from `@/lib/cbs-screen`), rendered with `CbsScreenScaffold`.
2. Add its command to `MASTER_COMMAND_DEFINITIONS` in `src/lib/cbs-command/registry/catalog.ts` (`command`, `title`, `aliases`, `controlAction: "SCREEN"`, `controlType: "FORM"`).
3. Register the canonical command key in `BESPOKE_SCREENS`:

   ```tsx
   const BESPOKE_SCREENS: Record<string, CbsScreenComponent> = {
     "SC.MENU.DESIGN": SysMenuDesigner,
     "SC.MY.TOOL": SysMyTool, // new
   };
   ```
4. Add grammar or alias cases to `scripts/verify/verify-cbs-command.ts`.

Aliases from the core's control and menu records are registered at runtime (`cbsCommand.registerAliases`, from the search palette), so they need no code.

> [!IMPORTANT]
> Command strings and aliases are operator-facing: people type them from memory, and menus store them. Renaming or removing one is a **compatibility change** (`.agents/rules/00-core-pillars.md` §1). Flag it to the owner first.

## 5. Tabs and popups

Panel and window modes are described in `AGENTS.md` §4. A popup docks back with `broadcastDockTab()`, and the shell validates the message with `dockTabPayloadSchema`.

## 6. Hotkeys

Use `useCbsHotkeys` (screen keys: `F2` new, `F5` commit, `F6` hold, `F7` validate, `F8` authorize, `F10` delete, `Esc` return; ignored while a dialog is open) and `useHotkeys` (`Ctrl+K` palette) from `@/lib/cbs-hotkeys`. Never add raw `keydown` listeners in screens.

## 7. Verification

```bash
pnpm verify:command
pnpm verify:screen
```

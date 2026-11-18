# ⌨️ CBS Command Gateway (`@/lib/cbs-command`)

Layer L2: every banking screen opens from a command string, typed in the search palette (`Ctrl+K`), sent by a menu item, or run by an inquiry row. This library parses the string, checks the user may run it, and routes it to a workspace tab, a popup window or the settings dialog. It never imports the store or UI. Those register themselves through the **adapter bus** (`registerCommandAdapter`).

---

## ⚙️ Pipeline

```text
"ACCOUNT I 1001"
   │
   ▼ 1. registry/   resolveCommandAlias(): "MD" → "SC.MENU.DESIGN" (master catalog + aliases loaded from menus)
   ▼ 2. engine/grammar.ts + handlers/   first handler whose canHandle() matches → ParsedCommand
   │       settings-handler  SETTINGS, SETTINGS:<tab>, SETTINGS <tab>
   │       inquiry-handler   INQ … / INQUIRY …
   │       form-handler      everything else: <APP>[,<VER>] [FN] [RECORD_ID]
   ▼ 3. engine/validator.ts   validateSecurityPermissions()
   ▼ 4. executor/terminal.ts
           ├─ SETTINGS        → window event CBS_SETTINGS_EVENT ("cbs:open-settings")
           ├─ target "popup"  → executor/popup.ts: window.open("/screen/<id>?…")
           └─ otherwise       → adapter.openTab(tab)
```

`resolveScreen()` in `src/features/workbench/registry.tsx` then decides which component renders the tab (bespoke screen, `OpsInquiry` or `OpsForm`).

---

## 🕹️ Grammar

These results come from `cbsCommand.parse()`:

| Command                                                          | Result                                                                                        |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `ACCOUNT`                                                        | form `ACCOUNT`, mode `IDLE` (record search)                                                   |
| `ACCOUNT,`                                                       | mode `IDLE`, `authLevel: 0` (zero-auth entry: a trailing comma)                               |
| `CUSTOMER,KYC`                                                   | version `KYC` of the `CUSTOMER` screen                                                        |
| `ACCOUNT 1001`                                                   | record `1001` in mode `S` (a record with no function opens read-only)                         |
| `ACCOUNT S 1001` / `I` / `A` / `D` / `R` / `H`                   | record `1001` in that function's mode                                                         |
| `ACCOUNT L`                                                      | function `L`, mode `IDLE`                                                                     |
| `ACCOUNT S 1001;2`                                               | composite record ID `1001;2`                                                                  |
| `INQ GET.EMP.INFO`, `INQ S GET.EMP.INFO`, `INQUIRY GET.EMP.INFO` | inquiry `GET.EMP.INFO`, mode `S`                                                              |
| `MD`, `MC`, `FC`, `IC`                                           | `SC.MENU.DESIGN`, `SC.MODEL.CONFIG`, `SC.FORM.CONFIG`, `SC.INQUIRY.CONFIG`                    |
| `SETTINGS`, `SETTINGS:SECURITY`, `PROFILE`, `THEME`, `SECURITY`  | settings dialog on that tab (`profile`, `appearance`, `security`)                             |
| `ACCOUNT X 1`                                                    | invalid: `Unrecognized function code "X". Valid CBS function codes are: S, I, D, A, R, H, L.` |

The function codes are case-insensitive. Aliases come from `MASTER_COMMAND_DEFINITIONS` in `registry/catalog.ts`, plus the menu commands registered at runtime (`registerDynamicAliases`).

---

## 🛡️ Security check (`validateSecurityPermissions`)

1. Invalid commands are rejected with the parse error.
2. Settings commands are always allowed.
3. With no signed-in user, the command is rejected.
4. A user whose profile has `commandLine === false` can't run typed commands.
5. A command with a function code needs that RIDASHL right (`hasAccessibilityRight`). A command without one, such as `ACCOUNT`, passes. The screen's own action bar then applies the record-level rules from `@/lib/cbs-access`.

---

## 🔌 Adapter bus

`lib` code can't import the store, so the UI registers what the gateway needs. Each registration merges into one adapter and returns an unregister function:

| Registered by                                | Provides                                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/store/session/session-provider.tsx`     | `getCurrentUser`                                                                 |
| `src/store/workbench/workbench-provider.tsx` | `openTab` (adds a workbench tab)                                                 |
| `src/components/layout/app-notifier.tsx`     | `notify` (the toast layer, also used by `@/lib/cbs-client` through `notifyUser`) |

---

## 🚀 Usage

```typescript
import { cbsCommand } from "@/lib/cbs-command";

const result = cbsCommand.execute("ACCOUNT I 1001");
if (!result.isValid) {
  // result.error is already shown to the user unless { silent: true } was passed
}

cbsCommand.execute("CUSTOMER S 9001", { target: "popup" });

const parsed = cbsCommand.parse("ACCOUNT,1.0.0 I 1001"); // no side effects: for previews and autocomplete
```

Never switch screens with `router.push()` or `<Link href="/screen/...">`. Always use `cbsCommand.execute()`.

---

## ➕ Extending

- **A new bespoke screen:** add it to `MASTER_COMMAND_DEFINITIONS` (with its `aliases`), and register its component in `BESPOKE_SCREENS` in `src/features/workbench/registry.tsx`. Form and inquiry screens need neither: they come from the core's config.
- **A new grammar:** implement `CommandHandler` (`type`, `canHandle()`, `parse()`, optional `execute()`) and register it with `cbsCommand.registerHandler(handler)`. It goes first by default.

---

## 🧪 Verification

```bash
pnpm verify:command
```

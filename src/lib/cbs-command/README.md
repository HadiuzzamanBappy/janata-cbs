# ⌨️ CBS Command Gateway (`@/lib/cbs-command`)

A fast, decoupled command-line grammar parser, RBAC security validator, and routing gateway for the **Janata Core Banking Workbench**.

It gives tellers and power operators the traditional command-line navigation speed of Core Banking systems while seamlessly routing to modern Next.js multitab views, detached popup windows, and system dialogs.

---

## 📦 Architecture & Pipeline

```text
Raw Command String (e.g. "ACCOUNT I 1001" or "MD")
         │
         ▼
[ 1. Alias & Registry Lookup ] (registry/alias.ts)
  Maps "MD" -> "SC.MENU.DESIGN", "MNU" -> "SC.MENU"
         │
         ▼
[ 2. Grammar Parser Engine ] (engine/grammar.ts)
  Tokenizes input into strongly-typed AST: ParsedCommand
         │
         ▼
[ 3. RBAC Pre-Execution Guard ] (engine/validator.ts)
  Validates terminal clearance & RIDASH function permissions
         │
         ▼
[ 4. Execution Router ] (executor/terminal.ts)
  ├── System Action -> executor/action.ts (Theme, Settings, Logout)
  ├── Detached Popup -> executor/popup.ts (window.open with shared draft)
  └── Workspace Tab  -> executor/adapter.ts (Decoupled openTab call)
```

---

## 🏛️ Supported Command Syntax

| Syntax Pattern          | Example               | Mode   | Description                                   |
| :---------------------- | :-------------------- | :----- | :-------------------------------------------- |
| **Base App**            | `ACCOUNT`             | `IDLE` | Opens application in search / idle mode       |
| **Comma Version**       | `ACCOUNT,`            | `I`    | Admin Auto-Auth direct entry (`authLevel: 0`) |
| **Named Version**       | `CUSTOMER,KYC`        | `IDLE` | Opens specific sub-version of an application  |
| **Record Lookup**       | `ACCOUNT 1000001`     | `I`    | Opens account for editing / viewing           |
| **Explicit Function**   | `ACCOUNT I 1000001`   | `I`    | Explicit **Input** mode                       |
|                         | `ACCOUNT S 1000001`   | `S`    | Explicit **See** (Read-Only) mode             |
|                         | `ACCOUNT A 1000001`   | `A`    | Explicit **Authorize** mode (Checker)         |
|                         | `ACCOUNT D 1000001`   | `D`    | Explicit **Delete** mode                      |
|                         | `ACCOUNT R 1000001`   | `R`    | Explicit **Reverse** mode                     |
| **Composite Record ID** | `ACCOUNT S 1000001;2` | `S`    | Supports semicolon multi-part keys            |
| **Inquiry Query**       | `INQ GET.CUST.LIST`   | `S`    | Executes standard enquiry data view           |
| **Shorthand Alias**     | `MD`                  | `IDLE` | Resolves to `SC.MENU.DESIGN`                  |
|                         | `MC`                  | `IDLE` | Resolves to `SC.MODEL.CONFIG`                 |
|                         | `UG`                  | `IDLE` | Resolves to `SC.USER.GROUP`                   |
| **Settings Dialog**     | `SETTINGS:PROFILE`    | —      | Opens Profile tab in Settings modal           |
|                         | `THEME` / `DARK`      | —      | Toggles dark / light theme instantly          |
|                         | `LOGOUT` / `EXIT`     | —      | Triggers confirmation logout modal            |

---

## 🚀 How to Use

### 1. Execute Command via Public Facade (`cbsCommand`)

```typescript
import { cbsCommand } from "@/lib/cbs-command";

// Execute from Command Bar or Hotkey
cbsCommand.execute("ACCOUNT I 1000001");

// Spawn directly as an external popup window:
cbsCommand.execute("CUSTOMER S 9001", {
  target: "popup",
});
```

### 2. Parse Only (Without Executing)

Useful for command input previews, syntax highlighting, or autocompletion:

```typescript
import { cbsCommand } from "@/lib/cbs-command";

const ast = cbsCommand.parse("USER,");

console.log(ast.application); // "USER"
console.log(ast.isCommaVersion); // true
console.log(ast.authLevel); // 0 (Auto-Auth)
console.log(ast.screenMode); // "I"
```

### 3. Registering the Shell Adapter (`registerCommandAdapter`)

`cbs-command` is completely decoupled from UI state libraries (Zustand, Redux, React Context). The shell mounts the execution adapter once:

```typescript
import { registerCommandAdapter } from "@/lib/cbs-command";
import { useSessionStore, useWorkbenchStore } from "@/store";

// Mount inside root layout or Workbench provider:
const unregister = registerCommandAdapter({
  getCurrentUser: () => useSessionStore.getState().user,
  openTab: (tab) => useWorkbenchStore.getState().openTab(tab),
  logout: () => useSessionStore.getState().logout(),
});
```

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Grammar Parser & Engine: **SEALED**

The grammar tokenizer (`grammar.ts`), security validator (`validator.ts`), and execution router (`terminal.ts`) implement standard Core Banking command grammar. **You do not need to modify the parsing logic.**

---

### 2. Command Catalog & Aliases: **SCALABLE**

When adding a new bespoke system screen or shorthand alias:

#### Step 1: Add to `MASTER_COMMAND_DEFINITIONS` in `registry/catalog.ts`

```typescript
{
  id: "SC.LOAN.CONFIG",
  title: "Loan Product Configurator",
  category: "System Administration",
  command: "SC.LOAN.CONFIG",
  aliases: ["LC"],
  actionType: "SCREEN",
}
```

#### Step 2: That's It!

The alias dictionary (`registry/alias.ts`) dynamically generates `O(1)` Map lookups at initialization. Typing `LC`, `lc`, or `SC.LOAN.CONFIG` will immediately resolve and route to the correct screen.

---

## 🧪 Verification

Run the dedicated test suite:
```bash
pnpm verify:command
```

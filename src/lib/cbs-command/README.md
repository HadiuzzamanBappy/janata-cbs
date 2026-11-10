# ⌨️ CBS Command Gateway (`@/lib/cbs-command`)

A fast, fully decoupled command-line grammar parser, RBAC security validator, and routing gateway for the **Janata Core Banking Workbench**.

It gives tellers and power operators the traditional command-line navigation speed of enterprise banking terminals (such as Temenos T24 / Globus / Finacle) while seamlessly routing to modern Next.js multitab workspaces, detached multi-monitor popup windows, and system settings dialogs.

---

## 🏛️ Core Philosophy & Architectural Invariants

1. **Unidirectional Layer Hierarchy**:
   `src/lib/cbs-command` is an independent domain library. It strictly adheres to:
   $$\text{app / features / store} \longrightarrow \text{src/lib/cbs-command} \longrightarrow \text{src/lib/cbs-access} \longrightarrow \text{types \& data-schemas}$$
   `cbs-command` **NEVER** imports from `@/store`, `@/components`, `@/features`, or `@/app`. Upward UI notifications strictly use the **Inversion of Control Adapter Bus** (`registerCommandAdapter`).

2. **Clean Inversion of Control (Zero Store Coupling)**:
   The command engine does not directly mutate Zustand, Redux, or React context. The UI shell mounts a `CommandAdapter` once at app startup, providing hooks for `getCurrentUser` and `openTab`.

3. **Deterministic AST Pipeline**:
   Every raw input string passes through a linear, 3-stage pure pipeline:
   - **Lexical/Alias Normalization** $\to$
   - **Grammar Protocol Handlers** $\to$
   - **RBAC Security Guard** $\to$
   - **Execution Routing**

4. **Zero Magic Strings & Zero Fake IDs**:
   All screen modes come from `CbsScreenMode`, action codes from `CbsRecordFunction`, and components from `CBS_SCREEN_COMPONENTS`. Record IDs are never mocked with timestamps.

---

## 📦 Architecture & Execution Pipeline

```text
Raw Command String (e.g., "ACCOUNT I 1000001", "INQ S GET.CUSTOMER", "SETTINGS:PROFILE")
         │
         ▼
[ 1. Registry & Alias Lookup ] (@/lib/cbs-command/registry)
  • Resolves registered shorthand aliases: "MD" ➔ "SC.MENU.DESIGN", "MC" ➔ "SC.MODEL.CONFIG"
  • Injects metadata (controlAction, controlType, title)
         │
         ▼
[ 2. Grammar Engine & Protocol Handlers ] (@/lib/cbs-command/engine, handlers/)
  • SettingsCommandHandler : Intercepts "SETTINGS:TAB", "THEME", "DARK", "SECURITY"
  • InquiryCommandHandler  : Parses "INQ [S] <QUERY_NAME>"
  • FormCommandHandler     : Parses "<APP>[,<VER>] [FN] [RECORD_ID]" (RIDASHL grammar)
  • Output                 : Strongly-typed ParsedCommand AST
         │
         ▼
[ 3. RBAC Pre-Execution Guard ] (@/lib/cbs-command/engine/validator.ts)
  • Validates commandLine clearance from user security profile (commandLine !== false)
  • Evaluates RIDASHL capabilities via @/lib/cbs-access (hasAccessibilityRight)
         │
         ▼
[ 4. Execution Router ] (@/lib/cbs-command/executor)
  ├── Settings Dialog  ➔ CustomEvent dispatch (CBS_SETTINGS_EVENT = "cbs:open-settings")
  ├── Detached Popup   ➔ window.open with sessionStorage draft staging (executor/popup.ts)
  └── Workspace Tab    ➔ Shell adapter invocation adapter.openTab(...) (executor/adapter.ts)
```

---

## 🕹️ Supported Banking Command Syntax

| Protocol / Pattern      | Command Example        | Mode   | Description                                                          |
| :---------------------- | :--------------------- | :----- | :------------------------------------------------------------------- |
| **Base Application**    | `ACCOUNT`              | `IDLE` | Opens application in lookup / search mode                            |
| **Auto-Auth Entry**     | `ACCOUNT,`             | `I`    | Direct data entry with supervisor auto-auth level 0 (`authLevel: 0`) |
| **Versioned Screen**    | `CUSTOMER,KYC`         | `IDLE` | Opens specific sub-version / presentation spec of application        |
| **Record Direct Open**  | `ACCOUNT 1000001`      | `I`    | Opens record in default Input (`I`) mode                             |
| **Explicit Function**   | `ACCOUNT S 1000001`    | `S`    | **See**: Read-only ledger inspection (no record locks)               |
|                         | `ACCOUNT I 1000001`    | `I`    | **Input**: Draft capture & updates (stages to `$NAU`)                |
|                         | `ACCOUNT A 1000001`    | `A`    | **Authorize**: Checker approval (promotes draft to Live ledger)      |
|                         | `ACCOUNT D 1000001`    | `D`    | **Delete**: Purges unapproved draft from unauthorized queue          |
|                         | `ACCOUNT R 1000001`    | `R`    | **Reverse**: Reverses authorized record with offsetting entries      |
|                         | `ACCOUNT H 1000001`    | `H`    | **Hold**: Parks draft pending further maker inputs                   |
|                         | `ACCOUNT L`            | `L`    | **List**: Opens directory / table listing                            |
| **Composite Record ID** | `ACCOUNT S 1000001;2`  | `S`    | Supports multi-part keys (e.g., semicolon version notation)          |
| **Inquiry Query**       | `INQ S GET.CUSTOMER`   | `S`    | Executes data inquiry / directory query                              |
|                         | `INQUIRY GET.ACCOUNT`  | `S`    | Long-form inquiry prefix with default `S` mode                       |
| **Shorthand Aliases**   | `MD`                   | `IDLE` | Resolves to `SC.MENU.DESIGN` (Menu Designer)                         |
|                         | `MC`                   | `IDLE` | Resolves to `SC.MODEL.CONFIG` (Model Config)                         |
|                         | `FC`                   | `IDLE` | Resolves to `SC.FORM.CONFIG` (Form Design)                           |
|                         | `IC`                   | `IDLE` | Resolves to `SC.INQUIRY.CONFIG` (Inquiry Design)                     |
| **System Settings**     | `SETTINGS:SECURITY`    | —      | Opens Settings modal focused on Security tab                         |
|                         | `THEME` / `APPEARANCE` | —      | Opens Settings modal focused on Appearance / Theme tab               |

---

## 🚀 How to Use

### 1. Execute Command via Public Facade (`cbsCommand`)

```typescript
import { cbsCommand } from "@/lib/cbs-command";

// Execute standard banking command (auto-opens workspace tab or executes inquiry)
const result = cbsCommand.execute("ACCOUNT I 1000001");

if (!result.isValid) {
  console.error("Execution failed:", result.error);
}

// Force command to launch inside an external multi-monitor popup window:
cbsCommand.execute("CUSTOMER S 9001", {
  target: "popup",
});
```

### 2. Parse Only (Syntax Inspection & Autocomplete)

Ideal for real-time command input validation, syntax highlighting, or prompt suggestions:

```typescript
import { cbsCommand } from "@/lib/cbs-command";

const ast = cbsCommand.parse("ACCOUNT,1.0.0 I 1000001");

console.log(ast.application); // "ACCOUNT"
console.log(ast.version); // "1.0.0"
console.log(ast.functionCode); // "I"
console.log(ast.recordId); // "1000001"
console.log(ast.screenMode); // "I"
console.log(ast.isValid); // true
```

### 3. Register Shell Adapter (`registerCommandAdapter`)

Mount the adapter bus inside the root Workbench shell provider (`src/store/workbench/workbench-provider.tsx`):

```typescript
import { registerCommandAdapter } from "@/lib/cbs-command";
import { useSessionStore } from "@/store/session/session-store";
import { useWorkbenchStore } from "@/store/workbench/workbench-store";

// Mount inside root Workbench provider:
const unregister = registerCommandAdapter({
  getCurrentUser: () => useSessionStore.getState().user,
  openTab: (tab) => useWorkbenchStore.getState().openTab(tab),
});
```

### 4. Listen for System Settings Events

```typescript
import { CBS_SETTINGS_EVENT } from "@/lib/cbs-command";

window.addEventListener(CBS_SETTINGS_EVENT, (event: CustomEvent<{ tab: string }>) => {
  const { tab } = event.detail; // "profile" | "appearance" | "security"
  openSettingsModal(tab);
});
```

---

## 📈 How to Scale & Extend

### Adding New Bespoke Screens or Shorthand Aliases

#### Step 1: Register in `MASTER_COMMAND_DEFINITIONS`

Open [`src/lib/cbs-command/registry/catalog.ts`](file:///d:/Work/React/cbs/janata-cbs/src/lib/cbs-command/registry/catalog.ts) and add the screen definition:

```typescript
{
  command: "SC.LOAN.CONFIG",
  title: "Loan Product Configurator",
  aliases: ["LC", "LOAN.CFG"],
  controlAction: "SCREEN",
  controlType: "FORM",
}
```

#### Step 2: That's It!

The alias dictionary (`registry/alias.ts`) dynamically compiles an $O(1)$ bidirectional lookup map. Typing `LC`, `lc`, `LOAN.CFG`, or `SC.LOAN.CONFIG` in the command bar will immediately resolve and route to the configurator.

---

### Adding a New Command Grammar Protocol Handler

To add a new grammar protocol (e.g., `REPORT <NAME>` or `BATCH <JOB_ID>`):

1. **Implement `CommandHandler`** in `src/lib/cbs-command/handlers/`:

   ```typescript
   export class ReportCommandHandler implements CommandHandler {
     readonly type = "FORM" as const;

     canHandle(_raw: string, upper: string): boolean {
       return upper.startsWith("REPORT ") || upper.startsWith("REP ");
     }

     parse(raw: string, upper: string): ParsedCommand {
       const reportName = upper.replace(/^(REPORT|REP)\s+/, "").trim();
       return {
         raw,
         isValid: true,
         type: "FORM",
         application: reportName,
         title: `Report: ${reportName}`,
         authLevel: 1,
         screenMode: "IDLE",
       };
     }
   }
   ```

2. **Register dynamically via `cbsCommand.registerHandler(new ReportCommandHandler())`**.

---

## 🧪 Verification & Quality Gates

Run the dedicated test suite validating tokenization, RIDASHL rights, aliases, and edge cases:

```bash
pnpm verify:command   # Test all grammar permutations & execution routing
pnpm verify:all       # Validate all 13 CBS domain suites
pnpm typecheck        # Full TypeScript compile check (tsc --noEmit)
pnpm lint:fix         # Biome style & hygiene check
```

# Centralized CBS Command Gateway (`cbs-command`) — Architecture & Plan

## 1. Executive Summary & Vision

The **CBS Command Gateway** (`src/lib/cbs-command`) is the unified, single-source-of-truth command execution engine for FinX-UI.
It parallels the already centralized **CBS Data Client** (`src/lib/cbs-client`):
- **`cbs-client`** manages **Inbound / Outbound Data & Network Transport** (`cbs.send(...)`).
- **`cbs-command`** manages **Terminal Navigation, Grammar Parsing, RBAC Guarding, and Screen Execution** (`cbsCommand.execute(...)`).

It completely eliminates callback drilling (`addTab`, `openSettingsTab`, `clearSession`), unifies duplicate alias mappings between command palettes and screen loaders, and enforces authentic CBS command grammar (including **Comma Versions** and **`authLevel: 0` Auto-Auth**).

---

## 2. Directory Structure (`src/lib/cbs-command/`)

```
src/lib/cbs-command/
│
├── contracts/
│   ├── command-types.ts        # ParsedCommand, ScreenMode, CommandActionType, FunctionRightCode
│   ├── validation-types.ts     # CommandValidationResult, UserRightsContext
│   └── execution-options.ts    # LaunchTarget ("workspace" | "popup"), ExecutionOverrides
│
├── parser/
│   ├── cbs-grammar.ts          # Core parser: [TYPE] APP[,VERSION] [FUNC] [ID] (supports Comma Versions & authLevel 0)
│   └── alias-resolver.ts       # Shorthand alias mapper (e.g., MD -> SC.MENU.DESIGN, COB -> SC.COB.REGISTRY)
│
├── validator/
│   ├── security-guard.ts       # Evaluates user.commandLine access & RIDASH function permissions
│   └── syntax-guard.ts         # Validates alphanumeric app names and parameter legality
│
├── registry/
│   ├── static-commands.ts      # Canonical catalog of commands, metadata, icons, categories, aliases
│   └── alias-map.ts            # Generated lookup map shared by both Command Palette and Screen Resolvers
│
├── executor/
│   ├── terminal-executor.ts    # Central execution pipeline: Parse -> Validate -> Dispatch
│   ├── tab-dispatcher.ts       # Workspace tab spawning with multi-tab allowance
│   ├── popup-dispatcher.ts     # Detached multi-monitor window spawning with query state preservation
│   └── action-dispatcher.ts   # System actions: Settings modal, Theme toggle, Logout dialog
│
└── index.ts                    # Public gateway facade: `cbsCommand` (execute, parse, validate, registry)
```

---

## 3. Strict CBS Command Grammar & Rules Engine

The parser in `parser/cbs-grammar.ts` implements authentic Core Banking syntax:

$$\textbf{COMMAND} = [\textbf{TYPE}]\ \textbf{APPLICATION}[,\textbf{VERSION}]\ [\textbf{FUNCTION}]\ [\textbf{RECORD\_ID}]$$

### Canonical Syntax Matrix:

| Syntax Form | Example | Mode | Record ID | Auth Level | Semantics / Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Base Application** | `USER` | `IDLE` | &mdash; | `1` | Opens in initial state; prompts for search or record ID. |
| **Comma Version (Auto-Auth)** | `USER,` | `CREATE` | &mdash; | **`0`** | **CBS Comma Version**: Direct entry for admins; commits directly to `LIVE` status bypassing maker-checker dual control. |
| **Named Version** | `USER,1001` or `USER,ADMIN`| `IDLE` / `CREATE`| &mdash; | `1` | Opens version `1001` or `ADMIN` layout of `USER` schema. |
| **Record Query** | `USER 1001` | `EDIT` | `1001` | `1` | Queries DB for record `1001`; loads existing record into edit mode. |
| **Explicit Input** | `USER I 1001` | `CREATE` | `1001` | `1` | Pre-seeds record `1001` in input/create mode. |
| **Explicit See (View)** | `USER S 1001` | `VIEW` | `1001` | `1` | Read-only inspection of live ledger record `1001`. |
| **Explicit Authorize** | `USER A 1001` | `EDIT` | `1001` | `1` (or elevate) | Authorize unauth draft record `1001`. |
| **Inquiry Query** | `INQ USER.LIST` | `VIEW` | &mdash; | `1` | Opens Inquiry Grid engine executing `USER.LIST` query. |
| **Settings Modal** | `SETTINGS:PROFILE` | &mdash; | &mdash; | &mdash; | Opens Settings dialog directly on the Profile tab. |
| **System Action** | `ACTION:LOGOUT` | &mdash; | &mdash; | &mdash; | Prompts confirmation dialog and terminates session. |

---

## 4. Execution Pipeline & Zero-Boilerplate Dispatcher

Callers will no longer pass 6 callback functions. The gateway connects directly to the zustand stores:
- `useSessionStore.getState()` &rarr; for active `user` & `logout()`
- `useWorkbenchStore.getState()` &rarr; for `addTab()`, `activeTabId`, `setActiveTab()`

```ts
// Usage anywhere in the codebase:
import { cbsCommand } from "@/lib/cbs-command";

// 1. From a button or table row:
cbsCommand.execute("ACCOUNT S 1001");

// 2. Comma Version (Auto-Auth):
cbsCommand.execute("USER,");

// 3. Detached multi-monitor window:
cbsCommand.execute("CUSTOMER,1001", { target: "popup" });

// 4. Modal or action:
cbsCommand.execute("SETTINGS:SECURITY");
cbsCommand.execute("ACTION:LOGOUT");
```

### The 4-Stage Execution Flow:
1. **Stage 1 (Parse)**: Run raw string through `cbs-grammar.ts`. Resolves aliases (`MD` &rarr; `SC.MENU.DESIGN`).
2. **Stage 2 (Validate)**:
   - Check `user.commandLine` permission.
   - If a function verb was specified (`R, I, D, A, S, H`), verify user has permission.
   - If invalid, alert toast (`Access Denied`) and halt before any UI state changes.
3. **Stage 3 (Resolve Route)**:
   - If `SETTINGS` &rarr; open settings modal.
   - If `ACTION` &rarr; trigger theme toggle or logout alert.
   - If `SCREEN` &rarr; proceed to Stage 4.
4. **Stage 4 (Spawn / Target)**:
   - If `target === "popup"` &rarr; open detached window with URL query serialization.
   - If `target === "workspace"` &rarr; spawn a new tab in the workbench store with the parsed `screenMode`, `searchRecordId`, and `authLevel`.

---

## 5. Eliminating Duplicate Aliases in `registry.tsx`

Currently, `command-registry.ts` and `registry.tsx` both define aliases (`MD`, `COB`, `MENU.DESIGN`).

With `cbs-command`:
1. `cbs-command/registry/static-commands.ts` defines the canonical list of bespoke commands and aliases:
   ```ts
   export const BESPOKE_COMMAND_MAP = {
     "SC.MENU.DESIGN": {
       componentName: "MENU_DESIGNER",
       aliases: ["MD", "MENU.DESIGN", "TREE.DESIGN"],
       title: "Menu Hierarchy Designer",
     },
     // ...
   };
   ```
2. `registry.tsx` imports the generated alias map:
   ```ts
   // In registry.tsx
   import { getBespokeScreenKey } from "@/lib/cbs-command";

   export function resolveScreen(command: string): ScreenComponent {
     const canonicalKey = getBespokeScreenKey(command);
     if (canonicalKey && BESPOKE_SCREENS[canonicalKey]) {
       return BESPOKE_SCREENS[canonicalKey];
     }
     // ...
   }
   ```
   **Result**: Zero duplicate strings. Adding an alias to `cbs-command` automatically makes it work in both the search bar and the screen loader!

---

## 6. Step-by-Step Implementation Roadmap

### Step 1: Create Contracts & Grammar Parser (`src/lib/cbs-command/`) — [COMPLETED]
- [x] Created `contracts/command-types.ts`, `contracts/validation-types.ts`, `contracts/execution-options.ts`.
- [x] Built `parser/cbs-grammar.ts` with complete support for:
  - Trailing comma version (`USER,`) -> `authLevel: 0`, `screenMode: "CREATE"` (Admin Auto-Auth bypass).
  - Version identifier (`USER,1001`) -> version layout.
  - Record lookup (`USER 1001`, `USER I 1001`, `USER S 1001`).
  - Inquiry prefix (`INQ <QUERY>`, `INQUIRY <QUERY>`).
  - Settings (`SETTINGS:<tab>`) and actions (`ACTION:<act>`, `DARK`, `LOGOUT`).

### Step 2: Security Guard & Validator — [COMPLETED]
- [x] Implemented `validator/security-guard.ts`:
  - Enforce `user.commandLine` boolean.
  - Enforce `user.functionRights` / `user.accessibility` against function codes (`R`, `I`, `D`, `A`, `S`, `H`, `L`).

### Step 3: Canonical Registry & Alias Map — [COMPLETED]
- [x] Implemented `registry/static-commands.ts` and `registry/alias-map.ts`.
- [x] Purged lingering `"ENQUIRY.DESIGN"` legacy aliases.

### Step 4: Dispatcher & Executor — [COMPLETED]
- [x] Implemented `executor/terminal-executor.ts` binding to `useSessionStore` and `useWorkbenchStore`.
- [x] Implemented popup and action dispatchers (`popup-dispatcher.ts`, `action-dispatcher.ts`).
- [x] Exported public `cbsCommand` facade in `src/lib/cbs-command/index.ts`.

### Step 5: Refactor Callers & Screen Registry — [COMPLETED]
- [x] Updated `src/features/screens/registry.tsx` to use the canonical alias resolver.
- [x] Replaced `useCommandExecutor`, `app-sidebar.tsx`, and tab menu items with direct `cbsCommand.execute(...)` calls.
- [x] Removed obsolete files in `src/lib/core/commands/`.

### Step 6: Validation & Verification — [COMPLETED]
- [x] Verified TypeScript compilation (`pnpm tsc --noEmit` = 0 errors).
- [x] Verified Biome formatting and linter compliance on all command gateway and screen registry files (`pnpm biome check` = 0 errors).
- [x] Verified hot-reloading dev server running clean.

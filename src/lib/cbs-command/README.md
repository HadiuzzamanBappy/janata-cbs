# CBS Command Gateway (`@/lib/cbs-command`)

The **CBS Command Gateway** is the single entry point for parsing, validating, resolving, and executing Core Banking Solution (CBS) terminal commands across the application.

It is designed with **zero legacy bridges**, strictly following authentic CBS terminal grammar rules and enforcing RBAC/function-level security before dispatching actions to workspace tabs, detached popout windows, or modal dialogs.

---

## Architecture Overview

```
src/lib/cbs-command/
├── contracts/               # Pure TypeScript data contracts
│   ├── command.ts           # ParsedCommand, ScreenMode, FunctionRightCode ('R','I','D','A','S','H')
│   ├── execution.ts         # Tab/popup routing targets, step overrides, form pre-seeds
│   └── validation.ts        # Permission check results and security clearance details
├── engine/                  # Core grammar parsing & security validation
│   ├── grammar.ts           # Deterministic formula parser for CBS expressions
│   └── validator.ts         # Enforces command-line privileges and user function rights
├── registry/                # Single source of truth for command catalog & screens
│   ├── alias.ts             # Master canonical screen lookup table
│   └── catalog.ts           # Catalog of system canvas screens and navigation commands
├── executor/                # Execution & dispatch engine
│   ├── terminal.ts          # Orchestrates Parse -> Validate -> Target Tab/Popup Dispatch
│   ├── action.ts            # Handles quick system actions (THEME, LOGOUT) & settings tabs
│   └── popup.ts             # Multi-monitor popout window manager
├── index.ts                 # Unified public facade (`cbsCommand`)
└── README.md                # Gateway documentation
```

---

## CBS Grammar Rules & Formula Syntax

The parser does not guess or assume application types from names. Commands must follow explicit CBS syntax rules:

### 1. Inquiries (`INQ` / `INQUIRY`)
Inquiries require an explicit `INQ` or `INQUIRY` prefix:
- **`INQ <NAME>`** (e.g. `INQ GET.EMP.INFO`)  
  Opens the inquiry grid in `VIEW` (`S`) mode.
- **`INQ [FUNCTION] <NAME>`** (e.g. `INQ S GET.EMP.INFO`, `INQ A GET.USER.MGT`)  
  Explicit function code (`S`, `A`, `L`, etc.) is extracted cleanly; opens the inquiry in the corresponding screen mode.

### 2. Base Applications
- **`<APP>`** (e.g. `ACCOUNT`, `CUSTOMER`)  
  Opens the application in `IDLE` search mode (`authLevel: 1`).

### 3. Comma Versions (Auto-Auth / Zero-Auth)
- **`<APP>,`** (e.g. `USER,`, `ACCOUNT,`)  
  Trailing comma indicates an administrative direct-entry version. Automatically sets:
  - `screenMode: "CREATE"`
  - `authLevel: 0` (bypasses maker-checker flow; writes directly to `LIVE`).

### 4. Named Versions
- **`<APP>,<VERSION>`** (e.g. `ACCOUNT,SAVINGS`, `USER.GET,TEST1`)  
  Targets a specialized version layout of the given base application model.

### 5. Record Lookups & Function Codes
- **`<APP> <RECORD_ID>`** (e.g. `ACCOUNT 1000001`)  
  Fetches and loads the record in `EDIT` mode.
- **`<APP> <FUNCTION>`** (e.g. `ACCOUNT I`, `ACCOUNT S`)  
  Opens the application with the specified function mode:
  - `I` → `CREATE` (Input)
  - `S` → `VIEW` (See)
  - `A` → `EDIT` (Authorize / Amend)
  - `R` → `VIEW` (Reverse)
  - `D` → `EDIT` (Delete)
  - `H` → `EDIT` (History)
- **`<APP> <FUNCTION> <RECORD_ID>`** (e.g. `ACCOUNT I 1000001`, `ACCOUNT S 1000001`)  
  Opens the record directly with the requested function mode.

### 6. Shorthand Screen Aliases (1 Alias Per Bespoke Canvas)
Every bespoke administrative canvas has exactly one clean shorthand alias:
- **`MD`** → `SC.MENU.DESIGN` (Menu Hierarchy Designer)
- **`MENU`** → `SC.MENU` (Menu Item Catalog)
- **`UG`** → `SC.USER.GROUP` (User Group & Permissions)
- **`MC`** → `SC.MODEL.CONFIG` (Data Model Config)
- **`COB`** → `SC.COB.REGISTRY` (COB Service Pipeline)
- **`PR`** → `SC.USER.PASS.RESET` (Password Reset & Unlock)
- **`ID`** → `SC.INQUIRY` (Inquiry & Grid Designer)
- **`RS`** → `SC.REPORT.DESIGN` (Report Studio)
- **`PWD`** → `USER.CHANGE.PASS` (Change Password)

### 7. Settings Modals & System Actions
- `PROFILE`, `SETTINGS:PROFILE` → Opens User Profile Settings modal.
- `THEME`, `APPEARANCE`, `SETTINGS:APPEARANCE` → Opens Appearance modal.
- `SECURITY`, `SETTINGS:SECURITY` → Opens Security & Password modal.
- `DARK`, `ACTION:TOGGLE_THEME` → Toggles Dark/Light theme mode.
- `LOGOUT`, `EXIT`, `ACTION:LOGOUT` → Prompts user sign-out confirmation.

---

## Usage Guide

Import the `cbsCommand` facade directly anywhere in the application:

```typescript
import { cbsCommand } from "@/lib/cbs-command";
```

### Executing Commands
```typescript
// From a search bar, command palette, or button click
cbsCommand.execute("INQ S GET.EMP.INFO");

// Executing with custom title or forced screen mode
cbsCommand.execute("ACCOUNT,", {
  title: "New Account (Direct)",
  screenMode: "CREATE",
});

// Opening as a detached multi-monitor popup
cbsCommand.execute("USER 1001", {
  target: "popup",
});
```

### Parsing without Executing
```typescript
const parsed = cbsCommand.parse("ACCOUNT I 1000001");
console.log(parsed);
// {
//   raw: "ACCOUNT I 1000001",
//   type: "FORM",
//   application: "ACCOUNT",
//   functionCode: "I",
//   recordId: "1000001",
//   screenMode: "CREATE",
//   authLevel: 1,
//   isValid: true
// }
```

### RBAC Security Validation
```typescript
const security = cbsCommand.validate(parsed, currentUser);
if (!security.allowed) {
  console.warn(`Denied: ${security.reason}`);
}
```

### Resolving Aliases & Screen Keys
```typescript
cbsCommand.resolveAlias("MD"); 
// -> "SC.MENU.DESIGN"

cbsCommand.getScreenKey("COB"); 
// -> "SC.COB.REGISTRY"
```

---

## Testing & Compilation
Verify types and grammar integrity:
```bash
npx tsc --noEmit
pnpm biome check src/lib/cbs-command
```

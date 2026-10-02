# FinX-UI Development Plan: Enterprise Logging & Full Command Platform

> **Goal:** 
> 1. Implement a banking-grade, compliance-ready Logger with PII redaction and structured JSON logging.
> 2. Implement the Universal Command Execution Platform supporting Temenos CBS command grammar and RIDASH Function Rights (`R`, `I`, `D`, `A`, `S`, `H`) across all screens.

---

## Architecture Blueprint

```
                      [ User Command Input / CMD Bar ]
                                     |
                                     v
                       [ Command Grammar Parser ]
                    (e.g., "ACCOUNT I F3", "ENQ USER.LIST")
                                     |
                     +---------------+---------------+
                     |                               |
                     v                               v
             [ Screen Resolver ]             [ RIDASH Validator ]
       (FormScreen vs EnquiryScreen)       (R, I, D, A, S, H Checks)
                     |                               |
                     +---------------+---------------+
                                     |
                                     v
                           [ Screen Launcher ]
                        (Tab / Detached Popup)
                                     |
                                     v
                 [ Centralized Banking Logger (PII Redacted) ]
                     (Dev: Formatted / Prod: Structured JSON)
```

---

## Phased Roadmap

### Phase 1: Banking-Grade Structured Logger (`src/lib/logger/`)
**Objective:** Replace raw `console.log` statements with a centralized, server-safe, PII-redacted logger compliant with banking audit standards.

- [x] **1.1 Core Logger Engine (`src/lib/logger/index.ts`):**
  - Implement log levels: `debug`, `info`, `warn`, `error`.
  - In `development`: Human-readable colored console output with timestamps.
  - In `production`: Machine-readable JSON output streaming to `process.stdout` / `process.stderr`.
- [x] **1.2 PII & Sensitive Data Redaction:**
  - Automatically detect and redact sensitive keys: `password`, `token`, `secret`, `authorization`, `confPass`, `accountNumber`.
  - Mask account numbers: Display only last 4 digits (e.g. `AC****1234`).
- [x] **1.3 Replace Raw Console Usages:**
  - Refactor Redis warnings, session timeout logs, and gRPC error dumps to use `logger.warn`, `logger.info`, and `logger.error`.
- [x] **1.4 Verification:**
  - Verify that `pnpm typecheck` and `pnpm verify:matrix` pass with 0 errors.
  - Test redaction utility with simulated login/password payloads.

---

### Phase 2: CBS Command Grammar Parser (`src/lib/core/command-parser.ts`)
**Objective:** Support standard banking command line syntax used by tellers and CBS power users.

- [x] **2.1 Temenos Command Syntax Parsing:**
  - Support:
    - `<APPLICATION>` (e.g., `ACCOUNT`, `CUSTOMER`) $\rightarrow$ Opens in `IDLE` mode.
    - `<APPLICATION>,<ID>` or `<APPLICATION> <ID>` (e.g., `ACCOUNT,1001` or `ACCOUNT 1001`) $\rightarrow$ Opens in `EDIT` mode with record ID.
    - `<APPLICATION> <FUNCTION> <ID>` (e.g., `ACCOUNT I`, `ACCOUNT I F3`, `ACCOUNT S 1001`, `ACCOUNT A 1001`, `ACCOUNT D 1001`) $\rightarrow$ Parses function code (`I` = Input/Create, `S` = See/View, `A` = Authorise, `D` = Delete, `H` = Hold) and record ID.
    - `ENQ <QUERY>` / `INQ <QUERY>` (e.g., `ENQ USER.LIST`, `ENQ STMT.ENT.BOOK`) $\rightarrow$ Routes to `EnquiryScreen`.
    - `SETTINGS:<TAB>` / `ACTION:<ACT>` $\rightarrow$ Routes to settings dialog or quick actions.
- [x] **2.2 Parser Return Contract (`ParsedCommand`):**
  ```ts
  export interface ParsedCommand {
    raw: string;
    type: "FORM" | "ENQUIRY" | "SETTINGS" | "ACTION" | "CUSTOM";
    application: string;
    functionCode?: "R" | "I" | "D" | "A" | "S" | "H";
    recordId?: string;
    screenMode: "IDLE" | "CREATE" | "EDIT" | "VIEW";
    title: string;
  }
  ```

---

### Phase 3: RIDASH Accessibility & Function Rights Enforcement
**Objective:** Restrict and enforce actions based on the user's `accessibility: "RIDASH"` permissions from `.response/user.json`.

| Code | Name | Action In Form / Enquiry | Required Permission Check |
| :---: | :--- | :--- | :--- |
| **`R`** | **Read / Reverse** | Reverse financial transactions / Read historical entries | `canRead` |
| **`I`** | **Input** | Create new records (`+` button, `ACCOUNT I`, `F3` new ID) | `canInput` |
| **`D`** | **Delete** | Delete unapproved draft records | `canDelete` |
| **`A`** | **Amend / Authorise** | Modify existing records (`Edit3`) / Authorise pending transactions | `canAmend` |
| **`S`** | **See** | View-only read of live files and enquiry lists (`Eye` button) | `canSee` |
| **`H`** | **Hold** | Park records in unapproved draft status without validation | `canHold` |

- [x] **3.1 Command-Level Permission Guard:**
  - If a user types `ACCOUNT I` but their accessibility rights string lacks `I`, display an immediate error toast: `"Permission Denied: User lacks Input ('I') rights for this application"`.
- [x] **3.2 Action Button Alignment:**
  - Ensure all action buttons in [FormHeader](file:///d:/Work/React/cbs/finx-ui/src/features/screens/forms/components/form-header.tsx) and [ActionButtons](file:///d:/Work/React/cbs/finx-ui/src/features/screens/forms/components/actions/action-buttons.tsx) evaluate against the active user's `useUserRights()`.

---

### Phase 4: Full Command Bar & Keyboard Integration
**Objective:** Enable executing raw commands directly from the Command Bar (`⌘K` / `Ctrl+K`) and Top Bar with enter-key dispatching.

- [x] **4.1 Command Bar Direct Execution:**
  - Update [AppSearch](file:///d:/Work/React/cbs/finx-ui/src/components/layout/app-search.tsx) so when a user types a raw command (e.g. `ACCOUNT I`, `ENQ USER.LIST`, `FUNDS.TRANSFER 2001`) and hits Enter, it parses and executes immediately even if not in the pre-indexed list.
- [x] **4.2 Screen Mode Hand-off:**
  - Pass the parsed `screenMode` (`CREATE`, `EDIT`, `VIEW`, `IDLE`) and `searchRecordId` directly to `launchScreen` and workbench tabs.
- [x] **4.3 Verification & End-to-End Testing:**
  - Test all RIDASH permutations:
    - User with `RIDASH` (All actions permitted).
    - User with `R---S-` (View only, input/delete disabled).
  - Verify `pnpm typecheck` and `pnpm verify:matrix`.

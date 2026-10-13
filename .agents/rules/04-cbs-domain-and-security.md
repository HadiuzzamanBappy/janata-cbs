# 04: Core Banking Domain & Security Rules

## 1. Banking Entitlement Engine (`RIDASHL`)
All user capabilities and screen permissions strictly adhere to the 7-character accessibility profile:
- **`R`**: Reverse live authorized record
- **`I`**: Input new record or modify draft (Maker)
- **`D`**: Delete pending/unauthorized record
- **`A`**: Authorize pending record (Checker)
- **`S`**: See / View record details
- **`H`**: Hold record
- **`L`**: List / Query directory of records

Always check permissions via `useCbsAccess()` or `src/lib/cbs-access` before rendering action buttons or allowing transactional input.

## 2. Four-Eyes Principle (Maker-Checker Enforcement)
- **Critical Banking Rule**: A record inputter (`Maker`) can NEVER authorize their own record (`Checker !== Maker`).
- When an unauthorized record (`INA`) is viewed:
  - If `record.authoriser === currentTeller`, authorization is strictly blocked.
  - Disable the Authorize action button and show an explicit tooltip explaining the restriction (`"Four-Eyes restriction: You cannot authorize your own record"`).

## 3. CBS Command Gateway
- **No Direct `<Link>` to Screens**: Never use `<Link href="/screen/...">` or `router.push()` to navigate between CBS transaction screens. Navigation must trigger `cbsCommand.execute("COMMAND ...")`.
- **Command Syntax Standards**:
  - `USER,` (Comma shorthand = auto-auth)
  - `ACCOUNT I 1001` (Application + Function + Record ID)
  - `INQ GET.EMP.INFO` (Inquiry inquirySpec)
  - Canonical aliases must be resolved through `getCanonicalScreenKey()` (e.g. `MD` → `SC.MENU.DESIGN`).

## 4. Multi-Instance Tab / Window Contract
- Execution clicks spawn independent workspace instances.
- Never overwrite active unsaved form tabs.
- Cross-window actions (Authorize, Delete) broadcast on `BroadcastChannel("cbs_workbench_bus")` to trigger re-fetches in background tabs.

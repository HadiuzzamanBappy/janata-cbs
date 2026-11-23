# 03: Domain & Security

## 1. Server boundary

Which modules are `server-only`, and the rule to validate everything from outside with `data-schemas` + `.safeParse()`, are in `AGENTS.md` §3 (invariant 2). This adds:

- **Client code reaches the backend only through**:
  1. the API proxy (`/api/proxy` via `src/lib/cbs-client`);
  2. the auth routes (`/api/login`, `/api/logout`, `/api/session`, `/api/change-password`) via `cbsAuth`;
  3. Server Actions. **A Server Action is a public POST endpoint:** validate every argument, and check the session before returning anything non-public.
- **No client-supplied paths**: never join a client-supplied string (route slug, action argument) into a filesystem path without checking it against an allowlist first.
- **Zero Client Trust on Identity**: The proxy unconditionally overwrites `userId`, `branchCode`, and clearance levels with the server-verified session. Client-submitted identities are stripped.
- **First-Sign-on Quarantine (`initLogin`)**: Users flagged with `initLogin: true` are blocked from `/api/proxy` (HTTP 403) and restricted exclusively to `/change-password`.

## 2. Entitlements (`RIDASHL`)

Each user has a 7-character rights profile:

- **`R`**: Reverse authorized live record (`AU`)
- **`I`**: Input new record or modify draft (Maker)
- **`D`**: Delete pending unauthorized record (`UA`)
- **`A`**: Authorize pending record into ledger (Checker)
- **`S`**: See / View record details
- **`H`**: Hold record
- **`L`**: List / Query directory catalog

Always check capabilities via `useCbsAccess()` or `src/lib/cbs-access` before rendering action buttons.

## 3. Four-Eyes (maker ≠ checker)

- The record's inputter (maker) never authorizes it (checker ≠ maker).
- The check is `evaluateCbsAccess()` in `@/lib/cbs-access`: the user ID is compared with the record's **inputter** (trimmed, case-insensitive), and on a match `isFourEyesViolation` is `true` and `canAuthorize` is `false`.
- Keep the Authorize button visible but disabled, with the reason from `getDisableReason(CbsRecordFunction.AUTHORIZE)` in its tooltip: _"Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction."_
- **Where it is enforced**: only in the UI. `/api/proxy` rejects a missing **right** with 403 (`verifyUserRecordAccess`) but doesn't load the record, so it can't compare the user with the inputter. The offline mock doesn't check either. Never weaken the UI check on the assumption that the server will catch it.

## 4. Command gateway & Window Security

Navigation rules are in `AGENTS.md` §3 and the `cbs-command-and-navigation` skill. Security-relevant points:

- Commands go through `validateSecurityPermissions()`: a signed-in user is required, `commandLine === false` blocks typed commands, and a function code requires that RIDASHL right.
- **Strict Origin Verification**: Every cross-window event handler (`BroadcastChannel` or `window.addEventListener("message")`) must verify `e.origin === window.location.origin` before processing.
- Cross-window messages (dock, record mutation, session events) are untrusted input. Validate them with a schema before acting on them (`dockTabPayloadSchema`).
- **URL Parameter Privacy**: Never place financial balances, form drafts, or customer PII in URL query strings. Staged drafts travel strictly via `sessionStorage` (`cbsStorage`), keyed by unpredictable `tabId`.
- On sign-on by a **different** operator, the workbench closes all tabs and purges staged drafts. Never remove that purge: it keeps one user's data from showing for another.

## 5. Banking-Grade Privacy & Logging

- **Zero Raw `console.*`**: All client and server logging must route through `@/lib/core-logger` (`logger.*`). Raw console logging is strictly prohibited in production code.
- **Automatic PII Redaction**: Customer account numbers, national IDs, passwords, PAN/card numbers, and JWT session tokens must be automatically masked before emission.

# 03: Core Banking Domain & Security Architecture

## 1. Strict Server Boundary (`"server-only"`)

- The browser client MUST NEVER import gRPC, Redis, or Node backend drivers.
- Every backend module under `src/lib/infra-grpc/`, `src/lib/infra-redis/`, and `src/proxy.ts` must begin with:

  ```ts
  import "server-only";
  ```
- **Client Communication**: Client code interacts with backend systems strictly through:
  1. The API proxy (`/api/proxy` via `src/lib/cbs-client`)
  2. The auth routes (`/api/login`, `/api/logout`, `/api/session`, `/api/change-password`) via `cbsAuth`
  3. Next.js Server Actions. **A Server Action is a public POST endpoint:** validate every argument with Zod, and check the session before returning anything non-public.
- **Zod Validation Boundary**: Everything entering from outside (route bodies, Server Action arguments, URL params, `BroadcastChannel` / `postMessage` messages) must be validated with a schema from `src/lib/data-schemas/` using `.safeParse()`.
- **No client-supplied paths**: never join a client-supplied string (route slug, action argument) into a filesystem path without validating it against an allowlist first.

## 2. Banking Entitlement Engine (`RIDASHL`)

User capabilities strictly adhere to the 7-character capability profile:

- **`R`**: Reverse authorized live record (`AU`)
- **`I`**: Input new record or modify draft (Maker)
- **`D`**: Delete pending unauthorized record (`UA`)
- **`A`**: Authorize pending record into ledger (Checker)
- **`S`**: See / View record details
- **`H`**: Hold record
- **`L`**: List / Query directory catalog

Always check capabilities via `useCbsAccess()` or `src/lib/cbs-access` before rendering action buttons.

## 3. Four-Eyes Principle (Maker-Checker Enforcement)

- **Non-Negotiable Rule**: A record inputter (`Maker`) can NEVER authorize their own record (`Checker !== Maker`).
- The check is `evaluateCbsAccess()` in `@/lib/cbs-access`: the user ID is compared with the record's **inputter** (trimmed, case-insensitive), and on a match `isFourEyesViolation` is `true` and `canAuthorize` is `false`.
- Keep the Authorize button visible but disabled, with the reason from `getDisableReason(CbsRecordFunction.AUTHORIZE)` in its tooltip: _"Four-Eyes Compliance: The Maker/Inputter cannot authorize their own transaction."_
- **Where it is enforced**: only in the UI. `/api/proxy` rejects a missing **right** with 403 (`verifyUserRecordAccess`) but doesn't load the record, so it can't compare the user with the inputter. The offline mock doesn't check either. Never weaken the UI check on the assumption that the server will catch it.

## 4. CBS Command Gateway

Navigation rules are in `AGENTS.md` §3 and the `cbs-command-and-navigation` skill. Security-relevant points:

- Commands go through `validateSecurityPermissions()`: a signed-in user is required, `commandLine === false` blocks typed commands, and a function code requires that RIDASHL right.
- Cross-window messages (dock, record mutation, session events) are untrusted input. Validate them with a schema before acting on them (`dockTabPayloadSchema`).
- On sign-on by a **different** operator, the workbench closes all tabs and purges staged drafts. Never remove that purge: it keeps one user's data from showing for another.

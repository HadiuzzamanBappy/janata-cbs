# 03: Core Banking Domain & Security Architecture

## 1. Strict Server Boundary (`"server-only"`)

- The browser client MUST NEVER import gRPC, Redis, or Node backend drivers.
- Every backend module under `src/lib/infra-grpc/`, `src/lib/infra-redis/`, and `src/proxy.ts` must begin with:

  ```ts
  import "server-only";
  ```
- **Client Communication**: Client code interacts with backend systems strictly through:
  1. The API proxy (`/api/proxy` via `src/lib/cbs-client`)
  2. Next.js Server Actions with internal Zod validation
- **Zod Validation Boundary**: All incoming wire payloads crossing route handlers or actions must be validated using schemas in `src/lib/data-schemas/` using `.safeParse()`.

## 2. Banking Entitlement Engine (`RIDASHL`)

User capabilities strictly adhere to the 7-character capability profile:
- **`R`**: Reverse authorized live record (`AU`)
- **`I`**: Input new record or modify draft (Maker)
- **`D`**: Delete pending unauthorized record (`INA`)
- **`A`**: Authorize pending record into ledger (Checker)
- **`S`**: See / View record details
- **`H`**: Hold record
- **`L`**: List / Query directory catalog

Always check capabilities via `useCbsAccess()` or `src/lib/cbs-access` before rendering action buttons.

## 3. Four-Eyes Principle (Maker-Checker Enforcement)

- **Non-Negotiable Rule**: A record inputter (`Maker`) can NEVER authorize their own record (`Checker !== Maker`).
- When an unauthorized record (`INA`) is viewed:
  - If `record.authoriser === currentTeller` or maker matches the active user, authorization is strictly blocked.
  - Disable the Authorize action button and show an explicit tooltip explaining the restriction.

## 4. CBS Command Gateway

- **No Direct `<Link>` to Screens**: Never use `<Link href="/screen/...">` or `router.push()` to navigate between CBS transaction screens. Navigation must trigger `cbsCommand.execute("COMMAND ...")`.
- Canonical aliases resolve through `getCanonicalScreenKey()` (e.g. `MD` → `SC.MENU.DESIGN`).

## 5. Multi-Instance Tab / Window Contract

- Internal tabs run in-memory via `WorkbenchStore`.
- Popped-out windows run under `src/app/(workbench)/screen/[id]/page.tsx`.
- Cross-window record actions (Authorize, Delete, Save) broadcast on `BroadcastChannel("cbs_workbench_bus")` to trigger background parent tab re-fetches.

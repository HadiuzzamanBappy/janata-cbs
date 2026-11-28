---

name: cbs-client-wire-protocol
description: Use this skill when communicating between the frontend and backend, calling the /api/proxy endpoint, fetching dynamic GMC schemas, running inquiry queries, or executing record transactions.
---

# CBS Client Wire Protocol & Proxy Runbook

The browser never talks to gRPC, Redis or a database. Every banking request is a `CbsWirePayload` built by a factory in `@/lib/cbs-client` and `POST`ed to `/api/proxy`. Reference docs: `src/lib/cbs-client/README.md` (client), `src/lib/infra-grpc/README.md` and `src/lib/infra-redis/README.md` (server).

---

## 1. Reading

```typescript
import { cbs, cbsQueries } from "@/lib/cbs-client";
import { isApiSuccess } from "@/lib/data-schemas";

// One-off read
const res = await cbs.send(cbs.model("ACCOUNT").get("1001"), { silent: true });
if (isApiSuccess(res)) {
  // res.data: already decoded by /api/proxy
}

// Read-mostly data in components: TanStack Query options
const { data: branches } = useQuery(cbsQueries.branch.list());
```

- Factories: `cbs.model(control)` (`get`, `list`, `searchIds`, `getNewId`, `save`, `authorize`, `delete`, `hold`, `reverse`), the pre-bound `cbs.branch`, `cbs.control`, `cbs.menu` and `cbs.inquiryConfig`, plus `cbs.menuTree`, `cbs.modelConfig`, `cbs.formConfig` and `cbs.inquiry.executeQuery()`.
- Control names come from `CbsControlTable` in `@/types` (`CONFIG.FORM`, `MODEL.CONFIG`, `INQUIRY`, `MENU.TREE`, …).
- Pass `responseSchema` to validate `data` on the client, and `signal` to cancel.
- Inquiries go through `useInquiryRunner()` in `@/components/cbs-inquiry-engine`. The browser sends the inquiry ID and the operator's filter values only; `/api/proxy` (`resolveInquiryEnvelope`) takes the controller, service, fixed selection and branch pin from the saved inquiry and refuses anything else. Don't build a `queryString` by hand.

## 2. Writing (mutations)

```typescript
const { sendMutation } = useIdempotentSend(); // @/components/cbs-screen

await sendMutation(cbs.model("CUSTOMER").save(changedFields, { recordId }), {
  successMessage: "Customer record saved",
});
```

- **Every mutation** (`isCbsMutationRequest()`: `PUT`, `AUT`, `DEL`, `HLD`, `REV`, `SFC`, …) needs a UUIDv4 `idempotencyKey`. `sendMutation()` adds it, reuses it when an unchanged payload is retried after a network or 5xx failure, and rotates it after a definite result. Calling `cbs.send()` directly with a mutation **fails validation**.
- Send only changed fields on an amend (`computeDelta()` from `@/lib/cbs-record`; see the form lifecycle skill).
- After a successful mutation, call `broadcastRecordMutation(control, recordId)` from `@/lib/cbs-screen` so other tabs and popups refresh.

## 3. Errors

`cbs.send()` raises **one** toast per failure (through `notifyUser`). Don't toast the same error again in a hook; pass `silent: true` if you handle it yourself. A 401 broadcasts `CBS_SESSION_EXPIRED` and sends the main window to sign-on.

## 4. Server side

- The proxy's steps are in `AGENTS.md` §4. The parts that matter on the client: the schema is strict (unknown keys are rejected), user and branch always come from the session, the proxy checks rights and, before every authorize, Four-Eyes against the pending record, and failed responses are never cached.
- A new route or Server Action validates its input with a `data-schemas` schema, checks the session itself, and replies with `apiSuccess` / `apiFail` / `apiError` (`src/app/api/_lib/response.ts`).
- The wire contract (`proto/service.proto`, request types, control and field names) is a production compatibility boundary (`.agents/rules/00-core-pillars.md` §1). Regenerate stubs with `pnpm proto:gen`.

## 5. Verification

`verify:client`, `verify:grpc`, `verify:parsers`, `verify:redis`, plus `verify:api` against a live core before shipping wire changes.

# 🌐 CBS Client (`@/lib/cbs-client`)

Layer L2: the browser's only way to reach the core. Every banking request is built by a payload factory and sent with `cbs.send()` to `POST /api/proxy`. Screens that read data use the TanStack Query options in `cbsQueries`, and sign-on, session and password calls go through `cbsAuth`. No component calls `fetch()` itself.

---

## 📦 Parts

| Export                                        | File                        | What it is                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cbs.send(payload, options?)`                 | `transport/proxy-client.ts` | Validates the payload against `cbsWirePayloadSchema`, `POST`s it to `/api/proxy`, optionally validates `data` with `responseSchema`, and raises the toast.                                                                                                                                                                          |
| `cbs.model(control)` and the pre-bound tables | `payloads/`                 | Payload factories. `cbs.model(control)` gives `get`, `list`, `searchIds`, `getNewId`, `save`, `authorize`, `delete`, `hold` and `reverse`. Pre-bound: `cbs.branch`, `cbs.control`, `cbs.menu`, `cbs.inquiryConfig`, plus the special builders `cbs.menuTree`, `cbs.modelConfig`, `cbs.formConfig` and `cbs.inquiry.executeQuery()`. |
| `cbsQueries`                                  | `queries/`                  | TanStack Query v5 `queryOptions` for read-mostly data: branch list, menus, menu tree, controls, model lookups, and the Model / Form / Inquiry config schemas. Each sets its own `queryKey` and `staleTime`.                                                                                                                         |
| `cbsAuth`                                     | `transport/auth-client.ts`  | `login`, `changePassword`, `getSession`, `updateBranch`, `logout`. These call the dedicated `/api/*` auth routes, not `/api/proxy`.                                                                                                                                                                                                 |

`SendCbsOptions`: `silent`, `successTitle`, `successMessage`, `errorMessage`, `signal` (`AbortSignal`), `responseSchema`.

---

## 🔒 Rules

1. **Mutations go through `useIdempotentSend()`** (`src/components/cbs-screen/hooks/use-idempotent-send.ts`). Its `sendMutation()` attaches a UUIDv4 `idempotencyKey`, reuses the same key when an unchanged payload is retried after a network or 5xx failure, and rotates the key after a definite result. Calling `cbs.send()` directly with a mutation (`save`, `authorize`, `delete`, `hold`, `reverse`) fails validation, because the key is required.
2. **One toast per failure, raised here.** `cbs.send()` reports errors through `notifyUser` (the command gateway's notification adapter). Callers don't toast the same error again; pass `silent: true` to handle it yourself.
3. **Session expiry is handled once.** A 401 broadcasts `CBS_SESSION_EXPIRED` to every window. The main window then goes to the sign-on page, and a popup shows a message instead.
4. **Use the canonical control names** from `CbsControlTable` in `@/types` (for example `CONFIG.FORM`, `MODEL.CONFIG`, `INQUIRY`, `MENU.TREE`), never hand-typed strings.

---

## 🚀 Usage

Reading:

```typescript
import { cbs } from "@/lib/cbs-client";
import { isApiSuccess } from "@/lib/data-schemas";

const res = await cbs.send(cbs.model("ACCOUNT").get("1001"), { silent: true });
if (isApiSuccess(res)) {
  // res.data is already decoded by /api/proxy
}
```

Writing (inside a component or hook):

```typescript
const { sendMutation } = useIdempotentSend();

await sendMutation(cbs.model("CUSTOMER").save(formData, { recordId }), {
  successMessage: "Customer record saved",
});
await sendMutation(cbs.model("CUSTOMER").authorize(recordId));
```

Query data in a component:

```typescript
import { useQuery } from "@tanstack/react-query";
import { cbsQueries } from "@/lib/cbs-client";

const { data: branches } = useQuery(cbsQueries.branch.list());
```

Inquiries are sent by `runInquiry()` in `@/components/cbs-inquiry-engine`, which builds `cbs.inquiry.executeQuery()` from the inquiry config. Don't build the inquiry `queryString` by hand.

---

## ➕ A new table

Nothing to add: `cbs.model("NEW.TABLE")` already supports every standard operation. Pre-bind a table in `index.ts` only if it is a permanent system table. In that case, add its name to `CbsControlTable` in `@/types` first.

---

## 🧪 Verification

```bash
pnpm verify:client
```

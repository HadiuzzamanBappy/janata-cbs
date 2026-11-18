# 📐 CBS Data Schemas (`@/lib/data-schemas`)

Layer L0: the Zod schemas for everything that crosses a trust boundary (browser → proxy, proxy → core, URL → popup, window → window, environment → server), plus the configuration records the core sends (Model, Form, Inquiry and Menu config). Each TypeScript type is derived from its schema with `z.infer`, so there is no hand-written duplicate type to drift.

It imports only `zod` and `@/types`, and every consumer imports it through the barrel: `@/lib/data-schemas`.

---

## 📦 Files

| File                       | Contents                                                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `common-schema.ts`         | API status (`CBS_API_STATUS`, `isApiSuccess()`), audit trail (`auditDataSchema`), the browser → proxy request (`cbsWirePayloadSchema`), the proxy → core envelope, and the response envelope (`apiResponseSchema`) |
| `auth-schema.ts`           | Login and change-password input (`MIN_PASSWORD_LENGTH` = 8), the session user (`currentUserSchema`) and branch switching                                                                                           |
| `env-schema.ts`            | Server environment (`envSchema`), parsed once in `src/lib/core-config/env.ts`                                                                                                                                      |
| `control-schema.ts`        | `SC_CONTROL` command records (`ControlCommand`, `ControlType`)                                                                                                                                                     |
| `model-config-schema.ts`   | Model Config records (control `MODEL.CONFIG`, edited in the `SC.MODEL.CONFIG` designer): the data schema of a screen, and its property types                                                                       |
| `form-engine-schema.ts`    | Form elements, sections and containers, field rules (validation, visibility, cascade) and width tokens                                                                                                             |
| `form-widget-schema.ts`    | Widget types, the property-type ↔ widget compatibility matrix, and widget configs                                                                                                                                  |
| `form-config-schema.ts`    | Form Config records (control `CONFIG.FORM`, edited in the `SC.FORM.CONFIG` designer) and the form-config response                                                                                                  |
| `inquiry-config-schema.ts` | Inquiry Config records (columns, filters, commands), filter criteria and inquiry result rows                                                                                                                       |
| `menu-designer-schema.ts`  | Menu items and the menu tree (`SC_MENU`, `SC_MENU_TREE`)                                                                                                                                                           |
| `screen-params-schema.ts`  | Popup URL params (`popupSearchParamsSchema`, `popupRouteParamsSchema`) and the popup → shell dock message (`dockTabPayloadSchema`)                                                                                 |

---

## 🔒 Rules

1. **Schema first, type derived.** Define the Zod schema and export `type X = z.infer<typeof xSchema>`. Never write the TypeScript type separately.
2. **Validate at the boundary with `.safeParse()`**, and never cast external data (`as T`) instead.
3. **The browser → proxy request is strict.** `cbsWirePayloadSchema` rejects unknown keys. Every mutation (`isCbsMutationRequest()` in `@/types`) must carry a UUID `idempotencyKey`. `servicePath` is optional; if it's missing, `dispatch()` sends to the `default` core service.
4. **One success check.** `status` is a strict enum (`apiStatusSchema`). Test responses with `isApiSuccess()`, never by comparing against `"SUCCESS"` by hand.
5. **URL params degrade one field at a time.** Each popup URL field uses `.optional().catch(undefined)`, so one tampered value falls back to its default without throwing away the others. The dock message is the opposite: a bad payload is rejected whole.
6. **Module-private by default.** Export only what another unit imports. Helpers used inside one file stay unexported.

---

## 🚀 Usage

Types for components and hooks:

```typescript
import type { FormConfigRecord, InquiryConfigRecord, MenuTreeRecord } from "@/lib/data-schemas";
```

Validating untrusted input (from `src/store/workbench/workbench-provider.tsx`):

```typescript
import { dockTabPayloadSchema } from "@/lib/data-schemas";

const parsed = dockTabPayloadSchema.safeParse(message.payload);
if (!parsed.success) return; // ignore a malformed cross-window message
store.getState().addTab(parsed.data);
```

You don't validate requests yourself. `cbs.send()` in `@/lib/cbs-client` checks the payload against `cbsWirePayloadSchema` before sending, and `/api/proxy` checks it again on the server.

---

## ➕ Adding a schema

1. Add the schema and its `z.infer` type to the file for its domain, or to a new `<domain>-schema.ts`.
2. Export the file from `index.ts`.
3. If the core sends the record in a raw form, add its parser to `@/lib/data-parsers`.
4. Add a case to `scripts/verify/verify-data-schemas.ts`.

---

## 🧪 Verification

```bash
pnpm verify:schemas
```

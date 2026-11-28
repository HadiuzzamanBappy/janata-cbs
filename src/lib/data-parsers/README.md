# 🔄 CBS Wire Data Parsers & Serializers (`@/lib/data-parsers`)

Layer L1: turns what the core sends into typed domain records (checked against `@/lib/data-schemas`), and turns records edited in the designers back into clean JSON for saving. It has no React and no I/O.

---

## 📦 Files

| File                           | Direction | Contents                                                                                                                                                                                                                                                                                        |
| ------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `protobuf-decoder.ts`          | in        | `decodeProtobufValue()` unwraps Protobuf `Value` / `Struct` / `ListValue` into plain JSON. `unwrapRecordsPayload()` pulls the list out of `data.records`, `data.list` or a bare array. `extractRecordInputter()` finds a single record's maker (`recInputter`) for the proxy's Four-Eyes check. |
| `auth-parser.ts`               | in        | `parseAuthWirePayload()`: login response → `CurrentUser` + token (used by `infra-grpc/auth.ts`)                                                                                                                                                                                                 |
| `inquiry-rows-parser.ts`       | in        | `parseInquiryRecords()`: INQ result set → `InquiryRow[]`. Runs **only** in `/api/proxy`.                                                                                                                                                                                                        |
| `form-config-parser.ts`        | in        | `parseGfcResponse()`: form-config response → `ModelConfigRecord` + `FormConfigRecord`                                                                                                                                                                                                           |
| `form-config-serializer.ts`    | out       | `sanitizeFormConfigRecord()`                                                                                                                                                                                                                                                                    |
| `inquiry-config-parser.ts`     | in        | `parseInquiryConfig()`, including the core's SN-keyed records                                                                                                                                                                                                                                   |
| `inquiry-config-serializer.ts` | out       | `sanitizeInquiryConfigRecord()`                                                                                                                                                                                                                                                                 |
| `model-config-parser.ts`       | in + out  | `extractModelConfigRecord()` (finds the model record in a response, or `null`) and `sanitizeModelConfigRecord()`                                                                                                                                                                                |
| `menu-designer-parser.ts`      | in + out  | `parseMNU()` (sidebar menus), `parseMenuTreeRecord()` and `sanitizeMenuTreeRecord()`                                                                                                                                                                                                            |

---

## ⚙️ Where each stage runs

```text
core response ──► decodeProtobufValue()      server only, once: /api/proxy (+ parseInquiryRecords for INQ), and login
                         │
                         ▼  plain JSON reaches the browser
                  unwrapRecordsPayload() + *-parser.ts    client or server: map keys, apply defaults, safeParse
                         │
                         ▼
                  typed record (ModelConfigRecord, FormConfigRecord, …)

designer state ──► sanitize*Record()          before a save: drop client-only IDs and default values
                         │
                         ▼
                  clean JSON ──► /api/proxy
```

---

## 🔒 Rules

1. **Decode once, on the server.** `decodeProtobufValue()` is called only in `/api/proxy` and in the login parser. Client-side parsers receive decoded data and must never decode again. Decoding twice is not safe: a real record attribute named `fields` would be flattened.
2. **Parsers report failure, they don't throw.** `parseGfcResponse()`, `parseInquiryConfig()`, `parseMNU()` and `parseMenuTreeRecord()` return `{ success: true, data }` or `{ success: false, error }`, and validate with `safeParse` against their schema.
3. **Sanitizers are total: `(record: T) => T`.** Callers never write `sanitize(x) || x`. Sanitizers remove client-only IDs (such as `f_…` and `tab_…`) and default values, so they never reach the core.
4. **One file per domain**, holding both the parser and the sanitizer. Split it into `<domain>-parser.ts` and `<domain>-serializer.ts` only when it grows past the helper size budget in `AGENTS.md`, or when the parts run in different places (that's why `inquiry-rows-parser.ts` is separate). Callers import from the barrel, so a split never affects them.

---

## 🚀 Usage

```typescript
import { parseGfcResponse, sanitizeFormConfigRecord } from "@/lib/data-parsers";

const result = parseGfcResponse(response); // response.data is already decoded by /api/proxy
if (result.success) {
  const { model, form } = result.data;
}

const payload = sanitizeFormConfigRecord(draftForm); // clean JSON, ready to save
```

---

## ➕ Adding a domain

1. Add its schema to `@/lib/data-schemas`.
2. Create `<domain>-parser.ts`. Use `unwrapRecordsPayload()` on the already-decoded payload (never `decodeProtobufValue()`), then `safeParse` against the schema.
3. If the domain is saved from the UI, add a total `sanitize<Domain>Record()` next to the parser.
4. Export the file from `index.ts` and add a case to `scripts/verify/verify-data-parsers.ts`.

---

## 🧪 Verification

```bash
pnpm verify:parsers
```

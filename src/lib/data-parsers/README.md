# 🔄 CBS Wire Data Parsers & Serializers (`@/lib/data-parsers`)

The centralized data translation, wire-decoding, and serialization (SerDe) library for the **Janata Core Banking Workbench**.

It transforms raw, low-level Google Protobuf wire structs (`string_value`, `struct_value`, `list_value`, nested fields) into clean, strongly typed domain records validated against `data-schemas`, and provides co-located sanitizers to serialize client records back to wire-clean JSON for persistence.

---

## 📦 What It Contains

```text
src/lib/data-parsers/
├── protobuf-decoder.ts       # Universal Protobuf wire normalizer & response envelope unwrapper
├── auth-parser.ts            # Parses login/auth responses into typed CurrentUser models and session tokens
├── form-config-parser.ts     # Parses GFC responses into ModelConfigRecord + FormConfigRecord
├── form-config-serializer.ts # Sanitizes FormConfigRecord (elements, sections, routines) for persistence
├── inquiry-config-parser.ts  # Parses inquiry definitions (incl. core SN-keyed records)
├── inquiry-config-serializer.ts # Sanitizes InquiryConfigRecord (criteria, columns, commands) for persistence
├── inquiry-rows-parser.ts    # Parses INQ result sets into InquiryRow[] (runs in the BFF proxy only)
├── menu-designer-parser.ts   # Parses GUM navigation menus (parseMNU) and visual trees (SC_MENU_TREE)
├── model-config-parser.ts    # Parses GMC responses & ModelConfigRecord; sanitizes model properties and model configs
└── index.ts                  # Public barrel export
```

---

## ⚙️ The Bidirectional SerDe Pipeline

Every wire payload flows symmetrically through two distinct directions:

```text
               INBOUND (Read / Fetch)
             Raw gRPC / Wire Response
                        │
                        ▼
┌──────────────────────────────────────────────┐
│ 1. DECODER STAGE (protobuf-decoder.ts)       │
│ • Unwraps Protobuf primitives:               │
│   string_value, number_value,                │
│   bool_value, null_value                     │
│ • Recursively normalizes:                    │
│   list_value -> Array                        │
│   struct_value -> Object                     │
│   fields -> Dictionary                       │
│ • Unwraps response envelopes                 │
│   (data.records, data.list)                  │
└───────────────────────┬──────────────────────┘
                        │ Plain JavaScript Object / Array
                        ▼
┌──────────────────────────────────────────────┐
│ 2. PARSER STAGE (*-parser.ts)                │
│ • Maps wire attributes to domain keys        │
│ • Normalizes dates, booleans, and nulls       │
│ • Enforces fallback invariants               │
│ • Validates against data-schemas             │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
          Strongly-Typed Domain Model
      (e.g. ModelConfigRecord, FormConfigRecord)

────────────────────────────────────────────────

               OUTBOUND (Save / Commit)
              Client State (React Forms)
                        │
                        ▼
┌──────────────────────────────────────────────┐
│ 3. SANITIZER STAGE (sanitize*Record)         │
│ • Strips client-only IDs (f_..., tab_...)    │
│ • Omits default falsy flags & empty overrides│
│ • Compresses sparse JSON for wire efficiency │
│ • Validates against target wire schemas      │
└───────────────────────┬──────────────────────┘
                        │
                        ▼
            Wire-Clean Persistence JSON
                 (to /api/proxy)
```

---

## 🚀 How to Use

### 1. Decoding Low-Level Protobuf Structs (server only, once per response)

`decodeProtobufValue` runs in exactly two places: the BFF proxy (`/api/proxy`, every core
response, INQ rows also go through `parseInquiryRecords` there) and `parseAuthWirePayload`
(login). Responses reach the browser already decoded, so client-side parsers never decode again.
Re-decoding is not idempotent: a genuine record attribute named `fields` would be flattened.

```typescript
import { decodeProtobufValue, unwrapRecordsPayload } from "@/lib/data-parsers";

// Server: converts { string_value: "Janata Bank" } -> "Janata Bank"
const cleanData = decodeProtobufValue(rawProtobufObject);

// Anywhere: extracts items from data.records, data.list, or a direct array of decoded data
const items = unwrapRecordsPayload<RawRecord>(cleanData);
```

---

### 2. Inbound Wire Parsing

Used across BFF route handlers and query hooks:

```typescript
import { parseGfcResponse, parseInquiryConfig, parseMNU } from "@/lib/data-parsers";

// Combined GFC Form & Model Response:
const gfcResult = parseGfcResponse(rawResponse);
if (gfcResult.success) {
  console.log("Model:", gfcResult.data.model.TABLENAME);
  console.log("Form:", gfcResult.data.form?.title);
}

// Sidebar Navigation Tree ('GUM'):
const menuResult = parseMNU(rawMenuResponse);
if (menuResult.success) {
  console.log("Menu Items:", menuResult.data.length);
}
```

---

### 3. Outbound Record Sanitization (Pre-Commit)

Used in feature mutation hooks before sending updates to `/api/proxy`. Every
`sanitize*Record` is total — `(record: T) => T` — so callers never need `sanitize(x) || x`:

```typescript
import {
  sanitizeFormConfigRecord,
  sanitizeModelConfigRecord,
  sanitizeInquiryConfigRecord,
} from "@/lib/data-parsers";

// Prepare sparse, clean JSON for persistence:
const wireReadyForm = sanitizeFormConfigRecord(dirtyFormState);
const wireReadyModel = sanitizeModelConfigRecord(dirtyModelState);
```

---

## 🛡️ Edge Cases Handled

1. **Protobuf Value Polymorphism:**
   Seamlessly extracts primitives whether represented as direct JSON types or protobuf envelope objects (`{ string_value: "..." }`).
2. **Missing Wire Fields & Safe Defaults:**
   Extracts database attributes safely without throwing `TypeError: Cannot read properties of undefined`.
3. **Circular Reference & Array Recursion Safety:**
   `decodeProtobufValue` handles deeply nested lists and sub-structs recursively.
4. **Sparse Persistence Serialization:**
   Sanitizers ensure that client-generated identifiers (such as temporary React IDs) and default values are never written to the core banking ledger tables.

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Decoder Engine (`protobuf-decoder.ts`): **SEALED**

Protobuf `Value`, `ListValue`, and `Struct` unwrapping mechanics are complete and finalized.

### 2. Domain Parsers & Sanitizers: **SCALABLE**

When creating a new domain schema (e.g. `loan-schema.ts`), pair it with a parser and sanitizer:

1. Create `src/lib/data-parsers/loan-parser.ts`.
2. Use `unwrapRecordsPayload` on the (already decoded) payload — never `decodeProtobufValue`.
3. Implement `parseLoanRecord` and `sanitizeLoanRecord`.
4. Export from `index.ts`.

**When to split a domain file.** Keep one `<domain>-parser.ts` (inbound parse + outbound
sanitizer together) by default. Split into `<domain>-parser.ts` (inbound) and
`<domain>-serializer.ts` (outbound `sanitize*`) only when either holds:

- the file exceeds the helper size budget (250 lines; 280 stretch), or
- its parts run in different places (e.g. `inquiry-rows-parser.ts` runs only in the BFF proxy).

Form and inquiry are split; auth, model and menu stay single-file because they are small.
Callers always import from the `@/lib/data-parsers` barrel, so a split never touches them.

---

## 🧪 Verification

Run the verification suite confirming wire parsers and mock fixtures:

```bash
pnpm verify:all
```

# 🔄 CBS Wire Data Parsers (`@/lib/data-parsers`)

The centralized data translation and wire-decoding library for the **Janata Core Banking Workbench**.

It transforms raw, low-level Google Protobuf wire structs (`string_value`, `struct_value`, `list_value`, nested fields) into clean, strongly typed domain records validated against `data-schemas`.

---

## 📦 What It Contains

```text
src/lib/data-parsers/
├── protobuf-decoder.ts       # Low-level Protobuf wire normalizer & response envelope unwrapper
├── auth-parser.ts            # Parses login/auth responses into typed CurrentUser models
├── branch-parser.ts          # Parses branch wire records into BranchRecord[]
├── control-parser.ts         # Parses system control catalog payloads into SystemCommandItem[]
├── form-parser.ts            # Parses raw GMC dynamic form specifications into FormSchema
├── inquiry-parser.ts         # Parses dynamic inquiry/enquiry query results and column metadata
├── menu-parser.ts            # Parses hierarchical navigation menus into MenuItem[]
├── menu-catalog-parser.ts    # Parses flat menu definitions (SC.MENU)
├── menu-designer-parser.ts   # Parses visual menu designer hierarchy trees (SC.MENU.TREE)
├── model-config-parser.ts    # Parses model config & schema builder payloads
├── user-group-parser.ts      # Parses RBAC user groups and permission matrix structures
└── index.ts                  # Public barrel export
```

---

## ⚙️ The 2-Stage Parsing Pipeline

Every wire payload flows through two distinct, decoupled stages:

```text
Raw gRPC / REST Wire Response
            │
            ▼
┌───────────────────────────────────────┐
│ 1. DECODER STAGE (protobuf-decoder.ts)│
│ • Unwraps Protobuf primitives:        │
│   string_value, number_value,         │
│   bool_value, null_value              │
│ • Recursively normalizes:             │
│   list_value -> Array                 │
│   struct_value -> Object              │
│   fields -> Dictionary                │
│ • Unwraps response envelopes          │
│   (data.records, data.list)           │
└──────────────────┬────────────────────┘
                   │ Plain JavaScript Object / Array
                   ▼
┌───────────────────────────────────────┐
│ 2. PARSER STAGE (*-parser.ts)         │
│ • Maps wire attributes to domain keys │
│ • Normalizes dates, booleans, and nulls│
│ • Enforces fallback invariants        │
│ • Validates against data-schemas      │
└──────────────────┬────────────────────┘
                   │
                   ▼
    Strongly-Typed Domain Model
    (e.g. BranchRecord[], FormSchema, CurrentUser)
```

---

## 🚀 How to Use

### 1. Decoding Low-Level Protobuf Structs

If interacting with raw gRPC responses:

```typescript
import { decodeProtobufValue, unwrapRecordsPayload } from "@/lib/data-parsers";

// Converts { string_value: "Janata Bank" } -> "Janata Bank"
const cleanData = decodeProtobufValue(rawProtobufObject);

// Extracts items from data.records, data.list, or direct array:
const items = unwrapRecordsPayload<RawRecord>(rawResponse);
```

---

### 2. Parsing Domain Records

Used inside domain services (`src/lib/infra-services/`):

```typescript
import { parseBranchesWirePayload, parseGMC } from "@/lib/data-parsers";

// Branch Directory:
const branches = parseBranchesWirePayload(rawWireResponse);
console.log(branches[0].branchTitle, branches[0].bbCode);

// Dynamic GMC Form:
const formResult = parseGMC(rawGmcWireData, "ACCOUNT");
if (formResult.success) {
  console.log("Form tabs:", formResult.data.tabs.length);
}
```

---

## 🛡️ Edge Cases Handled

1. **Protobuf Value Polymorphism:**
   Seamlessly extracts primitives whether represented as direct JSON types or protobuf envelope objects (`{ string_value: "..." }`).
2. **Missing Wire Fields & Safe Defaults:**
   Extracts database attributes safely without throwing `TypeError: Cannot read properties of undefined`.
3. **Circular Reference & Array Recursion Safety:**
   `decodeProtobufValue` handles deeply nested lists and sub-structs recursively.

---

## 🔒 Architectural State: Scalable or Sealed?

### 1. Decoder Engine (`protobuf-decoder.ts`): **SEALED**

Protobuf `Value`, `ListValue`, and `Struct` unwrapping mechanics are complete and finalized.

### 2. Domain Parsers: **SCALABLE**

When creating a new domain schema (e.g. `loan-schema.ts`), pair it with a parser:
1. Create `src/lib/data-parsers/loan-parser.ts`.
2. Use `unwrapRecordsPayload` or `decodeProtobufValue`.
3. Map and return the typed domain model.
4. Export from `index.ts`.

---

## 🧪 Verification

Run the full verification suite confirming wire parsers and mock fixtures:
```bash
pnpm verify:all
```

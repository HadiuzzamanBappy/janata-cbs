# 🏛️ CBS Mock Database (`mock/db`)

In-memory persistence layer simulating Core Banking System storage when running offline (`DATA_SOURCE="static"` or `MOCK_CBS="true"`).

---

## 🗄️ 1. Storage Buckets (`LIVE`, `INAU`, `HIS`, `DEL`)

Every table implements `CbsVersionedTable<T>` (defined in `types.ts`) partitioned into 4 lifecycle rooms:
- **`LIVE`**: Active production records with authorized status (`recStatus: "AU"`).
- **`INAU`**: Input Unauthorized drafts awaiting checker authorization (`recStatus: "INA"`).
- **`HIS`**: Historical audit trail (array `T[]` of past modified versions).
- **`DEL`**: Soft-deleted or reversed records (`recStatus: "REV"` / `"DEL"`).

---

## 📋 2. Canonical Table Catalog

| Model / Control Key (`SC_MODEL_CONFIG`) | Physical Table (`PREFIX_TABLENAME`) | File                   | Key Format & Example                                 |
| :-------------------------------------- | :---------------------------------- | :--------------------- | :--------------------------------------------------- |
| **`ACCOUNT`**                           | `AC_ACCOUNT`                        | `AC_ACCOUNT.ts`        | Entity ID: `"AC1001"`                                |
| **`BRANCH`**                            | `SC_BRANCH`                         | `SC_BRANCH.ts`         | Branch Code: `"JB0001"`                              |
| **`CONTROL`**                           | `SC_CONTROL`                        | `SC_CONTROL.ts`        | Command Name: `"ACCOUNT"`                            |
| **`CUSTOMER`**                          | `CUST_CUSTOMER`                     | `CUST_CUSTOMER.ts`     | Customer ID: `"CUST1001"`                            |
| **`CONFIG.FORM`**                       | `SC_FORM_CONFIG`                    | `SC_FORM_CONFIG.ts`    | Composite: `"<MODEL>,<VERSION>"` (`"ACCOUNT,1.0.0"`) |
| **`INQUIRY.CONFIG`**                    | `SC_INQUIRY_CONFIG`                 | `SC_INQUIRY_CONFIG.ts` | Inquiry Verb: `"GET.ACCOUNT"`                        |
| **`MENU.TREE`**                         | `SC_MENU_TREE`                      | `SC_MENU_TREE.ts`      | Menu ID: `"MENU.MAIN"`                               |
| **`MODEL.CONFIG`**                      | `SC_MODEL_CONFIG`                   | `SC_MODEL_CONFIG.ts`   | Model Identifier: `"ACCOUNT"`, `"CONFIG.FORM"`       |
| **`USER`**                              | `SC_USER`                           | `SC_USER.ts`           | Sign-on ID: `"ZZ028459"`                             |

> [!IMPORTANT]
> **Form Layout Control Name**: The canonical model key is **`CONFIG.FORM`** (matching `CbsControlTable.FORM_CONFIG`). Physical storage is **`SC_FORM_CONFIG`**. Do not query with inverted names like `FORM.CONFIG`.

---

## 🗃️ 3. Registry & Dynamic Resolution

Tables are physically registered in `CBS_PHYSICAL_TABLES` (in `index.ts`) by `PREFIX_TABLENAME`.

Lookups through `getVersionedTable(controlName)` and the `CBS_DATABASE` proxy resolve dynamically:
1. **Physical Match**: Checks `CBS_PHYSICAL_TABLES` (e.g. `"SC_FORM_CONFIG"`).
2. **Model Match**: Resolves via `SC_MODEL_CONFIG[controlName]` using its `PREFIX` + `TABLENAME` (e.g. `"CONFIG.FORM"` -> `SC_FORM_CONFIG`).
3. **No Guessing**: Unregistered tables return `null`.

---

## 🔍 4. Querying (`queryCbsDatabase`)

IDs are clean bare strings without associate suffixes. Version defaults to `"LIVE"`.

```typescript
import { queryCbsDatabase } from "@mock/db";

// Standard Entity (LIVE)
const account = queryCbsDatabase("ACCOUNT", "AC1001");

// Form Spec with Composite Key (LIVE)
const formLayout = queryCbsDatabase("CONFIG.FORM", "ACCOUNT,1.0.0");

// Maker's Pending Draft (INAU)
const draft = queryCbsDatabase("ACCOUNT", "AC1001", "INAU");

// Historical Audit Snapshots (HIS -> returns array T[])
const history = queryCbsDatabase("ACCOUNT", "AC1001", "HIS");
```

---

## ⚙️ 5. Maker-Checker Lifecycle Guide

When processing mutations in `mutation-handlers.ts`:
- **Maker Saves (`PUT` / `SMC` / `SFC`)**: Writes to `table.INAU[recordId]` with `recStatus: "INA"`. `table.LIVE` remains untouched.
- **Checker Authorizes (`AUT` / `AMC`)**: Moves snapshot from `table.INAU` to `table.LIVE[recordId]` with `recStatus: "AU"`. If a previous live version existed, appends it to `table.HIS[recordId]` and increments `recCurrNumber`.
- **Officer Reverses (`REV` / `DEL` / `TRV`)**: Moves live record to `table.DEL[recordId]` with `recStatus: "REV"` and appends previous snapshot to `table.HIS`.

_Note: Operator identities (`recInputter`, `recAuthorizer`) are resolved from session data / payload data, defaulting safely to `"MAKER"` or `"CHECKER"`._

---

## ➕ 6. How to Add a New Table (3 Steps)

1. **Create table file** `mock/db/<PREFIX>_<TABLENAME>.ts` exporting `<PREFIX>_<TABLENAME>_TABLE: CbsVersionedTable<T>`.
2. **Register in physical catalog** `mock/db/index.ts`: add to `CBS_PHYSICAL_TABLES`.
3. **Add model spec** in `mock/db/SC_MODEL_CONFIG.ts` with matching `PREFIX` and `TABLENAME`.

_Zero custom router logic required—the system auto-discovers and resolves it._

---

## 📁 7. Directory Map & Invariants

```text
mock/db/
├── AC_ACCOUNT.ts        # Accounts
├── CUST_CUSTOMER.ts     # Customers
├── SC_BRANCH.ts         # Branch master
├── SC_CONTROL.ts        # Command catalog
├── SC_FORM_CONFIG.ts    # Form layout specs (CONFIG.FORM)
├── SC_INQUIRY_CONFIG.ts # Inquiry specs (INQUIRY.CONFIG)
├── SC_MENU_TREE.ts      # Menu hierarchy
├── SC_MODEL_CONFIG.ts   # System metamodel (MODEL.CONFIG)
├── SC_USER.ts           # Users & auth fixtures
├── raw/                 # Reference seed dumps (offline reference; runtime uses TS tables)
├── types.ts             # CbsVersionedTable & lookup contracts
└── index.ts             # CBS_PHYSICAL_TABLES, CBS_DATABASE proxy & queryCbsDatabase
```

- **Invariant 1**: `src/` never imports from `@mock/db` (boundary enforced via `@/lib/infra-grpc` / mock core).
- **Invariant 2**: Table resolution is strictly payload & `SC_MODEL_CONFIG` driven (zero hardcoded fuzzy fallbacks).
- **Invariant 3**: Pure identifiers only (`AC1001`), never suffix with `_INAU` or `$NAU`.

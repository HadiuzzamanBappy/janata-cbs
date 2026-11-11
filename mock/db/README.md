# 🏛️ CBS Mock Database (`@mock/db`)

In-memory persistence layer simulating Core Banking System storage when running offline (`DATA_SOURCE="static"` or `MOCK_CBS="true"`).

---

## 🔎 How `@mock/db` Fits in the System

- **Server-Side Simulator Fixtures**: `@mock/db` provides static in-memory tables containing seed records for offline testing and development.
- **Access Boundary**:
  - Client components and `@/lib/cbs-client` **never** touch `@mock/db`.
  - At runtime, `@mock/db` is accessed strictly by `@mock/core` (via `database-router.ts` and domain handlers in `mock/core/handlers/`).
  - `@mock/core` in turn is invoked by server-side infra (`src/lib/infra-grpc/dispatch.ts` and `src/lib/infra-grpc/client.ts`) when in static mode.
  - Strict layer boundary: Zero runtime or type imports from `@mock/db` exist anywhere in `src/lib/`.

---

## 🗄️ 1. Storage Buckets (`LIVE`, `INAU`, `HIS`, `DEL`)

Every table implements `CbsVersionedTable<T>` (defined in `types.ts`) partitioned into 4 lifecycle rooms:

- **`LIVE`**: Active production records with authorized status (`recStatus: "AU"`).
- **`INAU`**: Input Unauthorized drafts awaiting checker authorization (`recStatus: "INA"`).
- **`HIS`**: Historical audit trail (array `T[]` of past modified versions).
- **`DEL`**: Soft-deleted or reversed records (`recStatus: "REV"` / `"DEL"`).

```typescript
export interface CbsVersionedTable<T = Record<string, unknown>> {
  LIVE: Record<string, T>;
  INAU: Record<string, T>;
  HIS: Record<string, T[]>;
  DEL: Record<string, T>;
}
```

---

## 📋 2. Canonical Table Catalog

All physical tables follow the standard banking convention: `PREFIX_TABLENAME`.

| Physical Table (`CBS_PHYSICAL_TABLES`) | Model Key (`SC_MODEL_CONFIG`) | File                   | Key Format & Example                                 | Description                                                       |
| :------------------------------------- | :---------------------------- | :--------------------- | :--------------------------------------------------- | :---------------------------------------------------------------- |
| **`AC_ACCOUNT`**                       | `ACCOUNT`                     | `AC_ACCOUNT.ts`        | Entity ID: `"AC1001"`                                | Customer deposit and savings accounts                             |
| **`CUST_CUSTOMER`**                    | `CUSTOMER`                    | `CUST_CUSTOMER.ts`     | Customer ID: `"CUST1001"`                            | Customer CIF information                                          |
| **`SC_BRANCH`**                        | `BRANCH`                      | `SC_BRANCH.ts`         | Branch Code: `"JB0001"`                              | Branch master records                                             |
| **`SC_CONTROL`**                       | `CONTROL`                     | `SC_CONTROL.ts`        | Command Name: `"ACCOUNT"`                            | Terminal command and control specifications                       |
| **`SC_FORM_CONFIG`**                   | `CONFIG.FORM`                 | `SC_FORM_CONFIG.ts`    | Composite: `"<MODEL>,<VERSION>"` (`"ACCOUNT,1.0.0"`) | Form schema and presentation layout configs                       |
| **`SC_INQUIRY_CONFIG`**                | `INQUIRY`                     | `SC_INQUIRY_CONFIG.ts` | Inquiry Verb: `"GET.ACCOUNT"`                        | Dynamic inquiry definitions and columns                           |
| **`SC_LOOKUP`**                        | `LOOKUP`                      | `SC_LOOKUP.ts`         | Lookup ID: `"TITLE"`, `"SECTOR"`                     | System dropdown & code tables                                     |
| **`SC_MENU`**                          | `MENU`                        | `SC_MENU.ts`           | Menu ID: `"M1"`, `"M2"`                              | Individual menu items and action links                            |
| **`SC_MENU_TREE`**                     | `MENU.TREE`                   | `SC_MENU_TREE.ts`      | Root Key: `"MENU.ONE"`                               | Top-level tree hierarchy for navigation                           |
| **`SC_MODEL_CONFIG`**                  | `MODEL.CONFIG`                | `SC_MODEL_CONFIG.ts`   | Model ID: `"ACCOUNT"`, `"CONFIG.FORM"`               | System metamodel definitions (field properties, prefixes, tables) |
| **`SC_USER`**                          | `USER`                        | `SC_USER.ts`           | Sign-on ID: `"ZZ028459"`                             | User master records, credentials, RIDASHL rights                  |
| **`UM_USERS`**                         | `UM.USERS`                    | `UM_USERS.ts`          | User ID: `"USR001"`                                  | User management records                                           |
| **`UM_USER_MGT`**                      | `UM.USER.MGT`                 | `UM_USER_MGT.ts`       | Task ID: `"UM1001"`                                  | User administration tasks & roles                                 |
| **`UM_PASSWORD_RESET`**                | `UM.PASSWORD.RESET`           | `UM_PASSWORD_RESET.ts` | Reset ID: `"PR1001"`                                 | Password reset request records                                    |

> [!IMPORTANT]
> **Form Layout Canonical Name**: The canonical model key is **`CONFIG.FORM`** (matching `CbsControlTable.FORM_CONFIG`). Physical storage is **`SC_FORM_CONFIG`**.

---

## 🗃️ 3. Registry & Resolution (`index.ts`)

Tables are registered in `CBS_PHYSICAL_TABLES` (in `index.ts`) by `PREFIX_TABLENAME`.

Resolution occurs dynamically via `getVersionedTable(controlName)` or the `CBS_DATABASE` Proxy:

1. **Direct Physical Match**: Checks `CBS_PHYSICAL_TABLES` directly (e.g. `"SC_FORM_CONFIG"`).
2. **Model Metadata Match**: Looks up `SC_MODEL_CONFIG[controlName]` to find the declared `PREFIX` and `TABLENAME` (e.g. `"CONFIG.FORM"` resolves to `SC_FORM_CONFIG`).
3. **Normalized Key Matching**: Normalizes dots (`.`) to underscores (`_`) if needed (e.g. `UM.USERS` -> `UM_USERS`).
4. **No Guessing**: Unregistered tables return `null`.

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

When processing mutations in `mock/core/handlers/mutation-handlers.ts`:

- **Maker Saves (`PUT` / `SMC` / `SFC` / `SMR`)**: Writes to `table.INAU[recordId]` with `recStatus: "INA"`. `table.LIVE` remains untouched.
- **Checker Authorizes (`AUT` / `AMC`)**: Moves snapshot from `table.INAU` to `table.LIVE[recordId]` with `recStatus: "AU"`. If a previous live version existed, appends it to `table.HIS[recordId]` and increments `recCurrNumber`.
- **Officer Reverses (`REV` / `DEL` / `TRV`)**: Moves live record to `table.DEL[recordId]` with `recStatus: "REV"` and appends previous snapshot to `table.HIS`.

---

## ➕ 6. How to Add a New Table (3 Steps)

1. **Create table file** `mock/db/<PREFIX>_<TABLENAME>.ts` exporting `<PREFIX>_<TABLENAME>_TABLE: CbsVersionedTable<T>`.
2. **Register in physical catalog** `mock/db/index.ts`: export and add to `CBS_PHYSICAL_TABLES`.
3. **Add model spec** in `mock/db/SC_MODEL_CONFIG.ts` with matching `PREFIX` and `TABLENAME`.

---

## 📁 7. Directory Map & Invariants

```text
mock/db/
├── AC_ACCOUNT.ts           # Accounts
├── CUST_CUSTOMER.ts        # Customers
├── SC_BRANCH.ts            # Branch master
├── SC_CONTROL.ts           # Command catalog
├── SC_FORM_CONFIG.ts       # Form layout specs (CONFIG.FORM)
├── SC_INQUIRY_CONFIG.ts    # Inquiry specs (INQUIRY)
├── SC_LOOKUP.ts            # System dropdown lookups
├── SC_MENU.ts              # Menu item records
├── SC_MENU_TREE.ts         # Menu hierarchy (MENU.TREE)
├── SC_MODEL_CONFIG.ts      # System metamodel (MODEL.CONFIG)
├── SC_USER.ts              # Users & auth fixtures
├── UM_PASSWORD_RESET.ts    # Password reset requests
├── UM_USER_MGT.ts          # User management operations
├── UM_USERS.ts             # User profiles
├── rawResponse/            # Real-world server response samples for reference
├── types.ts                # CbsVersionedTable & lookup contracts
└── index.ts                # CBS_PHYSICAL_TABLES, CBS_DATABASE proxy & queryCbsDatabase
```

- **Invariant 1**: Client UI code never imports from `@mock/db` (runtime access is through `@mock/core` on the server).
- **Invariant 2**: Pure identifiers only (`AC1001`), never suffix keys with `_INAU` or `$NAU`.
- **Invariant 3**: Table resolution is strictly payload & `SC_MODEL_CONFIG` driven (zero hardcoded fuzzy fallbacks).

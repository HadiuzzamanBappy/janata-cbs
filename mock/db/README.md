# 🏛️ Core Banking System (CBS) Mock Database (`mock/db`)

This directory houses the **in-memory database tier** simulating the Core Banking System persistence layer when running in offline mode (`DATA_SOURCE="static"`).

The architecture is inspired by **Temenos Transact (T24)**, enforcing the **Four-Eye Maker-Checker lifecycle**, immutable audit snapshots, and normalized metamodel configurations.

---

## 📑 Table of Contents

1. [Architecture & The 4 Storage Buckets](#-1-architecture--the-4-storage-buckets)
2. [Canonical Table Catalog](#-2-canonical-table-catalog)
3. [Universal Database Registry (`CBS_DATABASE`)](#-3-universal-database-registry-cbs_database)
4. [Querying the Database](#-4-querying-the-database)
5. [Audit Metadata Contract (`auditData`)](#-5-audit-metadata-contract-auditdata)
6. [Lifecycle Mutation Guide for `mock/core`](#-6-lifecycle-mutation-guide-for-mockcore)
7. [Directory Map](#-7-directory-map)
8. [Architectural Invariants](#-8-architectural-invariants)

---

## 🗄️ 1. Architecture & The 4 Storage Buckets

In a Core Banking System, live financial and customer records are **never overwritten in place**.
Every table is physically partitioned into **4 lifecycle storage rooms**:

```
                              CbsVersionedTable<T>
                                       │
        ┌──────────────────┬───────────┴──────────┬──────────────────┐
        ▼                  ▼                      ▼                  ▼
    [ LIVE ]           [ INAU ]                [ HIS ]            [ DEL ]
  Authorized         Maker's Draft           Audit Trail         Reversed /
  Production        Awaiting Checker       Past Snapshots         Deleted
  (AU status)        (INA status)          (Array: T[])         (DEL status)
```

### Bucket Definitions (`mock/db/types.ts`)

| Bucket     | Type                  | Banking Meaning                                                                                                          |
| :--------- | :-------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| **`LIVE`** | `Record<string, T>`   | **Active Production.** Official authorized records with `recStatus: "AU"`. Accessible for read transactions and reports. |
| **`INAU`** | `Record<string, T>`   | **Input Unauthorized.** Pending draft saved by a Maker (`PUT` / `SMC`). Awaiting Supervisor authorization (`AUT`).       |
| **`HIS`**  | `Record<string, T[]>` | **Historical Audit.** Immutable chronologically appended snapshots of previous modifications.                            |
| **`DEL`**  | `Record<string, T>`   | **Reversed / Tombstone.** Records deleted or reversed (`REV`). Preserved for compliance.                                 |

```typescript
export type CbsTableVersion = "LIVE" | "INAU" | "HIS" | "DEL";

export interface CbsVersionedTable<T = Record<string, unknown>> {
  LIVE: Record<string, T>;
  INAU: Record<string, T>;
  HIS: Record<string, T[]>;
  DEL: Record<string, T>;
}
```

---

## 📋 2. Canonical Table Catalog

The database contains **9 production-grade canonical tables**:

| Model Name           | Physical Table Name | File                                                                                        | Description                               | Record Key Example |
| :------------------- | :------------------ | :------------------------------------------------------------------------------------------ | :---------------------------------------- | :----------------- |
| **`ACCOUNT`**        | `AC_ACCOUNT`        | [`AC_ACCOUNT.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/AC_ACCOUNT.ts)               | Retail & Corporate Banking Accounts       | `"AC1001"`         |
| **`BRANCH`**         | `SC_BRANCH`         | [`SC_BRANCH.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/SC_BRANCH.ts)                 | Branch Network & Routing Master           | `"JB0001"`         |
| **`CONTROL`**        | `SC_CONTROL`        | [`SC_CONTROL.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/SC_CONTROL.ts)               | Screen & Application Command Catalog      | `"ACCOUNT"`        |
| **`CUSTOMER`**       | `CUST_CUSTOMER`     | [`CUST_CUSTOMER.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/CUST_CUSTOMER.ts)         | Universal Customer Master & KYC           | `"CUST1001"`       |
| **`FORM.CONFIG`**    | `SC_FORM_CONFIG`    | [`SC_FORM_CONFIG.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/SC_FORM_CONFIG.ts)       | Form Presentation Layouts (Tabs/Sections) | `"ACCOUNT,1.0.0"`  |
| **`INQUIRY.CONFIG`** | `SC_INQUIRY_CONFIG` | [`SC_INQUIRY_CONFIG.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/SC_INQUIRY_CONFIG.ts) | Tabular Inquiry Specs (Columns/Filters)   | `"GET.ACCOUNT"`    |
| **`MENU.TREE`**      | `SC_MENU_TREE`      | [`SC_MENU_TREE.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/SC_MENU_TREE.ts)           | Primary Navigation Tree Hierarchy         | `"MENU.MAIN"`      |
| **`MODEL.CONFIG`**   | `SC_MODEL_CONFIG`   | [`SC_MODEL_CONFIG.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/SC_MODEL_CONFIG.ts)     | System Metamodel & Field Data Dictionary  | `"ACCOUNT"`        |
| **`USER`**           | `SC_USER`           | [`SC_USER.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/SC_USER.ts)                     | Operator Profiles, Passwords & Access     | `"ZZ028459"`       |

Each table file exports:
1. Canonical live dictionary (e.g. `export const AC_ACCOUNT: Record<string, AccountRecord> = { ... }`)
2. Associates: `AC_ACCOUNT_INAU`, `AC_ACCOUNT_HIS`, `AC_ACCOUNT_DEL`
3. Bundled versioned table: `export const AC_ACCOUNT_TABLE: CbsVersionedTable<AccountRecord>`

---

## 🗃️ 3. Universal Database Registry (`CBS_DATABASE`)

Exported from [`mock/db/index.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/db/index.ts).
Keyed **strictly by Canonical Model / Control Name** matching `SC_MODEL_CONFIG`:

```typescript
export const CBS_DATABASE = {
  ACCOUNT: AC_ACCOUNT_TABLE,
  BRANCH: SC_BRANCH_TABLE,
  CONTROL: SC_CONTROL_TABLE,
  CUSTOMER: CUST_CUSTOMER_TABLE,
  "FORM.CONFIG": SC_FORM_CONFIG_TABLE,
  "INQUIRY.CONFIG": SC_INQUIRY_CONFIG_TABLE,
  "MENU.TREE": SC_MENU_TREE_TABLE,
  "MODEL.CONFIG": SC_MODEL_CONFIG_TABLE,
  USER: SC_USER_TABLE,
} as const;
```

---

## 🔍 4. Querying the Database

Following the **Temenos pattern**, record IDs are **always clean bare strings** (e.g. `"AC1001"`, never `"AC1001_INAU"` or `"AC1001$NAU"`).

The version is passed as a separate argument (defaulting to `"LIVE"`).

### Option A: Query by Control Name via `queryCbsDatabase()`

```typescript
import { queryCbsDatabase } from "@mock/db";

// 1. Query Active Production Record (LIVE)
const account = queryCbsDatabase("ACCOUNT", "AC1001");

// 2. Query Maker's Pending Draft (INAU)
const draftAccount = queryCbsDatabase("ACCOUNT", "AC1001", "INAU");

// 3. Query Past Audit History Snapshots (HIS - returns Array T[])
const historyList = queryCbsDatabase("ACCOUNT", "AC1001", "HIS");

// 4. Query Reversed or Deleted Record (DEL)
const deletedAccount = queryCbsDatabase("ACCOUNT", "AC1001", "DEL");
```

### Option B: Query a Specific Table directly via `queryVersionedRecord()`

```typescript
import { AC_ACCOUNT_TABLE, queryVersionedRecord } from "@mock/db";

const record = queryVersionedRecord(AC_ACCOUNT_TABLE, "AC1001", "LIVE");
```

---

## 🛡️ 5. Audit Metadata Contract (`auditData`)

All records maintain standard Core Banking audit metadata conformant with `auditDataSchema`:

```typescript
export interface AuditData {
  recStatus: "AU" | "INA" | "HLD" | "DEL" | "REV"; // Current lifecycle status
  recCurrNumber: number; // Edit sequence number (starts at 1)
  recInputter: string; // User ID of maker officer
  recInputTime: string; // YYYY-MM-DD HH:mm:ss timestamp
  recAuthorizer: string; // User ID of supervisor checker
  recAuthTime: string; // YYYY-MM-DD HH:mm:ss timestamp
  recBranchCode: string; // Booking branch code (e.g. "JB9999")
}
```

> [!IMPORTANT]
> **Production Status Invariant**: Every record in the `LIVE` bucket must strictly have `recStatus: "AU"` (Authorized). The CBS Access Control engine (`record-guard.ts`) rejects Hold (`H`) or Delete (`D`) operations on `"AU"` records, allowing only Reverse (`R`).

---

## ⚙️ 6. Lifecycle Mutation Guide for `mock/core`

When implementing or extending mutation handlers in [`mock/core/operation-handlers.ts`](file:///d:/Work/React/cbs/janata-cbs/mock/core/operation-handlers.ts), follow this state machine:

### A. Maker Saves Draft (`PUT` / `SMC`)

1. Create or update record in `table.INAU[recordId]`.
2. Set `auditData.recStatus = "INA"`.
3. Set `auditData.recInputter = payload.userId`.
4. Leave `table.LIVE[recordId]` untouched.

### B. Supervisor Authorizes Draft (`AUT` / `AMC`)

1. Read the draft from `table.INAU[recordId]`.
2. If an existing live record exists in `table.LIVE[recordId]`:
   - Append the current live record into `table.HIS[recordId]` (array).
   - Increment `recCurrNumber = recCurrNumber + 1`.
3. Set `auditData.recStatus = "AU"`.
4. Set `auditData.recAuthorizer = payload.userId`.
5. Write record into `table.LIVE[recordId]`.
6. Delete draft from `table.INAU[recordId]`.

### C. Officer Reverses Record (`REV` / `DEL`)

1. Read live record from `table.LIVE[recordId]`.
2. Append to `table.HIS[recordId]`.
3. Set `auditData.recStatus = "REV"` (or `"DEL"`).
4. Move record into `table.DEL[recordId]`.
5. Remove from `table.LIVE[recordId]`.

---

## 📁 7. Directory Map

```text
mock/db/
├── AC_ACCOUNT.ts          # Core Accounts (AC_ACCOUNT_TABLE)
├── CUST_CUSTOMER.ts       # Customer Master & KYC (CUST_CUSTOMER_TABLE)
├── SC_BRANCH.ts           # Branch Directory & Routing (SC_BRANCH_TABLE)
├── SC_CONTROL.ts          # Command Catalog Master (SC_CONTROL_TABLE)
├── SC_FORM_CONFIG.ts      # Visual Form Layout Configurations (SC_FORM_CONFIG_TABLE)
├── SC_INQUIRY_CONFIG.ts   # Tabular Inquiry Specifications (SC_INQUIRY_CONFIG_TABLE)
├── SC_MENU_TREE.ts        # Primary Navigation Tree (SC_MENU_TREE_TABLE)
├── SC_MODEL_CONFIG.ts     # Data Dictionary & Schema Models (SC_MODEL_CONFIG_TABLE)
├── SC_USER.ts             # Operator Users & Authentication Data (SC_USER_TABLE)
├── types.ts               # Core contracts: CbsTableVersion, CbsVersionedTable, queryVersionedRecord
├── index.ts               # Universal registry CBS_DATABASE & queryCbsDatabase helper
└── README.md              # Architectural manual & developer reference
```

---

## 🔒 8. Architectural Invariants

1. **Zero Mock Imports in `src/`**: Files in `src/` must **never** import directly from `@mock/db` (enforced at boundary layer; only `src/lib/infra-grpc/` communicates with `@mock/core`).
2. **Clean IDs Only**: Record IDs must be pure entity identifiers (`AC1001`, `JB0001`, `ZZ028459`). Never append `_INAU`, `_HIS`, or `$` to ID strings.
3. **No Dead Aliases**: Avoid creating duplicate `*_LIVE` aliases or legacy `SYS_USER*` mirrors.
4. **Normalized Inquiries**: Inquiry column definitions in `SC_INQUIRY_CONFIG` must strictly match the property names of their target table records.

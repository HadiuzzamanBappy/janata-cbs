# 🏛️ CBS Mock Database (`@mock/db`)

The in-memory tables behind [`@mock/core`](../core/README.md) when `DATA_SOURCE=static`. They are named after the real CBS tables (`PREFIX_TABLENAME`) and seeded with sample records. Only `@mock/core` reads them, on the server; nothing in `src/` imports `@mock/db`.

---

## 🗄️ Table shape

Every table is a `CbsVersionedTable<T>` (`types.ts`) with four buckets:

```typescript
export interface CbsVersionedTable<T = Record<string, unknown>> {
  LIVE: Record<string, T>; // authorized records
  INAU: Record<string, T>; // unauthorized (pending) copies
  HIS: Record<string, T[]>; // history
  DEL: Record<string, T>; // deleted / reversed
}
```

Records are keyed by their bare ID (`AC1001`), never with an `_INAU` or `$NAU` suffix. The bucket says which copy it is. (The `*_INAU` names exported by some table files are bucket constants, not record keys.)

---

## 📋 Tables (`CBS_PHYSICAL_TABLES`)

| Physical table      | Model key (`SC_MODEL_CONFIG`) | Example record keys                                           |
| ------------------- | ----------------------------- | ------------------------------------------------------------- |
| `AC_ACCOUNT`        | `ACCOUNT`                     | `AC1001`, `AC1002`                                            |
| `CUST_CUSTOMER`     | `CUSTOMER`                    | `CUST1001`                                                    |
| `FT_FUNDS_TRANSFER` | `FUNDS.TRANSFER`              | `FT260001`                                                    |
| `SC_BRANCH`         | `BRANCH`                      | `JB0001`                                                      |
| `SC_CONTROL`        | `CONTROL`                     | `ACCOUNT`, `BRANCH` (command names)                           |
| `SC_FORM_CONFIG`    | `CONFIG.FORM`                 | `ACCOUNT,1.0.0` (`<MODEL>,<VERSION>`)                         |
| `SC_INQUIRY_CONFIG` | `INQUIRY`                     | `GET.BRANCH`, `GET.EMP.INFO`                                  |
| `SC_LOOKUP`         | `LOOKUP`                      | `TITLE.MR`, `TITLE.MRS`                                       |
| `SC_MENU`           | `MENU`                        | `1`, `2`                                                      |
| `SC_MENU_TREE`      | `MENU.TREE`                   | `MENU.ONE`                                                    |
| `SC_MODEL_CONFIG`   | `MODEL.CONFIG`                | `ACCOUNT`, `CONFIG.FORM`, … (one per model)                   |
| `SC_USER`           | `USER`                        | `ZZ028459`, `CK028459` (sign-on fixtures with RIDASHL rights) |
| `UM_USERS`          | `USERS`                       | `ZZ0284590`                                                   |
| `UM_USER_MGT`       | `USER.MGT`                    | `UM00001`                                                     |
| `UM_PASSWORD_RESET` | `PASSWORD.RESET`              | `PR00001`                                                     |

The form-layout model key is `CONFIG.FORM` (`CbsControlTable.FORM_CONFIG`), stored in `SC_FORM_CONFIG`.

---

## 🔍 Resolution (`getVersionedTable`)

`getVersionedTable(name)` finds a table in this order:

1. A physical name in `CBS_PHYSICAL_TABLES` (`SC_FORM_CONFIG`).
2. A model in `SC_MODEL_CONFIG`, by key, by `TABLENAME`, or by `PREFIX_TABLENAME`. The first `.` may also be read as `_`. The model's `PREFIX` + `TABLENAME` names the physical table (`CONFIG.FORM` → `SC_FORM_CONFIG`).
3. Otherwise `null`: no fuzzy guessing.

A `$` suffix on the name is ignored. `@mock/core` reads tables through `resolveTable()` in `mock/core/database-router.ts`, which wraps this.

---

## ⚙️ What a mutation does

`handleMutation()` in `mock/core/handlers/mutation-handlers.ts` keeps the lifecycle deliberately simple:

| Request type                      | Status written                 |
| --------------------------------- | ------------------------------ |
| `PUT`, `SMC`, `SFC`, `SMR`        | `UA`                           |
| `AUT`, `AMC`, `ATT`, `CTT`, `AFT` | `AU` (and `recCurrNumber` + 1) |
| `HLD`                             | `HLD`                          |
| `DEL`, `DTR`                      | `DEL`                          |
| `REV`, `TRV`                      | `REV`                          |

The updated record is always written to `LIVE` under its ID. On `AU`, any `INAU` copy is removed. `HIS` and `DEL` are never written. So offline, a saved draft shows up in normal reads straight away. History screens show only the seeded history, and the mock doesn't enforce Four-Eyes.

---

## ➕ Adding a table

1. Create `mock/db/<PREFIX>_<TABLENAME>.ts` exporting `<PREFIX>_<TABLENAME>_TABLE: CbsVersionedTable<T>`. Copy `FT_FUNDS_TRANSFER.ts` as a template.
2. Export it from `index.ts` and add it to `CBS_PHYSICAL_TABLES`.
3. Add its model to `SC_MODEL_CONFIG.ts` with the same `PREFIX` and `TABLENAME`.
4. Run `pnpm verify:mock`.

---

## 📁 Other files

- `.rawResponse/`: real core responses kept as reference samples. `pnpm fixture:clean [path]` normalizes one into fixture form (default `grpc/GRL-Branch`).
- `types.ts`: `CbsVersionedTable`, `CbsTableVersion` and the lookup types.
- `index.ts`: `CBS_PHYSICAL_TABLES`, `getVersionedTable`.

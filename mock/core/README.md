# 🧪 CBS Mock Core (`@mock/core`)

An in-memory stand-in for the Java core, used when `DATA_SOURCE=static` (set `CACHE_ENABLED=false` too, for a setup with no dependencies). It answers the same request types the real core does, with the same response envelope, so the app runs with no gRPC, Redis or network. Data comes from the tables in [`@mock/db`](../db/README.md).

It is server-only (`import "server-only"`). The browser never imports it: client code only calls `/api/proxy` and the auth routes.

---

## 🔎 Where it's called

`isStaticMode()` (`src/lib/infra-grpc/client.ts`) returns `true` when `serverConfig.dataSource === "static"`. Then:

| Caller (`src/lib/infra-grpc`)                                 | Goes to                                            |
| ------------------------------------------------------------- | -------------------------------------------------- |
| `dispatch()` in `dispatch.ts` (every `/api/proxy` request)    | `mockDispatch(envelope)`                           |
| `loginProcess()` in `client.ts` (`/api/login`)                | `handleLogin(req)`, checked against `SC_USER`      |
| `financialProcess()` / `nonFinancialProcess()` in `client.ts` | `mockProcess(req)`, which returns a `GrpcResponse` |

`mockDispatch()` and `mockProcess()` both route the request through `getMockProxyResponse()`.

---

## 🎯 Request routing (`getMockProxyResponse`)

Checked in this order by `requestType` (upper-cased):

| Request type                                                                       | Handler                | File                   | Behaviour                                                                                                         |
| ---------------------------------------------------------------------------------- | ---------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `CPW`                                                                              | `handleChangePassword` | `auth-handlers.ts`     | Changes the password in the mock user tables                                                                      |
| `GUM`, `GCM`                                                                       | `handleGetMenu`        | `menu-handlers.ts`     | The menu tree (`SC_MENU_TREE`)                                                                                    |
| `GFC`                                                                              | `handleGetFormConfig`  | `model-handlers.ts`    | A form layout from `SC_FORM_CONFIG`, with its model                                                               |
| `INQ`                                                                              | `handleInquiry`        | `inquiry-handlers.ts`  | Runs the proxy-resolved inquiry: `controlName` is the target table, `queryString` filters its rows                |
| `GNI`                                                                              | `handleNextId`         | `mutation-handlers.ts` | Next record ID (the model's ID rule, or a user-prefixed draft ID)                                                 |
| `SBI`, `RIL`                                                                       | `handleSearchById`     | `query-handlers.ts`    | Matching record IDs only (wildcards allowed)                                                                      |
| `GRL`, `GCQ`, `GMV`, `GGL`                                                         | `handleRecordList`     | `query-handlers.ts`    | Records of a table                                                                                                |
| `GET`, `GRV`, `S`, `SEE`, or record function `S`                                   | `handleSeeRecord`      | `query-handlers.ts`    | One record, live or historical                                                                                    |
| `PUT`, `AUT`, `DEL`, `HLD`, `REV`, `TRV`, `SFC`, `SMR`, `DTR`, `ATT`, `CTT`, `AFT` | `handleMutation`       | `mutation-handlers.ts` | Writes the record with its new status (for example `PUT` → `UA`, `AUT` → `AU`; a save with `authLevel: 0` → `AU`) |
| anything else                                                                      | `notFoundResult`       | `response-factory.ts`  | Not found                                                                                                         |

Login doesn't go through this table: `loginProcess()` calls `handleLogin()` directly.

> [!IMPORTANT]
> Like the core, the mock stamps `recInputter` and `recAuthorizer` from the session user on the envelope, never from the request data. The mock itself doesn't check Four-Eyes: `/api/proxy` does, before the request reaches it, so offline a maker's own `AUT` is refused with 403 as it is against the core.

---

## 📦 Files

```text
mock/core/
├── index.ts               # getMockProxyResponse, mockDispatch, mockProcess (+ re-exported handlers)
├── database-router.ts     # resolveTable(controlName): finds a table by control, model key or PREFIX_TABLENAME
├── response-factory.ts    # successResult, notFoundResult, errorResult, toGrpcResponse
└── handlers/              # auth, inquiry, menu, model, mutation and query handlers (+ index.ts)
```

`resolveTable()` returns an accessor bundle: `LIVE`, `table` (all version buckets), `getList(version?)` and `getIdList(pattern?, version?)`.

---

## ➕ Extending

- **A new table:** see "Adding a table" in [`@mock/db`](../db/README.md). The router finds it automatically.
- **A new request type:** add its handler under `handlers/`, export it from `handlers/index.ts`, and route it in `getMockProxyResponse()`. Add a case to `scripts/verify/verify-mock-core.ts`.

---

## 🧪 Verification

```bash
pnpm verify:mock
```

Its checks include table resolution, login, the menu tree, ID allocation, ID search, single-record reads, the `PUT` → `UA` lifecycle and the full `mockProcess` gRPC envelope.

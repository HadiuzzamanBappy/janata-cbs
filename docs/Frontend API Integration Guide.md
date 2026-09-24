# Frontend API Integration Guide
## FinX Core Banking — Dynamic API

**Document version:** 1.0  
**Based on:** Core Technical Documentation V1.0.1  
**Audience:** Frontend developers  
**Primary client:** Web / Next.js / React  
**Communication:** Frontend → BFF → gRPC Core

---

# 1. What You Need to Understand First

This system does **not** expose one independent REST endpoint for every banking operation.

The frontend communicates with the BFF through HTTP/REST. The BFF then communicates with the Core backend through gRPC.

```text
Frontend
   │
   │ HTTP / HTTPS + JSON
   ▼
BFF
   │
   │ gRPC
   ▼
Core Banking Engine
   │
   ├── Customer
   ├── Account
   ├── Loan
   ├── Deposit
   ├── Transaction
   └── Other Models
```

The documentation explicitly defines the BFF as the central entry point for authentication, authorization and routing, while gRPC is used between backend services.

Therefore, from the frontend developer's perspective:

> **You call the BFF HTTP API. You do not call the Core gRPC service directly.**

---

# 2. The Most Important Concept: Dynamic API

The Core API is designed so that one generic API structure can work with many different models.

For example, the same general request structure can operate on:

```text
CUSTOMER
ACCOUNT
BRANCH
CONTROL
LOAN
DEPOSIT
...
```

The behavior changes according to values such as:

```text
requestType
controlName
recordFunction
recordId
data
```

The documentation describes the Core API as dynamic: a single API mechanism can add, update and delete data for different models by changing request parameters.

So do **not** build your frontend assuming:

```ts
POST /customer
GET /customer
PUT /customer
```

Instead, the frontend should think in terms of:

```text
requestType + controlName + recordFunction + recordId + data
```

---

# 3. Base API Structure

Most Core requests conceptually follow this structure:

```json
{
  "idempotencyKey": "",
  "clientId": "WEB-CLIENT",
  "requestType": "PUT",
  "controlName": "CONTROL",
  "recordFunction": "I",
  "recordId": "SB",
  "branchCode": "JB9999",
  "authLevel": 1,
  "userId": "SYSUSER",
  "data": {}
}
```

Not every operation requires every property.

For example:

```text
Login
    ↓
different request structure

GUM
    ↓
small request

GMC
    ↓
recordId + model information

PUT
    ↓
full transaction/request structure

GCQ
    ↓
queryString + pagination

AFT
    ↓
financial transaction data
```

Therefore, frontend API functions should use **operation-specific request types**, rather than one giant request interface with everything optional.

---

# 4. Common Request Properties

## 4.1 idempotencyKey

```json
"idempotencyKey": "unique-request-id"
```

Used to uniquely identify a request.

The documentation states that a unique key should be generated for every request.

For financial operations, this is especially important because retries must not accidentally create duplicate transactions.

Frontend example:

```ts
const idempotencyKey = crypto.randomUUID();
```

Use a new key for a new logical operation.

Do not generate a new key when retrying the exact same operation if the backend expects idempotency semantics.

---

# 5. clientId

Example:

```json
"clientId": "WEB-CLIENT"
```

Identifies the client/application making the request.

The documentation describes it as a previously generated client ID associated with the user/client.

Keep this in your API configuration rather than scattering it throughout components.

---

# 6. requestType

This is one of the most important fields.

The documented request types include:

| Request Type | Meaning |
|---|---|
| `PUT` | Insert / Update |
| `GET` | Get single record |
| `GMC` | Get model definition |
| `SMC` | Save model definition |
| `SFC` | Save form configuration |
| `AMC` | Authorize model configuration |
| `GRL` | Get list of records |
| `SMR` | Save menu relation |
| `DTR` | Delete tree relation |
| `GCM` | Get child menu |
| `GNI` | Get new record ID |
| `GFC` | Get form control/form-version/model definition |
| `GUM` | Get user menu |
| `RIL` | Get record ID list |
| `GRV` | Get record by view |
| `GGL` | Get generated report list |
| `GCQ` | Get by custom query |
| `DEL` | Delete unauthorized record |
| `AUT` | Authorize record |
| `ATT` | Account transfer transaction |
| `CTT` | Cash transfer transaction |
| `REV` | Reverse record |
| `ULI` | User login |
| `ULO` | User logout |
| `UAU` | Authorize user |
| `CPW` | Change password |
| `TRV` | Reverse from history |

These request types are defined in section 6.4 of the source documentation.

---

# 7. recordFunction

`recordFunction` describes the access/lifecycle operation.

| Value | Meaning | Typical purpose |
|---|---|---|
| `S` | See | Read one record |
| `L` | List | Read a page/list |
| `I` | Insert / Update | Create or update |
| `D` | Delete | Delete unauthorized record |
| `A` | Authorize | Maker-checker authorization |
| `R` | Reverse | Reverse record |

The documented effects are:

```text
S → Read a single record
L → Read a page
I → Lock, then insert/update and archive to history
D → Lock/archive/delete from unauthorized table
A → Approve pending record
R → Reverse/delete and create history
```



---

# 8. controlName

This is the field you need to be particularly careful with.

Example:

```json
"controlName": "CONTROL"
```

or:

```json
"controlName": "MODEL.CONFIG"
```

or:

```json
"controlName": "USER.MGT.BANKID"
```

or:

```json
"controlName": "TODAY.TXN.ENTRY"
```

The documentation says `controlName` can be a model name or blank depending on the operation.

Therefore:

```text
controlName is NOT simply a frontend component name.
```

It participates in determining what Core model/control/view the request operates against.

This is why:

```json
{
  "requestType": "GET",
  "controlName": "CUSTOMER"
}
```

and:

```json
{
  "requestType": "GET",
  "controlName": "ACCOUNT"
}
```

can produce completely different data.

---

# 9. recordId

Used to identify a specific record.

Example:

```json
"recordId": "SB"
```

or:

```json
"recordId": "ACCOUNT001"
```

Some operations do not require a record ID:

```json
"recordId": ""
```

The documentation specifically describes `recordId` as the table record ID required when retrieving a single or multiple record depending on the operation.

---

# 10. branchCode

Example:

```json
"branchCode": "JB9999"
```

This represents the logged-in user's branch.

Frontend normally receives/maintains this as part of the authenticated user/session context.

Do not allow arbitrary components to independently decide the branch code.

Prefer:

```ts
authSession.branchCode
```

rather than:

```tsx
<MyComponent branchCode="JB9999" />
```

---

# 11. authLevel

Example:

```json
"authLevel": 1
```

The documentation describes:

```text
0 → single authorization
1 → double-level authorization
```



This should generally be treated as a business/security value rather than something ordinary UI code invents.

---

# 12. userId

Example:

```json
"userId": "SYSUSER"
```

This represents the logged-in user.

The frontend should obtain it from the authenticated session rather than asking every form to manually provide it.

---

# 13. data

This is the most dynamic part.

```json
"data": {}
```

Its structure depends on the operation and model.

For example:

```json
"data": {
  "description": "Screen Builder",
  "controlName": "SC.SCREEN.BUILDER"
}
```

For a fund transfer:

```json
"data": {
  "txnCode": "120",
  "debitAccount": "0100001420806",
  "creditAccount": "0100038443695",
  "txnAmount": 11,
  "valueDate": "2026-06-08"
}
```

Therefore, **do not create one universal `data` TypeScript interface**.

Use operation/model-specific types.

---

# 14. Login API

## Endpoint

```text
POST {next_base_url}/api/login
```

The documented frontend login request is:

```json
{
  "username": "IA*****",
  "password": "sc*****"
}
```

The frontend-facing login response contains user information.

The backend/core response additionally contains:

```json
{
  "status": "SUCCESS",
  "statusCode": 200,
  "data": {
    "userId": "...",
    "fullName": "...",
    "accessibility": "...",
    "userRole": null,
    "commandLine": true,
    "branchName": "...",
    "branchCode": "...",
    "txnDate": "...",
    "userStatus": 1,
    "authenticated": true,
    "token": "..."
  }
}
```



On failure:

```json
{
  "status": "FAIL",
  "statusCode": 400,
  "message": "Invalid credentials",
  "data": null
}
```

---

# 15. Authentication

Protected requests use:

```http
Authorization: Bearer <token>
```

The documentation specifies JWT/token-based authentication and says subsequent requests send the access token for validation.

Frontend API client:

```ts
async function apiRequest(...) {
  const token = getAccessToken();

  return fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}
```

For production, follow the application's actual token-storage policy rather than automatically putting sensitive tokens into browser local storage.

---

# 16. Generic PUT — Insert / Update

## Purpose

Create or update a model record.

```json
{
  "idempotencyKey": "unique-key",
  "clientId": "WEB-CLIENT",
  "requestType": "PUT",
  "controlName": "CONTROL",
  "recordFunction": "I",
  "recordId": "SB",
  "branchCode": "JB9999",
  "authLevel": 1,
  "userId": "SYSUSER",
  "data": {
    "description": "Screen Builder",
    "controlName": "SC.SCREEN.BUILDER"
  }
}
```

The same general PUT operation can support different models because `controlName` and `data` change.

---

# 17. PUT Combination Model

Think of the request as:

```text
PUT
│
├── controlName
│      ├── CUSTOMER
│      ├── ACCOUNT
│      ├── BRANCH
│      └── CONTROL
│
├── recordFunction
│      └── I
│
├── recordId
│      ├── existing ID → update
│      └── new/appropriate ID → insert
│
└── data
       └── model-specific fields
```

Therefore the frontend needs a model-aware API layer.

---

# 18. Generic GET

The documentation defines GET as a dynamic operation for obtaining model data.

Example:

```json
{
  "clientId": "WEB-CLIENT",
  "requestType": "GET",
  "controlName": "CONTROL",
  "recordFunction": "I",
  "recordId": "SB",
  "branchCode": "JB9999",
  "userId": "SYSUSER"
}
```



The exact response should not be hard-coded globally because the returned data depends on the model/control being queried.

---

# 19. Get Model Configuration — GMC

Use `GMC` when the frontend needs the definition of a model.

Example:

```json
{
  "idempotencyKey": "",
  "clientId": "UI",
  "requestType": "GMC",
  "controlName": "?",
  "recordFunction": "S",
  "recordId": "ACCOUNT",
  "branchCode": "JB0102",
  "userId": "SYSADMIN"
}
```



This is extremely important for dynamic frontend applications.

The model definition tells the frontend things such as:

```text
field name
label
type
length
required
disabled
width
position
parameter
value
datasource
nested properties
sequence
```

The source documentation specifically describes model configuration as the metadata consumed by the frontend to dynamically generate forms, controls, labels, dropdowns, field widths and ordering.

---

# 20. Model Field Types

The documented field types include:

```text
Text
Dropdown
Radio
Date
Object
```



Example Text:

```json
{
  "NAME": "givenNames",
  "LABEL": "Given Names",
  "TYPE": "Text",
  "LENGTH": 50,
  "STRUCTURE": "S",
  "REQUIRED": false
}
```

Example static Dropdown:

```json
{
  "NAME": "title",
  "LABEL": "Title",
  "TYPE": "Dropdown",
  "PARAMETER": {
    "type": "O",
    "data": [
      {
        "itemCode": "MR",
        "itemLabel": "Mr"
      },
      {
        "itemCode": "MRS",
        "itemLabel": "Mrs"
      }
    ]
  }
}
```

Example dynamic Dropdown:

```json
{
  "NAME": "nationality",
  "TYPE": "Dropdown",
  "PARAMETER": {
    "type": "M",
    "modelName": "COUNTRY",
    "displayField": "countryName"
  }
}
```

Radio:

```json
{
  "NAME": "gender",
  "LABEL": "Gender",
  "TYPE": "Radio",
  "PARAMETER": {
    "type": "O",
    "data": [
      {
        "itemCode": "FEMALE",
        "itemLabel": "Female"
      },
      {
        "itemCode": "MALE",
        "itemLabel": "Male"
      }
    ]
  }
}
```

Object:

```json
{
  "NAME": "presentAddress",
  "LABEL": "Present Address",
  "TYPE": "Object",
  "PROP": [
    {
      "NAME": "country",
      "TYPE": "Dropdown"
    },
    {
      "NAME": "division",
      "TYPE": "Dropdown"
    },
    {
      "NAME": "district",
      "TYPE": "Dropdown"
    }
  ]
}
```



---

# 21. Frontend Dynamic Form Architecture

The frontend should therefore work like this:

```text
GMC
 │
 ▼
Model Definition
 │
 ├── PROPERTIES
 │
 ├── field TYPE
 │
 ├── REQUIRED
 │
 ├── DISABLED
 │
 ├── PARAMETER
 │
 ├── DATASOURCE
 │
 └── PROP
 │
 ▼
Form Renderer
 │
 ├── Text → TextInput
 ├── Dropdown → Select
 ├── Radio → RadioGroup
 ├── Date → DatePicker
 └── Object → NestedForm
```

This is much better than:

```tsx
if (model === "CUSTOMER") {
   ...
}

if (model === "ACCOUNT") {
   ...
}
```

The documentation's design specifically intends the model definition to act as a frontend behavior contract.

---

# 22. SFC — Save Form Configuration

Request type:

```text
SFC
```

Example:

```json
{
  "idempotencyKey": "",
  "clientId": "WEB-CLIENT",
  "requestType": "SFC",
  "controlName": "?",
  "recordFunction": "I",
  "recordId": "BRANCH,V1",
  "branchCode": "JB9999",
  "authLevel": 1,
  "userId": "SYSUSER",
  "data": {
    "frmDescription": "Branch form",
    "authNumber": 1,
    "rtnValidate": [],
    "rtnBeforeAuth": [],
    "rtnAfterAuth": [],
    "frmElements": [
      {
        "SN": 1,
        "TYPE": "Text",
        "STRUCTURE": "S",
        "LENGTH": 100,
        "REQUIRED": true,
        "DISABLED": false,
        "WIDTH": 350,
        "POSITION": "1,1",
        "PARAMETER": "",
        "ENRICHTEXT": "",
        "VALUE": "",
        "ISOPEN": false,
        "ISLOADING": false,
        "DATASOURCE": [],
        "NAME": "branchTitle",
        "LABEL": "Branch Title",
        "PROP": []
      }
    ]
  }
}
```



---

# 23. SMC — Save Model Configuration

Request type:

```text
SMC
```

Example:

```json
{
  "idempotencyKey": "",
  "clientId": "WEB-CLIENT",
  "requestType": "SMC",
  "controlName": "?",
  "recordFunction": "I",
  "recordId": "CONTROL",
  "branchCode": "JB9999",
  "authLevel": 1,
  "userId": "SYSUSER",
  "data": {
    "_DEVBY": "MD IMRAN HASAN",
    "_DEVDATE": "2025-09-04",
    "DESCRIPTION": "Command Control",
    "PREFIX": "SC",
    "TABLENAME": "CONTROL",
    "USERDEFINEID": true,
    "ACCESS": "G",
    "READONLY": false,
    "SEARCHABLE": true,
    "ASSOCIATES": ["HIS"],
    "AUTHORIZE": false,
    "SERVICEPATH": "default",
    "IDDEF": {
      "IDPREFIX": "",
      "SEQUENCELENGTH": "0",
      "SEQUENCERESET": false,
      "IDPATTERN": ""
    },
    "PROPERTIES": []
  }
}
```

The actual documentation example contains the full `PROPERTIES` definition as well.

---

# 24. GRL — Get List

Request type:

```text
GRL
```

The documented example is:

```json
{
  "clientId": "WEB-CLIENT",
  "requestType": "GET",
  "controlName": "CONTROL",
  "recordFunction": "I",
  "recordId": "SB",
  "branchCode": "JB9999",
  "userId": "SYSUSER"
}
```

The source labels this API as "Get list of record."

Note: the source example uses `requestType: "GET"` even though the API section is titled GRL. Do not silently "correct" this in frontend code without confirming the BFF contract.

---

# 25. GCQ — Custom Query

Request type:

```text
GCQ
```

This is used for custom querying and is documented with a maximum of 2000 records.

Example:

```json
{
  "idempotencyKey": "",
  "clientId": "WEB-CLIENT",
  "requestType": "GCQ",
  "controlName": "TODAY.TXN.ENTRY",
  "recordFunction": "S",
  "recordId": "",
  "branchCode": "JB9999",
  "authLevel": 1,
  "userId": "SYSUSER",
  "data": {
    "queryString": [
      {
        "selectFieldName": "recordId",
        "selectFieldType": "text",
        "selectFieldOperator": "CT",
        "selectFieldOperatorFixed": "",
        "selectFieldDisplay": "RecordId",
        "selectFieldValue": "BDT",
        "selectFieldRequired": false,
        "recordId": "BDT"
      }
    ],
    "curPage": 1,
    "perPage": 1000
  }
}
```



Frontend should encapsulate this into a query builder rather than constructing arbitrary query objects inside React components.

---

# 26. RIL — Record ID List

```json
{
  "requestType": "RIL",
  "controlName": "CONTROL",
  "branchCode": "JB9999",
  "userId": "SYSADMIN"
}
```

Purpose:

```text
Get recordId list.
```



---

# 27. GUM — User Menu

```json
{
  "requestType": "GUM",
  "branchCode": "JB9999",
  "userId": "SYSADMIN"
}
```

Purpose:

```text
Get User Menu
```



This can typically feed the application's dynamic navigation structure.

---

# 28. GMV — Materialized View

Request:

```json
{
  "requestType": "GMV",
  "controlName": "USER.MGT.BANKID",
  "branchCode": "JB9999",
  "userId": "SYSADMIN",
  "data": {
    "queryString": ""
  }
}
```

Purpose:

```text
Get from materialized view.
```



---

# 29. RMV — Refresh Materialized View

```json
{
  "requestType": "RMV",
  "controlName": "USER.MGT.BANKID",
  "recordId": "",
  "branchCode": "JB9999",
  "userId": "SYSADMIN"
}
```



---

# 30. SBI — Search By Record ID

```json
{
  "requestType": "SBI",
  "controlName": "MODEL.CONFIG",
  "recordId": "...AC...",
  "branchCode": "JB9999",
  "userId": "SYSADMIN"
}
```

Purpose:

```text
Search by recordId.
```



---

# 31. GGL — Generated Reports

```json
{
  "requestType": "GGL",
  "controlName": "?",
  "branchCode": "JB9999",
  "userId": "SYSADMIN",
  "data": {
    "queryString": ""
  }
}
```

Purpose:

```text
Get generated report list by date.
```



---

# 32. Authorization APIs

## AUT — Authorize Record

```json
{
  "requestType": "AUT",
  "controlName": "CONTROL",
  "recordId": "TEST",
  "recordFunction": "A",
  "branchCode": "JB9999",
  "userId": "SYSADMIN"
}
```

## DEL — Delete Unauthorized Record

```json
{
  "requestType": "DEL",
  "controlName": "CONTROL",
  "recordId": "TEST",
  "recordFunction": "D",
  "branchCode": "JB9999",
  "userId": "SYSADMIN"
}
```

## REV — Reverse Record

```json
{
  "requestType": "REV",
  "controlName": "CONTROL",
  "recordId": "TEST",
  "recordFunction": "R",
  "branchCode": "JB9999",
  "userId": "SYSADMIN"
}
```

These operations are documented as Core lifecycle operations.

---

# 33. UAU — Authorize User

```json
{
  "requestType": "UAU",
  "branchCode": "JB9999",
  "recordId": "SYSADMIN",
  "userId": "SYSADMIN"
}
```

---

# 34. ULO — Logout

```json
{
  "requestType": "ULO",
  "branchCode": "JB9999",
  "userId": "SYSADMIN"
}
```



---

# 35. GRR — Password Reset Record

```json
{
  "requestType": "GRR",
  "controlName": "?",
  "recordId": "SYSADMIN",
  "branchCode": "JB9999",
  "userId": "SYSADMIN"
}
```

The source documents this request type as GRR even though GRR is not included in the earlier request-type table. Treat this as a documented API operation requiring backend confirmation.

---

# 36. AFT — Fund Transfer

This is a **financial operation** and uses `FinancialProcess`, unlike the model/configuration APIs that use `NonFinancialProcess`.

Example:

```json
{
  "idempotencyKey": "laksdlaksd",
  "clientId": "BEFTN",
  "requestType": "AFT",
  "controlName": "?",
  "recordFunction": "I",
  "recordId": "",
  "branchCode": "JB0102",
  "authLevel": 0,
  "userId": "IA0263640",
  "data": {
    "txnCode": "120",
    "debitAccount": "0100001420806",
    "creditAccount": "0100038443695",
    "txnAmount": 11,
    "valueDate": "2026-06-08"
  }
}
```



**Important:** financial APIs must have stronger retry/idempotency handling. The architecture documentation specifically warns that retries for financial transactions must consider idempotency to avoid duplicate transactions.

---

# 37. Response Status Handling

The documented response semantics are:

| Status | Meaning | Frontend behavior |
|---|---|---|
| `SUCCESS 200` | Operation completed | Continue |
| `SUCCESS 201` | New record created | Continue |
| `FAIL 400` | Validation/envelope error | Show/fix request error |
| `FAIL 401` | Authentication failed | Re-authenticate |
| `FAIL 404` | Record not found | Verify ID |
| `FAIL 409` | Duplicate/already posted | Treat as already applied |
| `FAIL 422` | Business rule rejection | Do not retry unchanged |
| `RETRY 503` | Temporary/capacity problem | Retry with backoff |
| `ERROR 500` | Unexpected internal error | Show generic error / escalate |



---

# 38. Standard Response Envelope

Where the Core response uses the documented envelope, expect a structure similar to:

```ts
interface CoreResponse<T> {
  errors: CoreError[];
  status: "SUCCESS" | "FAIL" | "RETRY" | "ERROR";
  statusCode: number;
  idempotencyKey?: string;
  message: string;
  data: T | null;
  timestamp: string;
}
```

Example:

```json
{
  "errors": [],
  "status": "SUCCESS",
  "statusCode": 200,
  "idempotencyKey": "",
  "message": "",
  "data": {},
  "timestamp": "2026-09-02T05:24:34.203471849Z"
}
```

The exact `data` type is **operation/model dependent**.

---

# 39. Do NOT Type Every Response as `any`

Bad:

```ts
const response: any = await api(...);
```

Better:

```ts
interface CoreResponse<T> {
  errors: CoreError[];
  status: CoreStatus;
  statusCode: number;
  idempotencyKey?: string;
  message: string;
  data: T | null;
  timestamp?: string;
}
```

Then:

```ts
type CustomerResponse = CoreResponse<Customer>;

type AccountResponse = CoreResponse<Account>;

type ModelConfigResponse = CoreResponse<ModelConfig>;

type UserMenuResponse = CoreResponse<UserMenu>;
```

This gives you dynamic APIs while maintaining frontend type safety.

---

# 40. Recommended TypeScript Request Architecture

Create a shared base:

```ts
interface CoreRequestBase {
  idempotencyKey?: string;
  clientId?: string;
  requestType: string;
  controlName?: string;
  recordFunction?: "S" | "L" | "I" | "D" | "A" | "R";
  recordId?: string;
  branchCode?: string;
  authLevel?: number;
  userId?: string;
  data?: unknown;
}
```

Then create specialized requests:

```ts
interface PutRequest extends CoreRequestBase {
  requestType: "PUT";
  recordFunction: "I";
  data: Record<string, unknown>;
}

interface GetModelConfigRequest extends CoreRequestBase {
  requestType: "GMC";
  recordFunction: "S";
  recordId: string;
}

interface CustomQueryRequest extends CoreRequestBase {
  requestType: "GCQ";
  recordFunction: "S";
  data: {
    queryString: QueryCondition[];
    curPage: number;
    perPage: number;
  };
}
```

---

# 41. Recommended API Layer

Do not call the Core API directly from every component.

Use:

```text
components/
    CustomerForm.tsx
    AccountForm.tsx

        ↓

features/
    customer/
    account/

        ↓

services/
    core-api/

        ↓

BFF
```

Example:

```ts
coreApi.put(...)
coreApi.get(...)
coreApi.getModelConfig(...)
coreApi.getList(...)
coreApi.customQuery(...)
coreApi.authorize(...)
coreApi.reverse(...)
coreApi.fundTransfer(...)
```

---

# 42. Example API Client

```ts
class CoreApiClient {
  async request<T>(
    payload: CoreRequestBase
  ): Promise<CoreResponse<T>> {
    const token = getAccessToken();

    const response = await fetch("/api/core", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message);
    }

    return result;
  }
}

export const coreApi = new CoreApiClient();
```

The actual BFF route should follow the deployed BFF contract; the source documentation establishes the frontend → BFF pattern but does not define one universal `/api/core` endpoint.

---

# 43. Model API Helper

Instead of:

```ts
fetch(...)
```

everywhere:

```ts
export async function getModelConfig(
  modelName: string
) {
  return coreApi.request<ModelConfig>({
    clientId: "WEB-CLIENT",
    requestType: "GMC",
    controlName: "?",
    recordFunction: "S",
    recordId: modelName,
    branchCode: getSession().branchCode,
    userId: getSession().userId,
  });
}
```

Usage:

```ts
const response = await getModelConfig("CUSTOMER");
```

Then:

```ts
const model = response.data;
```

---

# 44. Dynamic Form Rendering

A recommended renderer:

```tsx
function DynamicField({ field }: { field: ModelField }) {
  switch (field.TYPE) {
    case "Text":
      return <TextField field={field} />;

    case "Dropdown":
      return <DropdownField field={field} />;

    case "Radio":
      return <RadioField field={field} />;

    case "Date":
      return <DateField field={field} />;

    case "Object":
      return <ObjectField field={field} />;

    default:
      return null;
  }
}
```

This follows the metadata-driven architecture documented by the Core system.

---

# 45. Dynamic Dropdown Handling

A dropdown can have different configurations.

### Static

```json
"PARAMETER": {
  "type": "O",
  "data": [
    {
      "itemCode": "MR",
      "itemLabel": "Mr"
    }
  ]
}
```

Frontend:

```text
Use PARAMETER.data directly
```

### Dynamic

```json
"PARAMETER": {
  "type": "M",
  "modelName": "COUNTRY",
  "displayField": "countryName"
}
```

Frontend:

```text
1. Read modelName
2. Fetch model/data
3. Read displayField
4. Render options
```

This distinction is explicitly defined in the model documentation.

---

# 46. Object Field Handling

An Object field is a nested model structure.

Example:

```text
presentAddress
    ├── country
    ├── division
    └── district
```

The renderer should recursively process:

```ts
field.PROP
```

rather than hard-coding:

```tsx
if (field.NAME === "presentAddress") {
   ...
}
```

---

# 47. The Frontend's Decision Algorithm

For every dynamic API operation:

```text
START
  │
  ▼
What requestType?
  │
  ├── GMC ──→ Get model metadata
  │
  ├── SFC ──→ Save form metadata
  │
  ├── SMC ──→ Save model metadata
  │
  ├── GCQ ──→ Build query request
  │
  ├── GUM ──→ Get menu
  │
  ├── PUT ──→ Create/update record
  │
  ├── AUT ──→ Authorize
  │
  ├── REV ──→ Reverse
  │
  └── AFT ──→ Financial transaction

       │
       ▼

Does operation require controlName?
       │
       ▼

Which model/control?
       │
       ▼

Does it require recordId?
       │
       ▼

Does it require recordFunction?
       │
       ▼

Does it require data?
       │
       ▼

Build operation-specific payload
       │
       ▼

Send to BFF
       │
       ▼

Interpret response envelope
       │
       ▼

Interpret data according to operation/model
```

---

# 48. API Combination Matrix

This is the mental model frontend developers should use.

| requestType | controlName | recordId | recordFunction | data | Main purpose |
|---|---|---|---|---|---|
| `PUT` | Usually model/control | Often | `I` | Yes | Insert/update |
| `GET` | Model/control | Often | Varies | Usually no | Get data |
| `GMC` | `?` in example | Model name | `S` | No | Model metadata |
| `SMC` | `?` | Model name | `I` | Yes | Save model config |
| `SFC` | `?` | Form/version | `I` | Yes | Save form config |
| `GRL` | Model/control | Context dependent | List | Context dependent | List records |
| `GCQ` | Target model | Usually blank | `S` | Query | Custom query |
| `GUM` | Not used | Not used | Not used | No | User menu |
| `RIL` | Model | No | No | No | Record IDs |
| `GMV` | View | No | No | Query | Materialized view |
| `RMV` | View | Optional | No | No | Refresh view |
| `SBI` | Model | Search ID | No | No | Search by ID |
| `AUT` | Model | Record | `A` | No | Authorization |
| `DEL` | Model | Record | `D` | No | Delete unauthorized |
| `REV` | Model | Record | `R` | No | Reverse |
| `AFT` | `?` | Blank in example | `I` | Transaction | Fund transfer |
| `ULO` | No | No | No | No | Logout |
| `UAU` | No | User | No | No | Authorize user |

**Important:** this matrix is a frontend planning guide derived from the documented examples. It is not a replacement for a backend contract because several request combinations are not exhaustively specified in the source.

---

# 49. What Changes the Response?

The response can vary because several dimensions can change.

## Dimension 1 — requestType

```text
GMC
→ model configuration

GUM
→ menu structure

RIL
→ record IDs

GCQ
→ query result

AFT
→ transaction result
```

## Dimension 2 — controlName

```text
CUSTOMER
→ customer data

ACCOUNT
→ account data

CONTROL
→ control records

TODAY.TXN.ENTRY
→ transaction-related records
```

## Dimension 3 — recordFunction

```text
S
→ read

L
→ list

I
→ insert/update

A
→ authorization

R
→ reversal
```

## Dimension 4 — data

```text
data = customer fields
→ customer operation

data = transaction fields
→ transaction operation

data = queryString
→ custom query operation
```

Therefore the response type should be selected from:

```text
requestType
+
controlName
+
operation
+
model definition
```

not from HTTP status alone.

---

# 50. Recommended Frontend Architecture

For a serious banking frontend, use:

```text
src/
│
├── api/
│   ├── client.ts
│   ├── auth.api.ts
│   ├── core.api.ts
│   ├── model.api.ts
│   ├── form.api.ts
│   └── transaction.api.ts
│
├── types/
│   ├── api.ts
│   ├── auth.ts
│   ├── model.ts
│   ├── form.ts
│   ├── customer.ts
│   ├── account.ts
│   └── transaction.ts
│
├── features/
│   ├── customer/
│   ├── account/
│   ├── transaction/
│   └── administration/
│
├── components/
│   ├── dynamic-form/
│   ├── dynamic-field/
│   └── dynamic-table/
│
└── auth/
    ├── session.ts
    └── permissions.ts
```

---

# 51. Recommended Data Flow

For a new model:

```text
1. User opens screen
        ↓
2. Frontend identifies model
        ↓
3. GMC
        ↓
4. Receive model definition
        ↓
5. Cache model definition
        ↓
6. Generate form/table
        ↓
7. Fetch required data
        ↓
8. User enters data
        ↓
9. Validate using metadata
        ↓
10. PUT / appropriate requestType
        ↓
11. Receive response
        ↓
12. If authorization required
        ↓
13. AUT
        ↓
14. Refresh/read record
```

---

# 52. Model Configuration Should Be Cached

Model definitions are metadata and generally should not be fetched repeatedly during every render.

Recommended:

```text
First request
    ↓
GMC CUSTOMER
    ↓
Store in query cache

Next screen
    ↓
Use cached CUSTOMER model
```

For example, with React Query/TanStack Query:

```ts
useQuery({
  queryKey: ["model-config", "CUSTOMER"],
  queryFn: () => getModelConfig("CUSTOMER"),
});
```

This is an architectural recommendation for frontend implementation, not a behavior explicitly mandated by the source.

---

# 53. Error Handling

Create one central error interpreter.

```ts
function handleCoreResponse<T>(
  response: CoreResponse<T>
) {
  switch (response.statusCode) {
    case 200:
    case 201:
      return response.data;

    case 400:
      throw new ValidationError(response.message);

    case 401:
      throw new AuthenticationError(response.message);

    case 404:
      throw new NotFoundError(response.message);

    case 409:
      throw new DuplicateError(response.message);

    case 422:
      throw new BusinessRuleError(response.message);

    case 503:
      throw new RetryableError(response.message);

    default:
      throw new ServerError(response.message);
  }
}
```

The status mapping above follows the documented response semantics.

---

# 54. Retry Rules

Do not blindly retry every failed request.

```text
400 → NO
401 → refresh/re-authenticate
404 → NO
409 → Usually treat as already applied
422 → NO
503 → Retry with backoff
500 → Depends on operation
```

For financial transactions:

```text
NEVER blindly retry
```

First consider:

```text
idempotencyKey
transaction state
duplicate possibility
backend status
```

The architecture explicitly calls out idempotency for financial retry handling.

---

# 55. Important Frontend Rules

## Rule 1

Do not hard-code model-specific forms unnecessarily.

Bad:

```tsx
if (model === "CUSTOMER") ...
if (model === "ACCOUNT") ...
if (model === "BRANCH") ...
```

Prefer metadata-driven rendering.

---

## Rule 2

Do not assume all `data` objects have the same structure.

```ts
data: unknown
```

at the generic level is appropriate.

---

## Rule 3

Do not assume all requests require:

```text
controlName
recordId
recordFunction
data
```

The required fields depend on the operation.

---

## Rule 4

Do not assume the HTTP method completely describes the Core operation.

For example, the documented system uses `requestType` values such as:

```text
GMC
SFC
SMC
GCQ
AUT
REV
AFT
```

These are business-level operations inside the dynamic Core API.

---

## Rule 5

Keep authentication/session information centralized.

```text
userId
branchCode
token
clientId
```

should come from the session/API layer rather than individual UI components.

---

# 56. What Is Still Missing From the Current Documentation

There are several things I would **not invent** for the frontend developer because the supplied documentation does not provide enough information.

Specifically:

1. A complete HTTP endpoint list for every `requestType`.
2. Complete success-response examples for PUT.
3. Complete failure-response examples for PUT.
4. Complete response schemas for each model.
5. Complete response schemas for `GMC`, `GRL`, `GCQ`, `GUM`, etc.
6. Exact validation rules for every `controlName`.
7. Complete mapping between every `controlName` and its response type.
8. Complete query operator documentation for `GCQ`.
9. Complete definitions/examples for every request type in the request-type table.
10. Exact BFF endpoint for the generic Core operations.
11. OpenAPI/Swagger specification.
12. Complete protobuf definitions.

The source explicitly says that some request types are not yet implemented and are still under implementation.

So a production frontend guide should have a second document or generated contract containing the **actual model/control → request → response mappings**.

---

# 57. The Missing Piece You Are Really Asking For

Because you said:

> "control name differs then output differs"

the ideal final API documentation should contain a **Control Contract Registry**.

For example:

```text
CONTROL CONTRACT

controlName: CUSTOMER
--------------------------------
GET
response:
  Customer[]

GMC
response:
  CustomerModelConfig

PUT
request.data:
  Customer

response:
  CustomerResult
```

Then:

```text
controlName: ACCOUNT
--------------------------------
GET
response:
  Account[]

GMC
response:
  AccountModelConfig

PUT
request.data:
  Account

response:
  AccountResult
```

Then:

```text
controlName: TODAY.TXN.ENTRY
--------------------------------
GCQ
request.data:
  QueryString

response:
  Transaction[]
```

This registry is what will allow the frontend developer to know **exactly what to send and exactly what to expect**.

---

# 58. Ideal Frontend API Contract

The frontend documentation should ultimately provide this for every supported control:

```text
┌──────────────────────────────────────────────┐
│ CONTROL: CUSTOMER                            │
├──────────────────────────────────────────────┤
│ Model: CUSTOMER                              │
│                                              │
│ Supported Operations:                        │
│                                              │
│ GMC                                          │
│ ├── Request                                  │
│ └── Response → CustomerModel                 │
│                                              │
│ GET                                          │
│ ├── Request                                  │
│ └── Response → Customer                      │
│                                              │
│ PUT                                          │
│ ├── Request.data → CustomerInput             │
│ └── Response → CustomerResult                │
│                                              │
│ AUT                                          │
│ └── Response → AuthorizationResult           │
│                                              │
│ REV                                          │
│ └── Response → ReverseResult                 │
└──────────────────────────────────────────────┘
```

And then another:

```text
┌──────────────────────────────────────────────┐
│ CONTROL: ACCOUNT                             │
├──────────────────────────────────────────────┤
│ Model: ACCOUNT                               │
│                                              │
│ GMC → AccountModel                           │
│ GET → Account[]                              │
│ PUT → AccountResult                          │
│ AUT → AuthorizationResult                    │
│ REV → ReverseResult                          │
└──────────────────────────────────────────────┘
```

That is the level of documentation a frontend developer needs when the backend is truly dynamic.

---

# 59. Frontend Developer Quick Reference

### Authentication

```text
POST /api/login
```

### Generic model operations

```text
PUT → Insert / Update
GET → Get
GMC → Model Definition
SMC → Save Model Configuration
SFC → Save Form Configuration
GRL → List
GCQ → Custom Query
```

### Lifecycle

```text
AUT → Authorize
DEL → Delete unauthorized
REV → Reverse
```

### Navigation

```text
GUM → User Menu
RIL → Record ID List
```

### Views/reports

```text
GMV → Materialized View
RMV → Refresh Materialized View
GGL → Generated Reports
```

### Authentication/user

```text
ULI → Login
ULO → Logout
UAU → Authorize User
CPW → Change Password
```

### Financial

```text
AFT → Fund Transfer
ATT → Account Transfer
CTT → Cash Transfer
```

---

# 60. Golden Rule

When implementing this API in the frontend, always think:

```text
                requestType
                     │
                     ▼
                Operation
                     │
                     ▼
                controlName
                     │
                     ▼
                   Model
                     │
             ┌───────┴────────┐
             ▼                ▼
       Request Schema    Response Schema
             │                │
             └───────┬────────┘
                     ▼
             Frontend Renderer
```

The frontend should **not** guess the response from the URL.

It should know the contract from:

```text
requestType
+
controlName
+
recordFunction
+
model definition
```

That is the core principle behind this API architecture.
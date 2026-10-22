# 🏛️ CBS Architecture & Schema Ecosystem Specification
> **CRITICAL ARCHITECTURAL REFERENCE FOR AI AGENTS & DEVELOPERS**
> *Read this document before creating, modifying, or reasoning about forms, inquiries, model configs, or protocol verbs.*

---

## 🎯 1. Fundamental Mental Model & Intention

Janata CBS uses a **pure metadata-driven ecosystem**. The frontend is intentionally a **dumb workstation/panel**. It contains zero hardcoded business forms, zero hardcoded database tables, and zero SQL connections. 

Everything rendered in the UI is derived from **three foundational pillars**:

```
                       ┌──────────────────────────────────────────────┐
                       │          1. MODEL.CONFIG (The Mother)        │
                       │           (Defines all base schemas)         │
                       └──────────────────────┬───────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │                                                   │
                    ▼                                                   ▼
┌───────────────────────────────────────┐   ┌─────────────────────────────────────────┐
│     2. FORM.CONFIG (Versioned UI)     │   │     3. INQUIRY.CONFIG (Data Views)      │
│  (Presentation views of that Model)   │   │     (Enquiries on that Model)           │
│   e.g. ACCOUNT,1.0.0, ACCOUNT,CORP    │   │      e.g. INQ ACCOUNT, GET.EMP.INFO     │
└───────────────────────────────────────┘   └─────────────────────────────────────────┘
```

---

## 🧱 2. The Three Pillar Tables Explained

### Pillar 1: `MODEL.CONFIG` (The Data Schema Authority)
* **What it is:** The database metamodel for every business entity (`ACCOUNT`, `CUSTOMER`, `USER`, `BRANCH`, etc.).
* **Key Property:** Has **`properties: [...]`**.
* **What each property defines:** Raw table attributes (`name`, `label`, `type` e.g. `Text`/`Number`/`Dropdown`, `length`, `required`, `status: ACTIVE | ARCHIVED`, `parameter`).
* **Behavior:** When requested, it returns the raw schema. The frontend can auto-compile an operational 12-column card view directly from `properties` if no custom layout exists.

### Pillar 2: `FORM.CONFIG` (Versioned Presentation Layout)
* **What it is:** A customized, visual arrangement of a specific model's fields into cards, tabs, or steps.
* **Key Property:** Has **`presentation: { sections: [...], steps: [...] }`**.
* **Concept of Versioning:** 
  * A single model like `ACCOUNT` can have multiple presentation versions:
    * `ACCOUNT,1.0.0` (Standard Retail Opening)
    * `ACCOUNT,CORPORATE` (Multi-tab complex corporate workflow)
    * `ACCOUNT,KYC` (Restricted compliance view)
* **Rule:** A Form Config does **NOT** invent database fields. It arranges the fields defined in `MODEL.CONFIG` using specific visual widgets (`account-lookup`, `switch`, `select`), column spans, and sections.

### Pillar 3: `INQUIRY.CONFIG` (Dynamic Enquiries)
* **What it is:** Tabular report and inquiry definitions targeting a specific model.
* **Key Property:** Has **`columns: [...]`**, **`filters: [...]`**, and **`targetModel: "ACCOUNT"`**.
* **Execution:**
  1. Frontend requests the enquiry definition (`INQDef`, `INQSelectField`).
  2. Operator enters filter criteria.
  3. Protocol verb `INQ` executes the query and returns matching rows.

---

## 🔑 3. Properties vs. Presentation (Do Not Confuse!)

| Term | Belongs To | Purpose | Example Shape |
| :--- | :--- | :--- | :--- |
| **`properties`** | `MODEL.CONFIG` | **Database attributes & validation rules** | `[ { name: "balance", type: "Number", required: true, length: 18 } ]` |
| **`presentation`** | `FORM.CONFIG` | **Visual UI arrangement, widgets, cards & tabs** | `{ sections: [ { id: "sec_core", layoutStyle: "card", fields: [...] } ] }` |

### Structural Duck-Typing Rule for the Frontend:
The frontend does **NOT** rely on fragile string parsing or comma checks. It inspects the returned payload structure:
* If payload has **`presentation`** ➡️ It's a **Form Config**! Render the custom visual layout.
* If payload has **`properties`** ➡️ It's a **Model Config**! Render the auto-generated responsive fallback card.

---

## 📡 4. CBS Protocol Verbs & Real-World Operations

In this Core Banking system, **there is NO RESTful "GET"**. Everything operates under canonical CBS request verbs and the **RIDASHL** banking access model.

### 1. `GMC` (Get Model Configuration)
* **Purpose:** Retrieves the form schema from the Core backend.
* **Behavior:** 
  * If requested for a versioned form (e.g. `ACCOUNT,1.0.0`), the Core returns the `FORM.CONFIG` layout with `presentation`.
  * If requested for a base model (e.g. `ACCOUNT`), the Core returns `MODEL.CONFIG` with `properties`.

### 2. `SBI` (Search By Record ID / Wildcard)
* **Purpose:** Search and list the **keys / IDs only** for any table.
* **Payload:**
  ```json
  {
    "requestType": "SBI",
    "controlName": "MODEL.CONFIG",
    "recordId": "...AC...",
    "branchCode": "JB9999",
    "userId": "SYSADMIN"
  }
  ```
* **Returns:** **Array of ID strings ONLY** (`string[]`):
  ```json
  ["ACCOUNT", "AC.CHARGE", "AC.OVERDRAFT"]
  ```
* **Behavior:**
  * When `recordId` is `""` ➡️ Returns all IDs in the table.
  * When `recordId` has wildcard pattern (e.g. `...AC...`) ➡️ Filters to matching keys.

### 3. `S` (SEE / View Mode) — Replacing "GET"
* **RIDASHL Code:** `S` (See)
* **Purpose:** Opens a specific record in **read-only / view mode**.
* **Payload:**
  ```json
  {
    "recordFunction": "S",
    "controlName": "ACCOUNT",
    "recordId": "AC1001"
  }
  ```
* **Behavior:** Fetches record state without locking the row.

### 4. `GNI` (Get Next ID & Draft Initializer)
* **Purpose:** Core Brain resolver for new record creation or candidate ID validation.
* **Flow:**
  * **User types candidate ID & clicks `+` (or Enter):** Dumb UI sends `{ requestType: "GNI", controlName: "...", recordId: "CANDIDATE.ID" }`.
  * **If ID already exists in table:** Core returns `SUCCESS` with the existing record in Edit Mode (`I`).
  * **If ID does not exist & model is `userDefineId: true` (e.g. `MODEL.CONFIG`):** Core accepts the user's ID and initializes a blank draft record in Input Mode (`I`).
  * **If model is `userDefineId: false` (System Sequence, e.g. `ACCOUNT`):** Core generates the next sequential unique ID using `idDef.idPrefix` (e.g. `AC1001`, `CU1002`) and returns the fresh record in Input Mode (`I`).
* **View (`S`) vs Edit (`I`) Invariant:** A newly initialized draft has no committed ledger state; therefore, View (`S`) mode is disabled for new entries. View (`S`) is only valid for committed existing records.

### 5. `INQ` (Inquiry Query Execution & Dynamic Schema Resolver)
* **Purpose:** Core Brain resolver for inquiry execution and schema presentation.
* **Flow:**
  * **When custom `INQUIRY.CONFIG` exists:** Core returns the curated inquiry specification (configured columns, custom actions, default filters).
  * **When no custom `INQUIRY.CONFIG` exists (Raw Model Inquiry):** Core does **NOT** error out. Core synthesizes a dynamic enquiry schema directly from `MODEL.CONFIG`:
    1. **Columns:** Every property in `model.properties` becomes a table column with appropriate alignment and formatting (Amounts right-aligned, Dates centered, IDs monospaced).
    2. **Search / Filter Fields:** Every non-disabled property becomes an available criterion in the Filter Builder, allowing user to filter across all columns.
    3. **Rows:** Core pulls `table.getList()` to deliver table dataset.
* **Dumb UI Contract:** The UI table engine renders whatever `columns` and `selectionFields` are provided by the Core, without knowing or caring whether the spec was hand-crafted or auto-synthesized.

### 6. Transactional Mutations (`PUT`, `AUT`, `DEL`, `HLD`, `REV`)
* Enforces the Four-Eyes principle (`Maker !== Checker`):
  * `PUT` (Input) ➡️ Saves draft to unauthorized queue (`RECORD_STATUS: "INA"`).
  * `AUT` (Authorize) ➡️ Checker approves and commits to live ledger (`RECORD_STATUS: "AU"`).
  * `HLD` (Hold) ➡️ Puts record on hold (`RECORD_STATUS: "HLD"`).
  * `REV` (Reverse) ➡️ Reverses live record (`RECORD_STATUS: "REV"`).
  * `DEL` (Delete) ➡️ Marks unauthorized draft as deleted (`RECORD_STATUS: "DEL"`).

---

## 🚀 5. How the Unified UI Rendering Engine Works

```
               [ User Enters Command or Clicks Menu ]
                                │
                                ▼
                       OpsForm (Dumb Shell)
                                │
                        Requests GMC from Core
                                │
          ┌─────────────────────┴───────────────────────┐
          │                                             │
 Payload has `presentation`                    Payload has `properties`
 (It is a FORM.CONFIG version)                 (It is a raw MODEL.CONFIG)
          │                                             │
          ▼                                             ▼
  compileFormSpec(model, formConfig)            compileFormSpec(model, null)
          │                                             │
          └─────────────────────┬───────────────────────┘
                                │
                                ▼
                      CompiledFormSpec Contract
                  - sections: FormSection[]
                  - fields: FormFieldItem[]
                                │
                                ▼
                           <FormGrid />
              (Renders cards, tabs, and input widgets)
```

1. **`compileFormSpec()`** is a deterministic compiler in `@/lib/cbs-form-spec`. It always outputs a single unified contract: `CompiledFormSpec`.
2. **`OpsForm`** and **`FormGrid`** do not care whether a form came from a raw model or a complex multi-tab form layout. They render the exact same structure!
3. **Every form automatically gets:**
   * Record ID Lookup bar via `SBI`.
   * Action buttons: Commit (`PUT`), Authorize (`AUT`), Reverse (`REV`), Delete (`DEL`).
   * Keyboard shortcuts (`F5` Commit, `F3` Hold, `Esc` Cancel).
   * Real-time client-side validation enforcing the rules from `properties`.

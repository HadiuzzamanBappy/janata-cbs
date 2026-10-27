# Form Config (`FORM.CONFIG`) Comprehensive Architecture & Migration Plan

> **Scope**: Align Janata CBS `FORM.CONFIG` with backend legacy and modern Java core wire contracts, support compound `GFC` responses (combining `MODEL.CONFIG` `PROPERTIES` palette with `FORMCONTROL` layout), consolidate metadata & API routine hooks in the General tab, rename presentation models to `frmElements`, and establish lossless bidirectional serialization between the visual canvas and flat wire payloads.

---

## 1. Core Architecture: The Unified 2-in-1 Backend Envelope

### 1.1 Wire Request

When an operator accesses or requests a form configuration via command or API:
```json
{
  "servicePath": "default",
  "requestType": "GFC",
  "controlName": "CONFIG.FORM",
  "recordFunction": "S",
  "recordId": "CUSTOMER,GENERAL"
}
```

- `controlName`: `CONFIG.FORM` (Canonical CBS Control Name).
- `requestType`: `GFC` (Get Form Configuration).
- `recordFunction`: `S` (See / Read).
- `recordId`: Format is `<MODEL_NAME>,<FORM_NAME>` (e.g. `CUSTOMER,GENERAL` or `CUSTOMER,TEST`).

### 1.2 Wire Response Structure

The backend responds with a **compound object** merging the base Model definition with the Form configuration:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND GFC RESPONSE ENVELOPE                     │
│                                                                             │
│  data: {                                                                    │
│    // 1. BASE MODEL METAMODEL (from MODEL.CONFIG for "CUSTOMER")            │
│    TABLENAME: "CUSTOMER",                                                   │
│    PREFIX: "CU",                                                            │
│    DESCRIPTION: "CUSTOMER TABLE",                                           │
│    ACCESS: "G",                                                             │
│    AUTHORIZE: true,                                                         │
│    IDDEF: { IDPREFIX: "C", SEQUENCELENGTH: "8", IDPATTERN: "PF#IS" },       │
│    PROPERTIES: [                                                            │
│       { SN: "1", NAME: "mnemonic", LABEL: "Mnemonic", TYPE: "Text", ... },  │
│       { SN: "2", NAME: "shortName", LABEL: "Short Name", ... },             │
│       ... (all columns available in the model table)                        │
│    ],                                                                       │
│                                                                             │
│    // 2. FORM PRESENTATION CONTROL (from FORM.CONFIG / SC_FORM_CONFIG)      │
│    FORMCONTROL: {                                                           │
│       frmDescription: "General Customer",                                   │
│       authNumber: 1.0,                                                      │
│       rtnValidate: [ { routineName: "...", routineDescription: "..." } ],   │
│       rtnBeforeAuth: [ ... ],                                               │
│       rtnAfterAuth: [ ... ],                                                │
│       frmElements: [                                                        │
│          { SN: "2", NAME: "shortName", POSITION: "2,2", ... },              │
│          { SN: "6", NAME: "givenNames", POSITION: "2,1", ... },             │
│          { SN: "__tab__", NAME: "tabLayer", TYPE: "Tab", TABS: [...] },      │
│          { SN: "18", NAME: "presentAddress", TYPE: "Object", PROP: [...] }   │
│       ],                                                                    │
│       auditData: { recStatus: "AU", recCurrNumber: 4, ... }                 │
│    }                                                                        │
│  }                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Existing vs. New Form Behavior

| Scenario                                    | Request RecordId   | `PROPERTIES` in Response             | `FORMCONTROL` in Response                                                                                    |
| :------------------------------------------ | :----------------- | :----------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| **Existing Form** (`form.config.json`)      | `CUSTOMER,GENERAL` | All properties from `CUSTOMER` model | Populated `{ frmDescription, authNumber, rtnValidate, rtnBeforeAuth, rtnAfterAuth, frmElements, auditData }` |
| **New Form Draft** (`form.config.new.json`) | `CUSTOMER,TEST`    | All properties from `CUSTOMER` model | `{}` (empty object — no elements placed yet)                                                                 |

---

## 2. In-Memory Database Storage (`mock/db/SC_FORM_CONFIG.ts`)

In the simulated CBS database table `SC_FORM_CONFIG`:
- **Key**: `<MODEL_NAME>,<FORM_NAME>` (e.g. `"CUSTOMER,GENERAL"`).
- **Stored Record**: Contains the exact contents of `FORMCONTROL`:

  ```ts
  "CUSTOMER,GENERAL": {
    frmDescription: "General Customer",
    authNumber: 1.0,
    rtnValidate: [ { routineName: "", routineDescription: "" } ],
    rtnBeforeAuth: [ { routineName: "", routineDescription: "" } ],
    rtnAfterAuth: [ { routineName: "", routineDescription: "" } ],
    frmElements: [
      {
        NAME: "shortName",
        LABEL: "Short Name",
        TYPE: "Text",
        LENGTH: 35.0,
        STRUCTURE: "S",
        REQUIRED: true,
        DISABLED: false,
        WIDTH: 200.0,
        POSITION: "2,2",
        PARAMETER: { type: "O", data: [], modelName: "", displayField: "", condition: "", reference: "" },
        ENRICHTEXT: "",
        VALUE: "",
        FIXEDVALUE: "",
        ISOPEN: false,
        ISLOADING: false,
        PROP: [],
        DATASOURCE: [],
        SN: "2",
        DEFAULTVALUE: "",
      },
      ...
    ]
  }
  ```

### 2.1 Router Mock Dispatcher (`mock/core/operation-handlers.ts`)

When `handleGetFormConfig` executes:
1. Decomposes `payload.recordId` into `baseModel` (`"CUSTOMER"`) and `variant` (`"GENERAL"`).
2. Retrieves `model = SC_MODEL_CONFIG[baseModel]`.
3. Retrieves `formControl = SC_FORM_CONFIG[recordId] || {}`.
4. Returns the unified envelope: `{ ...model, FORMCONTROL: formControl }`.

---

## 3. Data Schema Definition (`src/lib/data-schemas/form-config-schema.ts`)

To support both the real wire protocol and runtime designer state without type errors:

```ts
// 1. Routine Reference for Lifecycle Hooks
export const routineRefSchema = z.object({
  routineName: z.string().default(""),
  routineDescription: z.string().default(""),
});
export type RoutineRef = z.infer<typeof routineRefSchema>;

// 2. Individual Form Element in frmElements
export const formElementSchema: z.ZodType<any> = z.lazy(() =>
  z.looseObject({
    NAME: z.string().default(""),
    LABEL: z.string().default(""),
    TYPE: z.string().default("Text"),
    LENGTH: z.number().optional(),
    STRUCTURE: z.enum(["S", "M"]).default("S").optional(),
    REQUIRED: z.boolean().default(false).optional(),
    DISABLED: z.boolean().default(false).optional(),
    WIDTH: z.number().optional(),
    POSITION: z.string().default("").optional(), // "row,col" e.g. "1,1", "2,2"
    PARAMETER: z.unknown().optional(),
    ENRICHTEXT: z.string().default("").optional(),
    VALUE: z.unknown().optional(),
    FIXEDVALUE: z.string().default("").optional(),
    ISOPEN: z.boolean().default(false).optional(),
    ISLOADING: z.boolean().default(false).optional(),
    SN: z.string().default("").optional(),
    DEFAULTVALUE: z.string().default("").optional(),
    TABGROUP: z.string().optional(),
    PROP: z.array(formElementSchema).default([]).optional(), // Nested child properties for Object types
    DATASOURCE: z.array(z.unknown()).default([]).optional(),
    TABS: z.array(z.object({ id: z.string(), label: z.string() })).optional(), // For TYPE === "Tab"
  }),
);
export type FormElement = z.infer<typeof formElementSchema>;

// 3. Form Config Master Record
export const formConfigRecordSchema = z.looseObject({
  frmDescription: z.string().optional(),
  authNumber: z.number().default(1).optional(),
  rtnValidate: z.array(routineRefSchema).default([]).optional(),
  rtnBeforeAuth: z.array(routineRefSchema).default([]).optional(),
  rtnAfterAuth: z.array(routineRefSchema).default([]).optional(),
  frmElements: z.array(formElementSchema).default([]).optional(),

  // Optional visual presentation state for designer drag-and-drop
  presentation: formConfigPresentationSchema.optional(),

  // Contextual identifiers
  recordId: z.string().optional(),
  id: z.string().optional(),
  targetModel: z.string().optional(),
  version: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  auditData: auditDataSchema.optional(),
});
export type FormConfigRecord = z.infer<typeof formConfigRecordSchema>;
```

---

## 4. Screen Layout & Tabs (`SysFormConfig`)

The workbench screen `SysFormConfig` provides 5 clean, focused tabs:

### Tab 1: General Tab (`FcGeneralTab`)

- **Metadata Card**:
  - `Form Description` (`frmDescription`): Display name of the form.
  - `Target Model` (`targetModel`): Base data entity (e.g. `CUSTOMER` - read-only badge).
  - `Form Variant / ID` (`version`): Identifier (e.g. `GENERAL` or `TEST`).
  - `Authorizations Required` (`authNumber`): Number of Four-Eyes checks needed (`1` or `2`).
- **Validation Routines Card (`rtnValidate`)**:
  - Sub-table for pre-commit validation rules: `routineName`, `routineDescription`, Add/Delete.
- **Pre-Authorization Routines Card (`rtnBeforeAuth`)**:
  - Sub-table for pre-approval business rule verification.
- **Post-Authorization Routines Card (`rtnAfterAuth`)**:
  - Sub-table for post-approval accounting and notification dispatch.

### Tab 2: Form Elements Tab (`FcDesignerTab` / Visual Designer)

- **Left Panel (Available Model Properties Palette)**:
  - Sourced directly from `data.PROPERTIES` (from base model).
  - Shows all properties from the model.
  - Badges/Icons indicate whether each property is already placed in `frmElements`.
  - Search and filter by Type (Text, Dropdown, Date, Object, etc.).
  - Drag or click (+) to add unplaced fields to the Canvas.
- **Center Canvas**:
  - Visual layout rendering `frmElements`:
    - Root fields placed in row/col grid coordinates.
    - Tab Layer: Tab navigation bar (`Present Address`, `Permanent Address`, `Contact Address`, `KYC`).
    - Inside Tabs: Placed fields matching `TABGROUP === tab.id`.
    - Object Groups: Card containers rendering child properties (`PROP: [...]`).
  - Drag-and-drop reordering, moving between tabs, removing fields back to the palette.
- **Right Panel (Property Inspector)**:
  - Inspects the selected element in the canvas: Label, Widget type, Width (colSpan 1..12), Required, Disabled, Position coordinates (`row,col`), Tab assignment (`TABGROUP`).

### Tab 3: Live Preview Tab (`FcPreviewTab`)

- Compiles `frmElements` using `compileFormSpec` into an interactive live form.
- Renders through `<FormRenderer />` for immediate operational verification.

### Tab 4: Audit Tab (`FcAuditTab`)

- Standard CBS audit fields: `recStatus`, `recCurrNumber`, `recInputter`, `recInputTime`, `recAuthorizer`, `recAuthTime`, `recBranchCode`.

### Tab 5: JSON Output Tab (`FcJsonTab`)

- Formatted view of the exact wire payload (`FORMCONTROL` and compound response) for inspection and debugging.

---

## 5. Bidirectional Serialization Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ON LOAD (GFC Response)                           │
│                                                                             │
│  data.PROPERTIES ───────────────► Left Palette (Available Model Fields)     │
│                                                                             │
│  data.FORMCONTROL                                                           │
│  ├─ frmDescription, authNumber, rtn* ──► General Tab                        │
│  └─ frmElements ──────────────────────► frmElementsToPresentation()         │
│                                              │                              │
│                                              ▼                              │
│                                     Canvas Visual Tree (Sections & Tabs)    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            ON SAVE (SFC Request)                            │
│                                                                             │
│  General Tab (Metadata + Routines) ──┐                                      │
│                                      ├─► FORMCONTROL Wire Payload           │
│  Canvas Visual Tree                  │   { frmDescription, authNumber,      │
│  └─► presentationToFrmElements() ────┘     rtnValidate, rtnBeforeAuth,      │
│       (computes POSITION: "row,col",        rtnAfterAuth, frmElements }     │
│        TABGROUP, and tabLayer)                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Implementation Checklist & Quality Gates

- [ ] **Step 1: Schema Update (`src/lib/data-schemas/form-config-schema.ts`)**:
  - Add `routineRefSchema`, `formElementSchema`.
  - Update `formConfigRecordSchema` with top-level `frmDescription`, `authNumber`, `rtnValidate`, `rtnBeforeAuth`, `rtnAfterAuth`, `frmElements`, and make `presentation` optional.
- [ ] **Step 2: TypeScript & Database Verification**:
  - Run `pnpm typecheck` to confirm `mock/db/SC_FORM_CONFIG.ts` compiles with zero TS errors.
- [ ] **Step 3: Mock Dispatcher Update (`mock/core/operation-handlers.ts`)**:
  - Update `handleGetFormConfig` to return the compound object `{ ...model, FORMCONTROL: formControl }`.
  - Update `database-router.ts` / `CBS_DATABASE` to map `CONFIG.FORM` to `SC_FORM_CONFIG_TABLE`.
- [ ] **Step 4: Parser / Converter Utilities (`src/lib/data-parsers/form-config-parser.ts`)**:
  - Implement `frmElementsToPresentation` (converts flat elements + tab layer into canvas sections).
  - Implement `presentationToFrmElements` (converts canvas sections back into flat elements with `POSITION` and `TABGROUP`).
- [ ] **Step 5: General Tab (`fc-general-tab.tsx`)**:
  - Add Form Metadata fields (`frmDescription`, `targetModel`, `authNumber`).
  - Add 3 routine hook sub-tables (`rtnValidate`, `rtnBeforeAuth`, `rtnAfterAuth`).
- [ ] **Step 6: Form Designer Integration (`use-form-config.ts` & Designer Canvas)**:
  - Populate palette from `data.PROPERTIES`.
  - Populate canvas from `data.FORMCONTROL.frmElements`.
- [ ] **Step 7: Verification**:
  - Run `pnpm typecheck`.
  - Run `pnpm verify:form-spec` and `pnpm verify:all`.

import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

/**
 * Standard Form Sections definition for MODEL.CONFIG General tab.
 * Leverages the platform's centralized form-engine and SectionCard.
 */
export const MODEL_CONFIG_SECTIONS: FormSection[] = [
  {
    id: "sec_identity",
    title: "Model Identification & Attributes",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "TABLENAME",
        LABEL: "Table Name",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 35,
        REQUIRED: true,
        WIDTH: "md",
        ENRICHTEXT: "Physical database table name storing the model records.",
      },
      {
        SN: "2",
        NAME: "PREFIX",
        LABEL: "Table Prefix",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 4,
        WIDTH: "sm",
        ENRICHTEXT: "Two-letter CBS module prefix (e.g. SC, AC, CU).",
      },
      {
        SN: "3",
        NAME: "DESCRIPTION",
        LABEL: "Description",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 80,
        REQUIRED: true,
        WIDTH: "md",
        ENRICHTEXT: "Human-readable functional summary of this model.",
      },
      {
        SN: "4",
        NAME: "SERVICEPATH",
        LABEL: "Service Path",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 100,
        REQUIRED: true,
        WIDTH: "sm",
        ENRICHTEXT: "Backend microservice path or endpoint routing key.",
      },
      {
        SN: "5",
        NAME: "ACCESS",
        LABEL: "Table Type",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 1,
        REQUIRED: true,
        WIDGET: "radio-group",
        PARAMETER: {
          type: "O",
          data: [
            { code: "G", label: "Global" },
            { code: "B", label: "Branch" },
          ],
        },
        ENRICHTEXT: "Defines whether records are shared globally or scoped by branch.",
      },
      {
        SN: "6",
        NAME: "ASSOCIATES",
        LABEL: "Other Tables",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 35,
        WIDGET: "checkbox",
        PARAMETER: {
          type: "O",
          data: [
            { code: "HIS", label: "HIS" },
            { code: "UNA", label: "UNA" },
            { code: "DEL", label: "DEL" },
          ],
        },
        ENRICHTEXT:
          "Associated auxiliary audit tables: HIS (History), UNA (Unauthorized), DEL (Deleted).",
      },
      {
        SN: "7",
        NAME: "_DEVBY",
        LABEL: "Developed By",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 35,
        WIDTH: "md",
        ENRICHTEXT: "Developer username who authored or modified this schema.",
      },
      {
        SN: "8",
        NAME: "_DEVDATE",
        LABEL: "Development Date",
        TYPE: "Date",
        STRUCTURE: "S",
        LENGTH: 10,
        WIDTH: "sm",
        ENRICHTEXT: "Date when this schema configuration was created or revised.",
      },
    ],
  },
  {
    id: "sec_id_rules",
    title: "Record ID Generation Rules",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "9",
        NAME: "USERDEFINEID",
        LABEL: "User Define Id",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        ENRICHTEXT: "Allows operators to manually provide custom record IDs during creation.",
      },
      {
        SN: "10",
        NAME: "IDROUTINE",
        LABEL: "ID Routine",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 50,
        WIDTH: "md",
        ENRICHTEXT: "Custom server routine hook executed to generate record IDs.",
      },
      {
        SN: "11",
        NAME: "IDDEF.IDPREFIX",
        LABEL: "ID Prefix",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 10,
        WIDTH: "sm",
        ENRICHTEXT: "Constant prefix prepended to all generated IDs.",
      },
      {
        SN: "12",
        NAME: "IDDEF.idPatternSelect",
        LABEL: "Select Id Pattern",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 35,
        WIDTH: "full",
        WIDGET: "checkbox",
        PARAMETER: {
          type: "O",
          data: [
            { code: "PF", label: "Prefix" },
            { code: "RN", label: "Random Number" },
            { code: "BS", label: "Base36 Sequence" },
            { code: "IS", label: "Integer Sequence" },
            { code: "JD", label: "Julian Date" },
          ],
        },
        ENRICHTEXT: "Select token patterns (Prefix, Julian Date, Sequence) to construct IDs.",
      },
      {
        SN: "13",
        NAME: "IDDEF.IDPATTERN",
        LABEL: "Id Pattern",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 50,
        DISABLED: true,
        WIDTH: "md",
        ENRICHTEXT: "Compiled composite format pattern string for ID generation.",
      },
      {
        SN: "14",
        NAME: "IDDEF.SEQUENCELENGTH",
        LABEL: "Id Length",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 5,
        WIDTH: "sm",
        ENRICHTEXT: "Fixed digit length for sequence numbering.",
      },
      {
        SN: "15",
        NAME: "IDDEF.SEQUENCERESET",
        LABEL: "Reset Sequence",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        ENRICHTEXT: "Resets the serial sequence counter back to 1 at start of each business cycle.",
      },
    ],
  },
  {
    id: "sec_flags",
    title: "Operational & Governance Flags",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "16",
        NAME: "AUTHORIZE",
        LABEL: "Authorization",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        ENRICHTEXT: "Enforces Four-Eyes Maker-Checker authorization workflow for records.",
      },
      {
        SN: "17",
        NAME: "READONLY",
        LABEL: "Read Only",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        ENRICHTEXT: "Locks records from editing or amending after initial entry.",
      },
      {
        SN: "18",
        NAME: "SEARCHABLE",
        LABEL: "Searchable",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        ENRICHTEXT: "Enforces indexing for global search and inquiry screens.",
      },
      {
        SN: "19",
        NAME: "FIELDBASED",
        LABEL: "Field Based Auth",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        ENRICHTEXT:
          "Applies authorization rights at individual field level instead of entire record.",
      },
    ],
  },
];

/**
 * Utility to set value into ModelConfigRecord via dot path immutably
 */
export function setFieldValue(
  record: ModelConfigRecord,
  path: string,
  value: unknown,
): ModelConfigRecord {
  // 1. Nested IDDEF fields
  if (path.startsWith("IDDEF.")) {
    const key = path.replace("IDDEF.", "");

    let finalVal: unknown = value;
    if (key === "idPatternSelect") {
      finalVal = Array.isArray(value) ? value.join("#") : "";
    } else if (key === "SEQUENCELENGTH") {
      finalVal = value !== "" && value !== undefined && value !== null ? Number(value) : undefined;
    } else if (key === "IDPREFIX" && typeof value === "string") {
      finalVal = value.toUpperCase().replace(/\s+/g, "");
    }

    const targetKey = key === "idPatternSelect" ? "IDPATTERN" : key;

    return {
      ...record,
      IDDEF: {
        ...record.IDDEF,
        [targetKey]: finalVal,
      },
    };
  }

  // 2. Top-level fields
  const formattedVal =
    typeof value === "string" && ["TABLENAME", "PREFIX", "IDROUTINE"].includes(path)
      ? value.toUpperCase().replace(/\s+/g, "")
      : value;

  return {
    ...record,
    [path]: formattedVal,
  };
}

/**
 * Standard Form Sections definition for the selected Model Property inspector.
 * Fully renders property identity & constraints using the platform's form-engine.
 */
export const PROPERTY_INSPECTOR_SECTIONS: FormSection[] = [
  {
    id: "sec_prop_identity",
    title: "Column Identity",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "1",
        NAME: "NAME",
        LABEL: "Field Name",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 35,
        REQUIRED: true,
        WIDTH: "md",
        ENRICHTEXT:
          "Database column identifier (snake_case or camelCase) mapped to backend tables.",
      },
      {
        SN: "2",
        NAME: "LABEL",
        LABEL: "Display Label",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 80,
        REQUIRED: true,
        WIDTH: "lg",
        ENRICHTEXT: "Human-readable label displayed across user interface screens.",
      },
      {
        SN: "3",
        NAME: "TYPE",
        LABEL: "Data Type",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 20,
        WIDGET: "segmented",
        WIDTH: "full",
        PARAMETER: {
          type: "O",
          data: [
            { code: "Text", label: "Text" },
            { code: "Number", label: "Number" },
            { code: "Date", label: "Date" },
          ],
        },
        ENRICHTEXT: "Physical database column data type: Text, Number, or ISO-8601 Date.",
      },
      {
        SN: "4",
        NAME: "STRUCTURE",
        LABEL: "Structure",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 5,
        WIDGET: "segmented",
        WIDTH: "full",
        PARAMETER: {
          type: "O",
          data: [
            { code: "S", label: "Single (S)" },
            { code: "M", label: "Multi-Value (M)" },
          ],
        },
        ENRICHTEXT: "Single (S) scalar value or Multi-Value (M) repeating primitive array.",
      },
    ],
  },
  {
    id: "sec_prop_constraints",
    title: "Storage & Display Constraints",
    type: "standard",
    layoutStyle: "card",
    columns: 1,
    fields: [
      {
        SN: "5",
        NAME: "LENGTH",
        LABEL: "Length / Size",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 4,
        WIDTH: "sm",
        ENRICHTEXT: "Maximum character storage limit or numerical precision allowed.",
      },
      {
        SN: "6",
        NAME: "WIDTH",
        LABEL: "Display Width",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 10,
        WIDGET: "segmented",
        WIDTH: "full",
        PARAMETER: {
          type: "O",
          data: [
            { code: "xs", label: "XS" },
            { code: "sm", label: "SM" },
            { code: "md", label: "MD" },
            { code: "lg", label: "LG" },
            { code: "xl", label: "XL" },
            { code: "xxl", label: "XXL" },
            { code: "full", label: "FULL" },
          ],
        },
        ENRICHTEXT:
          "Semantic layout width token: XS (120px), SM (180px), MD (280px), LG (450px), XL (600px), XXL (700px), FULL (row-wide).",
      },
      {
        SN: "7",
        NAME: "REQUIRED",
        LABEL: "Required",
        TYPE: "Boolean",
        STRUCTURE: "S",
        LENGTH: 1,
        WIDGET: "checkbox",
        ENRICHTEXT: "Whether this column enforces non-null constraint at database commit.",
      },
    ],
  },
];

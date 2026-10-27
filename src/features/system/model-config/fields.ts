import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export type MetaFieldGroup = "IDENTITY" | "ID_RULES" | "FLAGS";

export type MetaFieldType =
  | "text"
  | "number"
  | "boolean"
  | "tags"
  | "checkbox-group"
  | "radio-group"
  | "id-pattern-select"
  | "date";

export interface MetaFieldDef {
  /**
   * Target path in ModelConfigRecord:
   * Direct key (e.g. 'tableName', 'description') or nested in idDef (e.g. 'idDef.idPattern')
   */
  path: string;
  label: string;
  group: MetaFieldGroup;
  type: MetaFieldType;
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
  disabled?: boolean;
  width?: "full" | "half" | "compact";
  options?: Array<{ value: string; label: string }>;
}

export const META_FIELD_GROUPS: Array<{
  id: MetaFieldGroup;
  title: string;
}> = [
  {
    id: "IDENTITY",
    title: "Model Identification & Attributes",
  },
  {
    id: "ID_RULES",
    title: "Record ID Generation Rules",
  },
  {
    id: "FLAGS",
    title: "Operational & Governance Flags",
  },
];

export const ID_PATTERN_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "PF", label: "Prefix" },
  { value: "RN", label: "Random Number" },
  { value: "BS", label: "Base36 Sequence" },
  { value: "IS", label: "Integer Sequence" },
  { value: "JD", label: "Julian Date" },
];

/**
 * Extensible declarative registry of all metadata fields on the General tab.
 */
export const MODEL_META_FIELDS: MetaFieldDef[] = [
  // --- Group 1: IDENTITY ---
  {
    path: "TABLENAME",
    label: "Table Name",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. MODEL_DEFINITION",
    required: true,
    uppercase: true,
    width: "half",
  },
  {
    path: "PREFIX",
    label: "Table Prefix",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. SC",
    uppercase: true,
    width: "compact",
  },
  {
    path: "DESCRIPTION",
    label: "Description",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Model Definition",
    required: true,
    width: "full",
  },
  {
    path: "SERVICEPATH",
    label: "Service Path",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. default",
    required: true,
    width: "full",
  },
  {
    path: "ACCESS",
    label: "Table Type",
    group: "IDENTITY",
    type: "radio-group",
    required: true,
    options: [
      { value: "G", label: "Global" },
      { value: "B", label: "Branch" },
    ],
  },
  {
    path: "ASSOCIATES",
    label: "Other Tables",
    group: "IDENTITY",
    type: "checkbox-group",
    options: [
      { value: "HIS", label: "HIS" },
      { value: "UNA", label: "UNA" },
      { value: "DEL", label: "DEL" },
    ],
  },
  {
    path: "_DEVBY",
    label: "Developed By",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Bappy",
    width: "half",
  },
  {
    path: "_DEVDATE",
    label: "Developement Date",
    group: "IDENTITY",
    type: "date",
    placeholder: "YYYY-MM-DD",
    width: "compact",
  },

  // --- Group 2: ID_RULES ---
  {
    path: "USERDEFINEID",
    label: "User Define Id",
    group: "ID_RULES",
    type: "boolean",
  },
  {
    path: "IDROUTINE",
    label: "ID Routine",
    group: "ID_RULES",
    type: "text",
    placeholder: "e.g. RT.GEN.CUST.ID",
    uppercase: true,
    width: "half",
  },
  {
    path: "IDDEF.IDPREFIX",
    label: "ID Prefix",
    group: "ID_RULES",
    type: "text",
    placeholder: "Optional prefix",
    uppercase: true,
    width: "compact",
  },
  {
    path: "IDDEF.idPatternSelect",
    label: "Select Id Pattern",
    group: "ID_RULES",
    type: "id-pattern-select",
    options: ID_PATTERN_OPTIONS,
  },
  {
    path: "IDDEF.IDPATTERN",
    label: "Id Pattern",
    group: "ID_RULES",
    type: "text",
    disabled: true,
    width: "half",
  },
  {
    path: "IDDEF.SEQUENCELENGTH",
    label: "Id Length",
    group: "ID_RULES",
    type: "number",
    placeholder: "Auto",
    width: "compact",
  },
  {
    path: "IDDEF.SEQUENCERESET",
    label: "Reset Sequence",
    group: "ID_RULES",
    type: "boolean",
  },

  // --- Group 3: FLAGS ---
  {
    path: "AUTHORIZE",
    label: "Authorization",
    group: "FLAGS",
    type: "boolean",
  },
  {
    path: "READONLY",
    label: "Read Only",
    group: "FLAGS",
    type: "boolean",
  },
  {
    path: "SEARCHABLE",
    label: "Searchable",
    group: "FLAGS",
    type: "boolean",
  },
  {
    path: "FIELDBASED",
    label: "Field Based Auth",
    group: "FLAGS",
    type: "boolean",
  },
];

/**
 * Utility to get value from ModelConfigRecord via dot path
 */
export function getFieldValue(record: ModelConfigRecord, path: string): unknown {
  if (path === "IDDEF.idPatternSelect" || path === "idDef.idPatternSelect") {
    return record.IDDEF?.IDPATTERN ? record.IDDEF.IDPATTERN.split("#").filter(Boolean) : [];
  }
  if (path.startsWith("IDDEF.")) {
    const key = path.replace("IDDEF.", "") as keyof typeof record.IDDEF;
    return record.IDDEF?.[key];
  }
  if (path.startsWith("idDef.")) {
    const key = path.replace("idDef.", "").toUpperCase() as keyof typeof record.IDDEF;
    return record.IDDEF?.[key];
  }
  return record[path as keyof ModelConfigRecord];
}

/**
 * Utility to set value into ModelConfigRecord via dot path immutably
 */
export function setFieldValue(
  record: ModelConfigRecord,
  path: string,
  value: unknown,
): ModelConfigRecord {
  if (path === "IDDEF.idPatternSelect" || path === "idDef.idPatternSelect") {
    const arr = Array.isArray(value) ? value : [];
    return {
      ...record,
      IDDEF: {
        ...record.IDDEF,
        IDPATTERN: arr.join("#"),
      },
    };
  }
  if (path.startsWith("IDDEF.")) {
    const key = path.replace("IDDEF.", "");
    return {
      ...record,
      IDDEF: {
        ...record.IDDEF,
        [key]: value,
      },
    };
  }
  if (path.startsWith("idDef.")) {
    const key = path.replace("idDef.", "").toUpperCase();
    return {
      ...record,
      IDDEF: {
        ...record.IDDEF,
        [key]: value,
      },
    };
  }
  return {
    ...record,
    [path]: value,
  };
}

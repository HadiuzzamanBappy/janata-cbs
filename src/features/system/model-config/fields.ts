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
    path: "tableName",
    label: "Table Name",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. MODEL_DEFINITION",
    required: true,
    uppercase: true,
    width: "half",
  },
  {
    path: "prefix",
    label: "Table Prefix",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. SC",
    uppercase: true,
    width: "compact",
  },
  {
    path: "description",
    label: "Description",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Model Definition",
    required: true,
    width: "full",
  },
  {
    path: "servicePath",
    label: "Service Path",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. default",
    required: true,
    width: "full",
  },
  {
    path: "access",
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
    path: "associates",
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
    path: "devBy",
    label: "Developed By",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Bappy",
    width: "half",
  },
  {
    path: "devDate",
    label: "Developement Date",
    group: "IDENTITY",
    type: "date",
    placeholder: "YYYY-MM-DD",
    width: "compact",
  },

  // --- Group 2: ID_RULES ---
  {
    path: "userDefineId",
    label: "User Define Id",
    group: "ID_RULES",
    type: "boolean",
  },
  {
    path: "idDef.idPrefix",
    label: "ID Prefix",
    group: "ID_RULES",
    type: "text",
    placeholder: "Optional prefix",
    uppercase: true,
    width: "compact",
  },
  {
    path: "idDef.idPatternSelect",
    label: "Select Id Pattern",
    group: "ID_RULES",
    type: "id-pattern-select",
    options: ID_PATTERN_OPTIONS,
  },
  {
    path: "idDef.idPattern",
    label: "Id Pattern",
    group: "ID_RULES",
    type: "text",
    disabled: true,
    width: "half",
  },
  {
    path: "idDef.sequenceLength",
    label: "Id Length",
    group: "ID_RULES",
    type: "number",
    placeholder: "Auto",
    width: "compact",
  },
  {
    path: "idDef.sequenceReset",
    label: "Reset Sequence",
    group: "ID_RULES",
    type: "boolean",
  },

  // --- Group 3: FLAGS ---
  {
    path: "authorize",
    label: "Authorization",
    group: "FLAGS",
    type: "boolean",
  },
  {
    path: "readOnly",
    label: "Read Only",
    group: "FLAGS",
    type: "boolean",
  },
  {
    path: "searchable",
    label: "Searchable",
    group: "FLAGS",
    type: "boolean",
  },
];

/**
 * Utility to get value from ModelConfigRecord via dot path
 */
export function getFieldValue(record: ModelConfigRecord, path: string): unknown {
  if (path === "idDef.idPatternSelect") {
    return record.idDef?.idPattern ? record.idDef.idPattern.split("#").filter(Boolean) : [];
  }
  if (path.startsWith("idDef.")) {
    const key = path.replace("idDef.", "") as keyof typeof record.idDef;
    return record.idDef?.[key];
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
  if (path === "idDef.idPatternSelect") {
    const arr = Array.isArray(value) ? value : [];
    return {
      ...record,
      idDef: {
        ...record.idDef,
        idPattern: arr.join("#"),
      },
    };
  }
  if (path.startsWith("idDef.")) {
    const key = path.replace("idDef.", "");
    return {
      ...record,
      idDef: {
        ...record.idDef,
        [key]: value,
      },
    };
  }
  return {
    ...record,
    [path]: value,
  };
}

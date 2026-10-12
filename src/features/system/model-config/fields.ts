import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export type MetaFieldGroup = "IDENTITY" | "ID_RULES" | "FLAGS";

export type MetaFieldType = "text" | "number" | "boolean" | "tags" | "checkbox-group";

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
  width?: "full" | "half" | "compact";
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

export const META_FIELD_GROUPS: Array<{
  id: MetaFieldGroup;
  title: string;
  description?: string;
}> = [
  {
    id: "IDENTITY",
    title: "Model Identification & Core Attributes",
  },
  {
    id: "ID_RULES",
    title: "Record ID Generation & Pattern Rules",
  },
  {
    id: "FLAGS",
    title: "Operational Flags & Constraints",
  },
];

/**
 * Extensible declarative registry of all metadata fields on the General tab.
 * Adding or removing a field in the future takes just 1 line of configuration here.
 */
export const MODEL_META_FIELDS: MetaFieldDef[] = [
  // --- Group 1: IDENTITY ---
  {
    path: "tableName",
    label: "Table Name",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. MENU_TREE",
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
    placeholder: "e.g. Core Banking Data Model Definition",
    required: true,
    width: "full",
  },
  {
    path: "category",
    label: "Category",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. APPLICATION",
    uppercase: true,
    width: "half",
  },
  {
    path: "access",
    label: "Access Level",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. G",
    uppercase: true,
    width: "compact",
  },
  {
    path: "servicePath",
    label: "Service Path",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. default",
    width: "half",
  },
  {
    path: "associates",
    label: "Associates",
    group: "IDENTITY",
    type: "checkbox-group",
    width: "half",
    options: [
      { value: "HIS", label: "HIS" },
      { value: "DEL", label: "DEL" },
      { value: "UNA", label: "UNA" },
    ],
  },
  {
    path: "devBy",
    label: "Developed By",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. SYSTEM / DEV_OPERATOR",
    width: "half",
  },
  {
    path: "devDate",
    label: "Development Date",
    group: "IDENTITY",
    type: "text",
    placeholder: "YYYY-MM-DD",
    width: "compact",
  },

  // --- Group 2: ID_RULES ---
  {
    path: "idDef.idPattern",
    label: "ID Pattern",
    group: "ID_RULES",
    type: "text",
    placeholder: "e.g. IS",
    width: "half",
  },
  {
    path: "idDef.idPrefix",
    label: "ID Prefix",
    group: "ID_RULES",
    type: "text",
    placeholder: "Optional prefix",
    width: "half",
  },
  {
    path: "idDef.sequenceLength",
    label: "Seq Length",
    group: "ID_RULES",
    type: "number",
    placeholder: "Auto",
    width: "compact",
  },
  {
    path: "idDef.sequenceReset",
    label: "Seq Reset",
    group: "ID_RULES",
    type: "boolean",
    helperText: "Reset on new period",
  },

  // --- Group 3: FLAGS ---
  {
    path: "searchable",
    label: "Searchable",
    group: "FLAGS",
    type: "boolean",
  },
  {
    path: "authorize",
    label: "Authorize",
    group: "FLAGS",
    type: "boolean",
  },
  {
    path: "userDefineId",
    label: "User Defined ID",
    group: "FLAGS",
    type: "boolean",
  },
  {
    path: "predefineId",
    label: "Predefined ID",
    group: "FLAGS",
    type: "boolean",
  },
  {
    path: "readOnly",
    label: "Read Only",
    group: "FLAGS",
    type: "boolean",
  },
];

/**
 * Utility to get value from ModelConfigRecord via dot path
 */
export function getFieldValue(record: ModelConfigRecord, path: string): unknown {
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

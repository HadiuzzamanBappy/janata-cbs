export type MetaFieldGroup = "IDENTITY" | "LAYOUT_PAGING" | "ROUTING";

export type MetaFieldType = "text" | "number" | "boolean" | "select";

export interface MetaFieldDef {
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
  helperText?: string;
}

export const META_FIELD_GROUPS: Array<{
  id: MetaFieldGroup;
  title: string;
}> = [
  {
    id: "IDENTITY",
    title: "Inquiry Identification & Target Controller",
  },
  {
    id: "LAYOUT_PAGING",
    title: "Display & Pagination Settings",
  },
  {
    id: "ROUTING",
    title: "Service Routing & Reporting",
  },
];

/**
 * Extensible declarative registry of all metadata fields on the Inquiry General tab.
 * Uses exact canonical wire paths under INQInfo.
 */
export const INQUIRY_META_FIELDS: MetaFieldDef[] = [
  // --- Group 1: IDENTITY ---
  {
    path: "INQInfo.description",
    label: "Description",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Account enquiry with customer balances and status",
    required: true,
    width: "full",
    helperText: "Descriptive title of this inquiry definition",
  },
  {
    path: "INQInfo.controllerName",
    label: "Controller / Model",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. ACCOUNT or USER",
    required: true,
    uppercase: true,
    width: "half",
    helperText: "Target CBS entity or primary controller table",
  },
  {
    path: "INQInfo.inqType",
    label: "Inquiry Type",
    group: "IDENTITY",
    type: "select",
    required: true,
    width: "compact",
    options: [
      { value: "DFT", label: "Default Table (DFT)" },
      { value: "RPT", label: "Report View (RPT)" },
      { value: "CUST", label: "Custom Drill (CUST)" },
    ],
  },

  // --- Group 2: LAYOUT_PAGING ---
  {
    path: "INQInfo.pageOrientation",
    label: "Page Orientation",
    group: "LAYOUT_PAGING",
    type: "select",
    width: "compact",
    options: [
      { value: "Portrait", label: "Portrait" },
      { value: "Landscape", label: "Landscape" },
    ],
  },
  {
    path: "INQInfo.perpageItem",
    label: "Records Per Page",
    group: "LAYOUT_PAGING",
    type: "number",
    placeholder: "30",
    width: "compact",
  },
  {
    path: "INQInfo.showSerial",
    label: "Show Serial Numbers",
    group: "LAYOUT_PAGING",
    type: "boolean",
    helperText: "Render row serial number (1, 2, 3...) in table results",
  },
  {
    path: "INQInfo.showPagination",
    label: "Enable Pagination",
    group: "LAYOUT_PAGING",
    type: "boolean",
    helperText: "Show footer paging controls and page navigation",
  },
  {
    path: "INQInfo.showBranchWise",
    label: "Branch-Wise Segregation",
    group: "LAYOUT_PAGING",
    type: "boolean",
    helperText: "Filter results to current operator's branch automatically",
  },

  // --- Group 3: ROUTING ---
  {
    path: "INQInfo.rptControllerName",
    label: "Report Controller",
    group: "ROUTING",
    type: "text",
    placeholder: "e.g. RPT.ACC.LIST",
    uppercase: true,
    width: "half",
    helperText: "Optional report controller identifier for PDF/print generation",
  },
  {
    path: "INQInfo.inqServicePath",
    label: "Inq Service Path",
    group: "ROUTING",
    type: "text",
    placeholder: "e.g. default",
    required: true,
    width: "half",
    helperText: "Service routing endpoint path",
  },
];

export function getFieldValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== "object") return "";
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === undefined || current === null || typeof current !== "object") {
      return "";
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function setFieldValue<T extends object>(obj: T, path: string, val: unknown): T {
  const clone = JSON.parse(JSON.stringify(obj)) as Record<string, unknown>;
  const parts = path.split(".");
  let current: Record<string, unknown> = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== "object") {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = val;
  return clone as T;
}

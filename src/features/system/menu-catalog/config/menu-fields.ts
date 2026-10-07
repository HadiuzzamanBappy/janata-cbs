import type { MenuCatalogRecord } from "@/lib/schemas/menu-catalog-schema";

export type MenuFieldGroup = "IDENTITY" | "BEHAVIOR" | "STATUS";

export type MenuFieldType = "text" | "select" | "textarea" | "boolean";

export interface MenuFieldDef {
  path: string;
  label: string;
  group: MenuFieldGroup;
  type: MenuFieldType;
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
  width?: "full" | "half" | "compact";
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

export const MENU_FIELD_GROUPS: Array<{
  id: MenuFieldGroup;
  title: string;
}> = [
  {
    id: "IDENTITY",
    title: "Action Identity & Target Command",
  },
  {
    id: "BEHAVIOR",
    title: "Catalog Categorization & Details",
  },
  {
    id: "STATUS",
    title: "Operational Lifecycle State",
  },
];

export const MENU_META_FIELDS: MenuFieldDef[] = [
  // --- Group 1: IDENTITY ---
  {
    path: "label",
    label: "Action Label",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Open Savings Account",
    required: true,
    width: "half",
  },
  {
    path: "command",
    label: "Target Command",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. ACCOUNT I, INQ ACCT.BAL",
    required: true,
    uppercase: true,
    width: "half",
    helperText: "CBS transaction, inquiry or utility command code",
  },

  // --- Group 2: BEHAVIOR ---
  {
    path: "menuType",
    label: "Menu Type",
    group: "BEHAVIOR",
    type: "select",
    width: "half",
    options: [
      { value: "SCREEN", label: "Interactive Screen" },
      { value: "INQUIRY", label: "Ledger Inquiry (INQ)" },
      { value: "REPORT", label: "Batch / Report Output" },
      { value: "SUBMENU", label: "Folder / Submenu Node" },
      { value: "EXTERNAL", label: "External Web URL" },
    ],
  },
  {
    path: "description",
    label: "Description",
    group: "BEHAVIOR",
    type: "textarea",
    placeholder: "Operational summary, tooltip helper, or user guidelines...",
    width: "full",
  },

  // --- Group 3: STATUS ---
  {
    path: "isActive",
    label: "Catalog Active State",
    group: "STATUS",
    type: "boolean",
    helperText: "Controls visibility within workbench search and menu navigator",
  },
];

export function getMenuFieldValue(record: MenuCatalogRecord, path: string): unknown {
  return record[path as keyof MenuCatalogRecord];
}

export function setMenuFieldValue(
  record: MenuCatalogRecord,
  path: string,
  value: unknown,
): MenuCatalogRecord {
  return {
    ...record,
    [path]: value,
  };
}

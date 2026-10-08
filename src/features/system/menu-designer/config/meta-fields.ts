import type { MenuTreeRecord } from "@/lib/schemas/menu-designer-schema";

export type MenuDesignerFieldGroup = "IDENTITY" | "STATUS";

export type MenuDesignerFieldType = "text" | "boolean";

export interface MenuDesignerFieldDef {
  path: string;
  label: string;
  group: MenuDesignerFieldGroup;
  type: MenuDesignerFieldType;
  placeholder?: string;
  required?: boolean;
  uppercase?: boolean;
  width?: "full" | "half" | "compact";
  helperText?: string;
}

export const MENU_DESIGNER_FIELD_GROUPS: Array<{
  id: MenuDesignerFieldGroup;
  title: string;
}> = [
  {
    id: "IDENTITY",
    title: "Hierarchy Tree Identification",
  },
  {
    id: "STATUS",
    title: "Operational Lifecycle State",
  },
];

export const MENU_DESIGNER_META_FIELDS: MenuDesignerFieldDef[] = [
  // --- Group 1: IDENTITY ---
  {
    path: "treeDescription",
    label: "Tree Description",
    group: "IDENTITY",
    type: "text",
    placeholder: "e.g. Core Enterprise Main Navigation",
    required: true,
    width: "full",
    helperText: "Human-readable descriptive label for this navigation hierarchy",
  },

  // --- Group 2: STATUS ---
  {
    path: "isActive",
    label: "Active Navigation State",
    group: "STATUS",
    type: "boolean",
    helperText: "Controls whether this navigation hierarchy is live across workbenches",
  },
];

export function getMenuDesignerFieldValue(record: MenuTreeRecord, path: string): unknown {
  return record[path as keyof MenuTreeRecord];
}

export function setMenuDesignerFieldValue(
  record: MenuTreeRecord,
  path: string,
  value: unknown,
): MenuTreeRecord {
  return {
    ...record,
    [path]: value,
  };
}

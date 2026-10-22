import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Domain Schemas & Contracts for Menu Tree Designer                */
/* Table: MENU_TREE (MODEL.CONFIG properties):                                */
/*   1. treeDescription (SN: 1, Type: Text, Length: 300, Required: true)      */
/*   2. isActive (SN: 2, Type: Boolean, Length: 1, Required: false)           */
/*   3. menuTree (SN: 3, Type: Text, Length: 50, Structure: M, Required: true)*/
/* -------------------------------------------------------------------------- */

/** Hierarchical tree node representing navigation items in the Menu Designer canvas. */
export type MenuTreeNode = {
  id: string;
  menuId: number | string;
  label: string;
  command?: string;
  menuType?: "SCREEN" | "POPUP";
  isVisible: boolean;
  orderIndex: number;
  children: MenuTreeNode[];
};

export const menuTreeNodeSchema: z.ZodType<MenuTreeNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1, "Node ID is required"),
    menuId: z.union([z.number(), z.string()]),
    label: z.string().min(1, "Node label is required"),
    command: z.string().optional(),
    menuType: z.enum(["SCREEN", "POPUP"]).optional(),
    isVisible: z.boolean().default(true),
    orderIndex: z.number().default(0),
    children: z.array(menuTreeNodeSchema).default([]),
  }),
);

/** Menu tree definition record persisted in the `MENU_TREE` control table. */
export const menuTreeRecordSchema = z.object({
  recordId: z.string().min(1, "Tree ID is required"),
  treeDescription: z.string().min(1, "Tree Description is required"),
  isActive: z.boolean().optional(),
  menuTree: z.array(menuTreeNodeSchema).default([]),
  auditData: auditDataSchema.optional(),
});

export type MenuTreeRecord = z.infer<typeof menuTreeRecordSchema>;

/* -------------------------------------------------------------------------- */
/* Menu Designer Catalog Action Items & Canvas Contracts                      */
/* -------------------------------------------------------------------------- */

/** Palette item draggable from the menu catalog drawer into the designer canvas. */
export interface MenuCatalogActionItem {
  id: string;
  code?: string;
  label: string;
  command: string;
  menuType?: string;
  description?: string;
}

/* -------------------------------------------------------------------------- */
/* Menu Designer Screen Validation Errors                                     */
/* -------------------------------------------------------------------------- */

/** Designer screen validation error mapped to tab headers or canvas nodes. */
export interface MenuDesignerValidationError {
  id: string;
  tab: "general" | "canvas" | "audit";
  nodeId?: string;
  fieldKey: string;
  message: string;
}

import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Enums                                                            */
/* -------------------------------------------------------------------------- */

export const menuTypeSchema = z.enum(["GROUP", "INQUIRY", "FORM", "REPORT"]);
export type MenuType = z.infer<typeof menuTypeSchema>;
export const MENU_TYPES = menuTypeSchema.options;

export const menuActionSchema = z.enum(["SCREEN", "POPUP"]);
export type MenuAction = z.infer<typeof menuActionSchema>;
export const MENU_ACTIONS = menuActionSchema.options;

/* ========================================================================== */
/* 1. Universal UI Navigation Menu Item (Sidebar, Drawer, & Canvas Tree)      */
/* ========================================================================== */

export type MenuItem = {
  id: string;
  menuId?: number | string;
  label: string;
  title?: string;
  command?: string;
  componentName?: string;
  menuType?: MenuType;
  menuAction?: MenuAction;
  isVisible: boolean;
  orderIndex: number;
  children: MenuItem[];
};

export const menuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({
    id: z.string().min(1, "Item ID is required"),
    menuId: z.union([z.number(), z.string()]).optional(),
    label: z.string().trim().min(1, "Menu label is required"),
    title: z.string().trim().optional(),
    command: z
      .string()
      .trim()
      .nullable()
      .optional()
      .transform((val) => (val === null ? undefined : val)),
    componentName: z.string().trim().optional(),
    menuType: menuTypeSchema.optional(),
    menuAction: menuActionSchema.optional(),
    isVisible: z.boolean().default(true),
    orderIndex: z.number().default(0),
    children: z.array(menuItemSchema).default([]),
  }),
);

/** Unified Alias: MenuTreeNode is strictly identical to MenuItem */
export type MenuTreeNode = MenuItem;
export const menuTreeNodeSchema = menuItemSchema;

/**
 * Domain Helper: Determines whether a menu node represents a navigation folder/group
 * rather than a clickable leaf transaction command.
 */
export function isMenuFolderNode(
  node: Pick<MenuItem, "command" | "children" | "menuType">,
): boolean {
  if (node.menuType === "GROUP") return true;
  if (!node.command?.trim()) return true;
  return Boolean(node.children && node.children.length > 0);
}

/* ========================================================================== */
/* 2. Menu Catalog Action Item (Left Palette Drawer in Menu Designer)         */
/* ========================================================================== */

export interface MenuCatalogActionItem {
  id: string;
  code?: string;
  label: string;
  command: string;
  menuType?: MenuType;
  menuAction?: MenuAction;
}

/* ========================================================================== */
/* 3. Menu Tree Document Record (Table: SC_MENU_TREE)                         */
/* ========================================================================== */

export const menuTreeRecordSchema = z.object({
  recordId: z.string().trim().optional(),
  id: z.string().trim().optional(),
  treeDescription: z.string().trim().min(1, "Tree Description is required"),
  isActive: z.boolean().optional(),
  menuTree: z.array(menuItemSchema).default([]),
  auditData: auditDataSchema.optional(),
});

export type MenuTreeRecord = z.infer<typeof menuTreeRecordSchema>;

/* ========================================================================== */
/* 4. UI Screen Validation Helper                                             */
/* ========================================================================== */

export interface MenuDesignerValidationError {
  id: string;
  tab: "general" | "canvas";
  nodeId?: string;
  fieldKey: string;
  message: string;
}

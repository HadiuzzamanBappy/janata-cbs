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
  command?: string;
  menuType?: MenuType;
  menuAction?: MenuAction;
  isVisible: boolean;
  orderIndex: number;
  children: MenuItem[];
};

export const menuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z
    .object({
      id: z.string().min(1, "Item ID is required"),
      menuId: z.union([z.number(), z.string()]).optional(),
      label: z.string().min(1, "Menu label is required"),
      command: z
        .string()
        .trim()
        .nullable()
        .optional()
        .transform((val) => (val === null ? undefined : val)),
      menuType: menuTypeSchema.optional(),
      menuAction: menuActionSchema.optional(),
      isVisible: z.boolean().default(true),
      orderIndex: z.number().default(0),
      children: z.array(menuItemSchema).default([]),
    })
    .passthrough(),
);

/** Unified Alias: MenuTreeNode is identical to MenuItem */
export type MenuTreeNode = MenuItem;
export const menuTreeNodeSchema = menuItemSchema;

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

export const menuTreeRecordSchema = z
  .object({
    recordId: z.string().optional(),
    treeDescription: z.string().min(1, "Tree Description is required"),
    isActive: z.boolean().optional(),
    menuTree: z.array(menuItemSchema).default([]),
    auditData: auditDataSchema.optional(),
  })
  .passthrough();

export type MenuTreeRecord = z.infer<typeof menuTreeRecordSchema>;

/* ========================================================================== */
/* 4. UI Screen Validation Helper                                             */
/* ========================================================================== */

export interface MenuDesignerValidationError {
  id: string;
  tab: "general" | "canvas" | "audit";
  nodeId?: string;
  fieldKey: string;
  message: string;
}

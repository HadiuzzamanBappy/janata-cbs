import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Domain Schemas & Contracts for Menu Designer                     */
/* Features Covered:                                                          */
/*   1. Flat Menu Action Items (Table: SC_MENU / Catalog)                     */
/*   2. Hierarchical Navigation Tree (Table: SC_MENU_TREE / Designer Canvas)  */
/* -------------------------------------------------------------------------- */

/* ========================================================================== */
/* 1. MENU CATALOG CONTRACT (Table: SC_MENU)                                  */
/* ========================================================================== */

/**
 * Visual/functional category for menu catalog and tree items:
 * - "GROUP": Folder/container grouping other items
 * - "INQUIRY": Read-only query / inquiry screen
 * - "FORM": Interactive input/maintenance form (GMC screen)
 * - "REPORT": Analytical or ledger report screen
 */
export const menuTypeSchema = z.enum(["GROUP", "INQUIRY", "FORM", "REPORT"]);
export type MenuType = z.infer<typeof menuTypeSchema>;
export const MENU_TYPES = menuTypeSchema.options;

/**
 * Action target for user-configurable menu catalog items.
 * Strictly limited to how the interactive screen/inquiry opens:
 * - "SCREEN": opens inside an integrated Workspace Tab
 * - "POPUP": opens inside a multi-monitor detached popup window
 */
export const menuActionSchema = z.enum(["SCREEN", "POPUP"]);
export type MenuAction = z.infer<typeof menuActionSchema>;
export const MENU_ACTIONS = menuActionSchema.options;

export const menuCatalogRecordSchema = z.object({
  recordId: z.string().optional(),
  label: z.string().min(1, "Menu Label is required").max(250, "Max 250 characters"),
  command: z
    .string()
    .max(250, "Max 250 characters")
    .regex(/^([A-Z0-9_. ,]+)?$/, "Must be uppercase alphanumeric command format")
    .optional()
    .default(""),
  menuType: menuTypeSchema.default("FORM"),
  menuAction: menuActionSchema.default("SCREEN"),
  actionType: menuActionSchema.optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  auditData: auditDataSchema.optional(),
});

export type MenuCatalogRecord = z.infer<typeof menuCatalogRecordSchema>;

/** Screen-level validation error item mapped to UI tab headers. */
export interface MenuValidationErrorItem {
  id: string;
  tab: "general" | "audit";
  fieldKey: string;
  message: string;
}

/* ========================================================================== */
/* 2. MENU TREE & CANVAS CONTRACT (Table: SC_MENU_TREE)                       */
/* ========================================================================== */

/** Hierarchical tree node representing navigation items in the Menu Designer canvas. */
export type MenuTreeNode = {
  id: string;
  menuId: number | string;
  label: string;
  command?: string;
  menuType?: MenuType;
  menuAction?: MenuAction;
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
    menuType: menuTypeSchema.optional(),
    menuAction: menuActionSchema.optional(),
    isVisible: z.boolean().default(true),
    orderIndex: z.number().default(0),
    children: z.array(menuTreeNodeSchema).default([]),
  }),
);

/**
 * Standard Navigation Menu Item Contract.
 * Unifies sidebar tree navigation with the Menu Designer canvas nodes.
 */
export type MenuItem = {
  id: string;
  menuId?: number | string;
  label: string;
  command?: string;
  menuType?: MenuType;
  menuAction?: MenuAction;
  children?: MenuItem[];
};

export const menuItemSchema: z.ZodType<MenuItem> = z.lazy(() =>
  z.object({
    id: z.string(),
    menuId: z.union([z.number(), z.string()]).optional(),
    label: z.string(),
    command: z.string().optional(),
    menuType: menuTypeSchema.optional(),
    menuAction: menuActionSchema.optional(),
    children: z.array(menuItemSchema).optional(),
  }),
);

/** Menu tree definition record persisted in the `MENU_TREE` control table. */
export const menuTreeRecordSchema = z.object({
  recordId: z.string().optional(),
  treeDescription: z.string().min(1, "Tree Description is required"),
  isActive: z.boolean().optional(),
  menuTree: z.array(menuTreeNodeSchema).default([]),
  auditData: auditDataSchema.optional(),
});

export type MenuTreeRecord = z.infer<typeof menuTreeRecordSchema>;

/** Palette item draggable from the menu catalog drawer into the designer canvas. */
export interface MenuCatalogActionItem {
  id: string;
  code?: string;
  label: string;
  command: string;
  menuType?: MenuType | string;
  menuAction?: MenuAction | string;
  description?: string;
}

/** Designer screen validation error mapped to tab headers or canvas nodes. */
export interface MenuDesignerValidationError {
  id: string;
  tab: "general" | "canvas" | "audit";
  nodeId?: string;
  fieldKey: string;
  message: string;
}

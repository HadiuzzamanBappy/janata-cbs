import { z } from "zod";

/**
 * Menu Node Schema (Recursive)
 * Canonical JSON schema for tree nodes in Core Banking navigation
 */
export const menuNodeSchema: z.ZodType<MenuNodeOutput> = z.lazy(() =>
  z.object({
    id: z.string(),
    menuId: z.union([z.number(), z.string()]),
    label: z.string(),
    command: z.string().default(""),
    isVisible: z.boolean().default(true),
    orderIndex: z.number().default(0),
    children: z.array(menuNodeSchema).default([]),
  }),
);

export type MenuNodeOutput = {
  id: string;
  menuId: number | string;
  label: string;
  command: string;
  isVisible: boolean;
  orderIndex: number;
  children: MenuNodeOutput[];
};

/**
 * Complete Menu Configuration Schema
 * Exactly matching the database record persisted under MENU.TREE
 */
export const menuConfigurationRecordSchema = z.object({
  recordId: z.string(),
  treeDescription: z.string(),
  isActive: z.boolean().default(true),
  menuTree: z.array(menuNodeSchema),
  auditData: z
    .object({
      recStatus: z.string().optional(),
      recCurrNumber: z.number().optional(),
      recInputter: z.string().optional(),
      recInputTime: z.string().optional(),
      recAuthorizer: z.string().optional(),
      recAuthTime: z.string().optional(),
      recBranchCode: z.string().optional(),
    })
    .optional(),
});

export type MenuConfigurationRecord = z.infer<typeof menuConfigurationRecordSchema>;

export interface MenuCatalogItem {
  id: string;
  code: string;
  label: string;
  command: string;
  description?: string;
}

export type MenuNode = MenuNodeOutput;

export type MenuScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";

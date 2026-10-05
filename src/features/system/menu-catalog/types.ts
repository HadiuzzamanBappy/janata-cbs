import { z } from "zod";

/**
 * Menu Catalog Item Schema (TABLE: MENU)
 * Atomic action/command record
 */
export const menuCatalogItemSchema = z.object({
  recordId: z.string().min(1, "Record ID is required"),
  label: z.string().min(1, "Menu label is required"),
  command: z.string().min(1, "Target command is required"),
  description: z.string().default(""),
  isActive: z.boolean().default(true),
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

export type MenuCatalogItem = z.infer<typeof menuCatalogItemSchema>;

export type CatalogScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";

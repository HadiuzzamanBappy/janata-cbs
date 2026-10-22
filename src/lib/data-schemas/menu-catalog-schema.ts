import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Domain Schemas & Contracts for Menu Catalog (TABLE: MENU)         */
/* Derived directly from the unified ActionType model:                        */
/*   1. label (SN: 1, Type: Text, Length: 250, Required: true)                 */
/*   2. command (SN: 2, Type: Text, Length: 250, Pattern: ^[A-Z0-9_.]+$)       */
/*   3. actionType (SN: 3, Unified single-source-of-truth ActionType)          */
/* -------------------------------------------------------------------------- */

/**
 * Action target for user-configurable menu catalog items.
 * Strictly limited to how the interactive screen/inquiry opens:
 * - "SCREEN": opens inside an integrated Workspace Tab
 * - "POPUP": opens inside a multi-monitor detached popup window
 */
export const menuTypeSchema = z.enum(["SCREEN", "POPUP"]);
export type MenuType = z.infer<typeof menuTypeSchema>;
export const MENU_TYPES = menuTypeSchema.options;

export const menuCatalogRecordSchema = z.object({
  recordId: z.string().optional(),
  label: z.string().min(1, "Menu Label is required").max(250, "Max 250 characters"),
  command: z
    .string()
    .min(1, "Target command code is required")
    .max(250, "Max 250 characters")
    .regex(/^[A-Z0-9_. ,]+$/, "Must be uppercase alphanumeric command format"),
  menuType: menuTypeSchema.default("SCREEN"),
  actionType: menuTypeSchema.optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  auditData: auditDataSchema.optional(),
});

export type MenuCatalogRecord = z.infer<typeof menuCatalogRecordSchema>;

/* -------------------------------------------------------------------------- */
/* Menu Catalog Screen Validation Errors                                      */
/* -------------------------------------------------------------------------- */

/** Screen-level validation error item mapped to UI tab headers. */
export interface MenuValidationErrorItem {
  id: string;
  tab: "general" | "audit";
  fieldKey: string;
  message: string;
}

import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Domain Schemas & Contracts for Menu Catalog (TABLE: MENU)         */
/* Derived directly from the MODEL.CONFIG properties for MENU:                 */
/*   1. label (SN: 1, Type: Text, Length: 250, Required: true)                 */
/*   2. command (SN: 2, Type: Text, Length: 250, Pattern: ^[A-Z0-9_.]+$)       */
/*   3. menuType (SN: 3, Type: Text, Length: 50)                               */
/* -------------------------------------------------------------------------- */

export const menuTypeSchema = z.enum(["SCREEN", "INQUIRY", "REPORT", "SUBMENU", "EXTERNAL"]);
export type MenuType = z.infer<typeof menuTypeSchema>;
export const MENU_TYPES = menuTypeSchema.options;

export const menuCatalogRecordSchema = z.object({
  recordId: z.string().min(1, "Menu ID is required"),
  label: z.string().min(1, "Menu Label is required").max(250, "Max 250 characters"),
  command: z
    .string()
    .min(1, "Target command code is required")
    .max(250, "Max 250 characters")
    .regex(/^[A-Z0-9_. ,]+$/, "Must be uppercase alphanumeric command format"),
  menuType: menuTypeSchema.default("SCREEN"),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  auditData: auditDataSchema.optional(),
});

export type MenuCatalogRecord = z.infer<typeof menuCatalogRecordSchema>;

export interface MenuValidationErrorItem {
  id: string;
  tab: "general" | "audit";
  fieldKey: string;
  message: string;
}

import type { CbsScreenMode as MenuCatalogScreenMode } from "../cbs-screen/types";
export type { MenuCatalogScreenMode };

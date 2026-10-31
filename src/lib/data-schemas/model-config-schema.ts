import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. DATA TYPES (Physical Database Column Types)                             */
/* ========================================================================== */

export const propertyTypeSchema = z.enum(["Text", "Number", "Date", "Object", "Dropdown"]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export const PROPERTY_TYPES = propertyTypeSchema.options;

export const PROPERTY_WIDTHS = ["xs", "sm", "md", "lg", "xl", "xxl", "full"] as const;
export type PropertyWidth = (typeof PROPERTY_WIDTHS)[number];

export const propertyWidthSchema = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (PROPERTY_WIDTHS.includes(lower as PropertyWidth)) return lower;
  }
  if (typeof val === "number" || (typeof val === "string" && /^\d+$/.test(val))) {
    const num = Number(val);
    if (num >= 450) return "full";
    if (num >= 300) return "lg";
    if (num >= 220) return "md";
    if (num >= 180) return "sm";
    return "xs";
  }
  return "md";
}, z.enum(PROPERTY_WIDTHS));

/* ========================================================================== */
/* 2. FIELD PROPERTY (Physical Database Column - Single Source of Truth)       */
/* ========================================================================== */

/**
 * Canonical physical column property in MODEL.CONFIG.
 * Exactly what exists in the database table: SN, NAME, LABEL, TYPE, STRUCTURE, LENGTH, REQUIRED, WIDTH.
 */
export const modelPropertySchema = z.object({
  SN: z.coerce.string().default(""),
  NAME: z.string().min(1, "Field name is required"),
  LABEL: z.string().min(1, "Field label is required"),
  TYPE: propertyTypeSchema.default("Text"),
  STRUCTURE: z.enum(["S", "M"]).default("S"),
  LENGTH: z.coerce.number().default(50),
  REQUIRED: z.boolean().default(false),
  WIDTH: propertyWidthSchema.default("md").optional(),
});

export type ModelProperty = z.infer<typeof modelPropertySchema>;

/* ========================================================================== */
/* 3. TABLE RECORD: MODEL CONFIG RECORD (MODEL.CONFIG)                        */
/* ========================================================================== */

export const idDefSchema = z.object({
  IDPREFIX: z.string().default(""),
  SEQUENCELENGTH: z.union([z.number(), z.string()]).default("").optional(),
  SEQUENCERESET: z.boolean().default(false),
  IDPATTERN: z.string().default(""),
});

export type IdDef = z.infer<typeof idDefSchema>;

export const modelConfigRecordSchema = z.object({
  _DEVBY: z.string().default(""),
  _DEVDATE: z.string().default(""),
  DESCRIPTION: z.string().min(1, "Description is required"),
  PREFIX: z.string().default(""),
  TABLENAME: z.string().min(1, "Table Name is required"),
  USERDEFINEID: z.boolean().default(false),
  ACCESS: z.string().min(1, "Table Type (Global / Branch) is required"),
  READONLY: z.boolean().default(false),
  SEARCHABLE: z.boolean().default(false),
  ASSOCIATES: z.array(z.string()).default([]),
  AUTHORIZE: z.boolean().default(false),
  SERVICEPATH: z.string().min(1, "Service Path is required"),
  IDDEF: idDefSchema.default({
    IDPREFIX: "",
    SEQUENCELENGTH: "",
    SEQUENCERESET: false,
    IDPATTERN: "",
  }),
  PROPERTIES: z.array(modelPropertySchema).default([]),
  IDROUTINE: z.string().default(""),
  FIELDBASED: z.boolean().default(false),
  auditData: auditDataSchema.optional(),
});

export type ModelConfigRecord = z.infer<typeof modelConfigRecordSchema>;

/* ========================================================================== */
/* 4. VALIDATION ERRORS                                                       */
/* ========================================================================== */

export interface ValidationErrorItem {
  id: string;
  tab: "general" | "properties" | "audit";
  sn?: string;
  fieldKey: string;
  message: string;
}

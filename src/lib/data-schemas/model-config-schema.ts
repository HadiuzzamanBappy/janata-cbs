import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. DATA TYPES (Physical Database Column Types)                             */
/* ========================================================================== */

export const propertyTypeSchema = z.enum([
  "Text",
  "Number",
  "Date",
  "Boolean",
  "Object",
  "Dropdown",
]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export const PROPERTY_TYPES = propertyTypeSchema.options;

export const propertyWidthSchema = z.preprocess((val) => {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const trimmed = val.trim();
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    const lower = trimmed.toLowerCase();
    if (lower === "xs") return 120;
    if (lower === "sm") return 180;
    if (lower === "md") return 280;
    if (lower === "lg") return 450;
    if (lower === "xl") return 600;
    if (lower === "xxl") return 700;
    if (lower === "full") return 1000;
  }
  return val;
}, z.number());

export type PropertyWidth = z.infer<typeof propertyWidthSchema>;

/* ========================================================================== */
/* 2. FIELD PROPERTY (Physical Database Column - Single Source of Truth)       */
/* ========================================================================== */

/**
 * Canonical physical column property in MODEL.CONFIG.
 * Exactly what exists in the database table: SN, NAME, LABEL, TYPE, STRUCTURE, LENGTH, REQUIRED, WIDTH.
 */
export const baseModelPropertySchema = z.object({
  SN: z.coerce.string().default(""),
  NAME: z.string().min(1, "Field name is required"),
  LABEL: z.string().min(1, "Field label is required"),
  TYPE: propertyTypeSchema.default("Text"),
  STRUCTURE: z.enum(["S", "M"]).default("S"),
  LENGTH: z.coerce.number().default(50),
  REQUIRED: z.boolean().default(false).optional(),
  WIDTH: propertyWidthSchema.default(280).optional(),
  PARAMETER: z.record(z.string(), z.unknown()).optional(),
  DATASOURCE: z.array(z.unknown()).optional(),
});

export type ModelProperty = z.infer<typeof baseModelPropertySchema> & {
  PROP?: ModelProperty[];
};

export const modelPropertySchema: z.ZodType<ModelProperty> = baseModelPropertySchema.extend({
  PROP: z.lazy(() => z.array(modelPropertySchema)).optional(),
});

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
  IDROUTINE: z.string().default("").optional(),
  FIELDBASED: z.boolean().default(false).optional(),
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

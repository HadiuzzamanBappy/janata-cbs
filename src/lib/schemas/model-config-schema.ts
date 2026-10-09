import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Domain Schemas & Contracts for Model Config Designer             */
/* -------------------------------------------------------------------------- */

export const propertyTypeSchema = z.enum(["Text", "Number", "Date", "Boolean"]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export const PROPERTY_TYPES = propertyTypeSchema.options;

export const modelPropertySchema = z.object({
  sn: z.string(),
  name: z.string().min(1, "Field name is required"),
  label: z.string().min(1, "Field label is required"),
  type: propertyTypeSchema.default("Text"),
  structure: z.enum(["S", "M"]).default("S"), // S = Single value, M = Multi-value
  length: z.number().default(50),
  required: z.boolean().default(false),
  disabled: z.boolean().default(false),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  mask: z.string().optional(),
  pattern: z.string().optional(),
  defaultValue: z.any().optional(),
  fixedValue: z.string().optional(),
  enrichText: z.string().optional(),
});

export type ModelProperty = z.infer<typeof modelPropertySchema>;

export const modelConfigRecordSchema = z.object({
  recordId: z.string().min(1, "Model Table ID is required"),
  tableName: z.string().default(""),
  description: z.string().min(1, "Description is required"),
  prefix: z.string().default(""),
  category: z.string().default(""),
  servicePath: z.string().default(""),
  userDefineId: z.boolean().default(false),
  predefineId: z.boolean().default(false),
  access: z.string().default(""),
  searchable: z.boolean().default(false),
  readOnly: z.boolean().default(false),
  authorize: z.boolean().default(false),
  associates: z.array(z.string()).default([]),
  devBy: z.string().default(""),
  devDate: z.string().default(""),
  idDef: z
    .object({
      idPrefix: z.string().default(""),
      idPattern: z.string().default(""),
      sequenceLength: z.union([z.number(), z.string()]).optional(),
      sequenceReset: z.boolean().default(false),
    })
    .default({ idPrefix: "", idPattern: "", sequenceReset: false }),
  properties: z.array(modelPropertySchema).default([]),
  isActive: z.boolean().default(false),
  auditData: auditDataSchema.optional(),
});

export type ModelConfigRecord = z.infer<typeof modelConfigRecordSchema>;

export interface ValidationErrorItem {
  id: string;
  tab: "general" | "fields" | "audit";
  sn?: string;
  fieldKey: string;
  message: string;
}

export type ModelConfigScreenMode = "IDLE" | "CREATE" | "EDIT" | "VIEW";

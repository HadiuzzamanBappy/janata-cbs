import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* -------------------------------------------------------------------------- */
/* Canonical Domain Schemas & Contracts for Model Config Designer             */
/* -------------------------------------------------------------------------- */

/** Supported primitive and parameterized data types for dynamic CBS table model attributes. */
export const propertyTypeSchema = z.enum([
  "Text",
  "Number",
  "Date",
  "Boolean",
  "Textarea",
  "Dropdown",
  "Checkbox",
  "Radio",
  "Array",
  "Object",
]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export const PROPERTY_TYPES = propertyTypeSchema.options;

/** Option item for Parameterized types (Dropdown, Checkbox, Radio) */
export const propertyParameterOptionSchema = z.object({
  id: z.string().optional(),
  itemCode: z.string().default(""),
  itemLabel: z.string().default(""),
});
export type PropertyParameterOption = z.infer<typeof propertyParameterOptionSchema>;

/** Parameter definition for Dropdown / Checkbox / Radio types */
export const propertyParameterSchema = z.object({
  type: z.enum(["O", "M", ""]).default("O"), // O = Options (static), M = Model (DB)
  data: z.array(propertyParameterOptionSchema).default([]),
  modelName: z.string().default(""),
  displayField: z.string().default(""),
  condition: z.string().default(""),
  reference: z.string().default(""),
});
export type PropertyParameter = z.infer<typeof propertyParameterSchema>;

/** Column attribute descriptor defining data structure, constraints, and masks for model properties. */
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
  defaultValue: z.unknown().optional(),
  enrichText: z.string().optional(),
  parameter: propertyParameterSchema.optional(),
});

export type ModelProperty = z.infer<typeof modelPropertySchema>;

/** Metamodel table definition record stored in the `MODEL.CONFIG` control table. */
export const modelConfigRecordSchema = z.object({
  recordId: z.string().optional(),
  tableName: z.string().min(1, "Table Name is required"),
  description: z.string().min(1, "Description is required"),
  prefix: z.string().default(""),
  servicePath: z.string().min(1, "Service Path is required"),
  userDefineId: z.boolean().default(false),
  access: z.string().min(1, "Table Type (Global / Branch) is required"),
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
  auditData: auditDataSchema.optional(),
});

export type ModelConfigRecord = z.infer<typeof modelConfigRecordSchema>;

/* -------------------------------------------------------------------------- */
/* Model Config Screen Validation Errors                                      */
/* -------------------------------------------------------------------------- */

/** Screen validation error mapped to tab headers and field serial numbers. */
export interface ValidationErrorItem {
  id: string;
  tab: "general" | "fields" | "audit";
  sn?: string;
  fieldKey: string;
  message: string;
}

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
export const propertyParameterOptionSchema = z
  .object({
    ID: z.string().optional(),
    id: z.string().optional(),
    ITEMCODE: z.string().optional(),
    itemCode: z.string().optional(),
    ITEMLABEL: z.string().optional(),
    itemLabel: z.string().optional(),
  })
  .passthrough()
  .transform((val) => ({
    ID: val.ID ?? val.id,
    ITEMCODE: val.ITEMCODE ?? val.itemCode ?? "",
    ITEMLABEL: val.ITEMLABEL ?? val.itemLabel ?? "",
  }));
export interface PropertyParameterOption {
  ID?: string;
  ITEMCODE: string;
  ITEMLABEL: string;
}

/** Parameter definition for Dropdown / Checkbox / Radio types */
export const propertyParameterSchema = z
  .object({
    TYPE: z.enum(["O", "M", ""]).optional(),
    type: z.enum(["O", "M", ""]).optional(),
    DATA: z.array(propertyParameterOptionSchema).optional(),
    data: z.array(propertyParameterOptionSchema).optional(),
    MODELNAME: z.string().optional(),
    modelName: z.string().optional(),
    DISPLAYFIELD: z.string().optional(),
    displayField: z.string().optional(),
    CONDITION: z.string().optional(),
    condition: z.string().optional(),
    REFERENCE: z.string().optional(),
    reference: z.string().optional(),
  })
  .passthrough()
  .transform((val) => ({
    TYPE: (val.TYPE ?? val.type ?? "O") as "O" | "M" | "",
    DATA: (val.DATA ?? val.data ?? []) as PropertyParameterOption[],
    MODELNAME: val.MODELNAME ?? val.modelName ?? "",
    DISPLAYFIELD: val.DISPLAYFIELD ?? val.displayField ?? "",
    CONDITION: val.CONDITION ?? val.condition ?? "",
    REFERENCE: val.REFERENCE ?? val.reference ?? "",
  }));
export type PropertyParameter = z.infer<typeof propertyParameterSchema>;

export type ModelProperty = {
  SN: string;
  NAME: string;
  LABEL: string;
  TYPE: PropertyType;
  STRUCTURE?: "S" | "M";
  LENGTH?: number;
  WIDTH?: number;
  REQUIRED?: boolean;
  DISABLED?: boolean;
  DEFAULTVALUE?: unknown;
  ENRICHTEXT?: string;
  PARAMETER?: PropertyParameter;
  PROP?: ModelProperty[];
};

/** Column attribute descriptor defining data structure, constraints, and masks for model properties. */
export const modelPropertySchema: z.ZodType<ModelProperty> = z.lazy(() =>
  z.object({
    SN: z.coerce.string(),
    NAME: z.string().min(1, "Field name is required"),
    LABEL: z.string().min(1, "Field label is required"),
    TYPE: propertyTypeSchema.default("Text"),
    STRUCTURE: z.enum(["S", "M"]).default("S"), // S = Single value, M = Multi-value
    LENGTH: z.number().default(50),
    WIDTH: z.number().optional(),
    REQUIRED: z.boolean().default(false),
    DISABLED: z.boolean().default(false),
    DEFAULTVALUE: z.unknown().optional(),
    ENRICHTEXT: z.string().optional(),
    PARAMETER: propertyParameterSchema.optional(),
    PROP: z.array(z.lazy(() => modelPropertySchema)).default([]),
  }),
);

/** Metamodel table definition record stored in the `MODEL.CONFIG` control table. */
export const modelConfigRecordSchema = z.object({
  TABLENAME: z.string().min(1, "Table Name is required"),
  DESCRIPTION: z.string().min(1, "Description is required"),
  PREFIX: z.string().default(""),
  SERVICEPATH: z.string().min(1, "Service Path is required"),
  USERDEFINEID: z.boolean().default(false),
  ACCESS: z.string().min(1, "Table Type (Global / Branch) is required"),
  SEARCHABLE: z.boolean().default(false),
  READONLY: z.boolean().default(false),
  AUTHORIZE: z.boolean().default(false),
  ASSOCIATES: z.array(z.string()).default([]),
  _DEVBY: z.string().default(""),
  _DEVDATE: z.string().default(""),
  IDDEF: z
    .object({
      IDPREFIX: z.string().default(""),
      IDPATTERN: z.string().default(""),
      SEQUENCELENGTH: z.union([z.number(), z.string()]).default("").optional(),
      SEQUENCERESET: z.boolean().default(false),
    })
    .default({ IDPREFIX: "", IDPATTERN: "", SEQUENCELENGTH: "", SEQUENCERESET: false }),
  PROPERTIES: z.array(modelPropertySchema).default([]),
  auditData: auditDataSchema.optional(),
});

export type ModelConfigRecord = z.infer<typeof modelConfigRecordSchema>;

/* -------------------------------------------------------------------------- */
/* Model Config Screen Validation Errors                                      */
/* -------------------------------------------------------------------------- */

/** Screen validation error mapped to tab headers and field serial numbers. */
export interface ValidationErrorItem {
  id: string;
  tab: "general" | "properties" | "audit";
  sn?: string;
  fieldKey: string;
  message: string;
}

import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. PHYSICAL DATABASE COLUMN TYPES (Canonical 7 Core Types)                 */
/* ========================================================================== */

/**
 * Canonical MODEL.CONFIG column types.
 * - **Comparisons** (`===`, `!==`, `case`) use this constant, never a string literal.
 * - **Declared values** (field-spec JSON such as `fields/*.ts`, objects built in code, mock rows)
 *   use the plain literal, e.g. `TYPE: "Array"`. The compiler still checks it against
 *   `PropertyType`, and the JSON stays copy-paste-ready for the CBS database.
 */
export const CBS_PROPERTY_TYPE = {
  STRING: "String",
  NUMBER: "Number",
  BOOLEAN: "Boolean",
  DATE: "Date",
  DATETIME: "DateTime",
  TIME: "Time",
  ARRAY: "Array",
} as const;

const propertyTypeSchema = z.enum(CBS_PROPERTY_TYPE);

/** Ordered list of column types (drives the MODEL.CONFIG type selector). */
export const PROPERTY_TYPES = propertyTypeSchema.options;
export type PropertyType = z.infer<typeof propertyTypeSchema>;

/** Canonical physical column structure types: Single ("S") vs Multi ("M"). */
export const CBS_PROPERTY_STRUCTURE = {
  SINGLE: "S",
  MULTI: "M",
} as const;

export const propertyStructureSchema = z.enum(CBS_PROPERTY_STRUCTURE);
export type PropertyStructure = z.infer<typeof propertyStructureSchema>;

/** Ordered list of column types allowed for nested sub-properties (excludes Array). */
export const SUB_PROPERTY_TYPES: readonly PropertyType[] = PROPERTY_TYPES.filter(
  (t) => t !== CBS_PROPERTY_TYPE.ARRAY,
);

/**
 * Canonical physical storage lengths for fixed-size database column types.
 * Types not listed here (String, Number) have variable lengths configured per column.
 */
export const FIXED_PROPERTY_LENGTHS: Readonly<Partial<Record<PropertyType, number>>> = {
  Date: 10,
  DateTime: 19,
  Time: 8,
  Boolean: 1,
  Array: 0,
};

/** Default physical column length when not explicitly specified. */
export const DEFAULT_PROPERTY_LENGTH = 50;

/**
 * Resolves the canonical physical column length for a given column type.
 * - Fixed-size types (Date, DateTime, Time, Boolean, Array) always return their exact physical length (e.g. Array -> 0).
 * - Variable-size types (String, Number) parse positive lengths or fall back to `fallback`.
 */
export function resolvePhysicalLength(
  type: PropertyType,
  rawLength?: unknown,
  fallback: number = DEFAULT_PROPERTY_LENGTH,
): number {
  const fixed = FIXED_PROPERTY_LENGTHS[type];
  if (fixed !== undefined) return fixed;

  const num = Math.floor(Number(rawLength));
  return Number.isFinite(num) && num > 0 ? num : fallback;
}

/**
 * Resolves effective field structure (Single "S" vs Multi "M"):
 * - Boolean is always strictly Single ("S").
 * - Physical DB Single ("S") can NEVER be widened to Multi ("M") on a form.
 * - Physical DB Multi ("M") MAY be narrowed to Single ("S") by a form override.
 */
export function resolvePhysicalStructure(
  type: PropertyType,
  modelStructure?: PropertyStructure,
  formStructure?: PropertyStructure,
): PropertyStructure {
  if (type === CBS_PROPERTY_TYPE.BOOLEAN) return CBS_PROPERTY_STRUCTURE.SINGLE;
  if (modelStructure === CBS_PROPERTY_STRUCTURE.SINGLE) return CBS_PROPERTY_STRUCTURE.SINGLE;
  if (modelStructure === CBS_PROPERTY_STRUCTURE.MULTI) {
    return formStructure === CBS_PROPERTY_STRUCTURE.SINGLE
      ? CBS_PROPERTY_STRUCTURE.SINGLE
      : CBS_PROPERTY_STRUCTURE.MULTI;
  }
  return formStructure === CBS_PROPERTY_STRUCTURE.MULTI
    ? CBS_PROPERTY_STRUCTURE.MULTI
    : CBS_PROPERTY_STRUCTURE.SINGLE;
}

/* ========================================================================== */
/* 2. BASE PHYSICAL FIELD SCHEMA (MODEL.CONFIG Pure Column DDL)               */
/* ========================================================================== */

export const baseFieldSchema = z.looseObject({
  SN: z.coerce.string().default(""),
  NAME: z
    .string()
    .trim()
    .min(1, "Property name is required")
    .regex(
      /^[a-zA-Z][a-zA-Z0-9_]*$/,
      "Property name must start with a letter and contain only letters and numbers",
    ),
  TYPE: propertyTypeSchema.default("String"),
  STRUCTURE: z
    .preprocess(
      (val) => (typeof val === "string" ? val.toUpperCase() : val),
      propertyStructureSchema,
    )
    .default(CBS_PROPERTY_STRUCTURE.SINGLE),
  LENGTH: z.coerce.number().default(DEFAULT_PROPERTY_LENGTH),
  REQUIRED: z
    .union([z.boolean(), z.null()])
    .transform((v) => Boolean(v))
    .default(false),
  MODELNAME: z
    .string()
    .trim()
    .default("")
    .transform((v) => v.toUpperCase()),
});

export type ModelProperty = z.infer<typeof baseFieldSchema> & {
  PROP?: ModelProperty[];
};

export const modelPropertySchema: z.ZodType<ModelProperty> = baseFieldSchema.extend({
  PROP: z.lazy(() => z.array(modelPropertySchema)).optional(),
});

/**
 * Canonical factory for creating a new ModelProperty draft with physical defaults.
 * Centralizes default initialization so new generic property fields only need one update here.
 */
export function createModelProperty(
  sn: string,
  overrides: Partial<ModelProperty> = {},
): ModelProperty {
  return {
    SN: sn,
    NAME: "",
    TYPE: CBS_PROPERTY_TYPE.STRING,
    STRUCTURE: "S",
    LENGTH: DEFAULT_PROPERTY_LENGTH,
    REQUIRED: false,
    MODELNAME: "",
    ...overrides,
  };
}

/* ========================================================================== */
/* 4. TABLE RECORD: MODEL CONFIG RECORD (MODEL.CONFIG)                        */
/* ========================================================================== */

const idDefSchema = z.object({
  IDPREFIX: z.string().default(""),
  SEQUENCELENGTH: z.union([z.number(), z.string()]).default(""),
  SEQUENCERESET: z.boolean().default(false),
  SEQRESETPERIOD: z.enum(["D", "M", "Y", ""]).default(""),
  IDPATTERN: z.string().default(""),
});

export const modelConfigRecordSchema = z.looseObject({
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
  /** Authorization levels a record needs; 0 = no authorization. Empty falls back to 1. */
  AUTHLEVEL: z
    .preprocess((v) => (v === "" || v === null ? undefined : v), z.coerce.number().optional())
    .default(1),
  SERVICEPATH: z.string().min(1, "Service Path is required"),
  IDDEF: z.preprocess((val) => val ?? {}, idDefSchema),
  PROPERTIES: z.array(modelPropertySchema).default([]),
  auditData: auditDataSchema.optional(),
});

export type ModelConfigRecord = z.infer<typeof modelConfigRecordSchema>;

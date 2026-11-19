import { z } from "zod";
import { auditDataSchema, SERVICE_NAME_PATTERN } from "./common-schema";

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

/** Default physical column lengths when not explicitly specified. */
export const DEFAULT_PROPERTY_LENGTH = 50;
export const DEFAULT_SUB_PROPERTY_LENGTH = 35;

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
  const parsed = typeof rawLength === "string" ? Number.parseInt(rawLength, 10) : rawLength;
  return typeof parsed === "number" && !Number.isNaN(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * Resolves effective field structure (Single "S" vs Multi "M"):
 * - Boolean is always strictly Single ("S").
 * - Physical DB Single ("S") can NEVER be widened to Multi ("M") on a form.
 * - Physical DB Multi ("M") MAY be narrowed to Single ("S") by a form override.
 */
export function resolvePhysicalStructure(
  type: PropertyType,
  modelStructure?: "S" | "M",
  formStructure?: "S" | "M",
): "S" | "M" {
  if (type === CBS_PROPERTY_TYPE.BOOLEAN) return "S";
  if (modelStructure === "S") return "S";
  if (modelStructure === "M") return formStructure === "S" ? "S" : "M";
  return formStructure === "M" ? "M" : "S";
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
      /^[a-z][a-zA-Z0-9]*$/,
      "Property name must be in camelCase (e.g. accountType, customerName)",
    ),
  TYPE: propertyTypeSchema.default("String"),
  STRUCTURE: z
    .preprocess((val) => (typeof val === "string" ? val.toUpperCase() : val), z.enum(["S", "M"]))
    .default("S"),
  LENGTH: z.coerce.number().default(DEFAULT_PROPERTY_LENGTH),
  REQUIRED: z
    .union([z.boolean(), z.null()])
    .transform((v) => Boolean(v))
    .default(false)
    .optional(),
  MODELNAME: z
    .string()
    .trim()
    .default("")
    .transform((v) => v.toUpperCase())
    .optional(),
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
    TYPE: "String",
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
  SEQUENCELENGTH: z.union([z.number(), z.string()]).default("").optional(),
  SEQUENCERESET: z.boolean().default(false),
  IDPATTERN: z.string().default(""),
});

export const modelConfigRecordSchema = z
  .looseObject({
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
    IDDEF: idDefSchema
      .nullable()
      .transform(
        (val) =>
          val ?? {
            IDPREFIX: "",
            SEQUENCELENGTH: "",
            SEQUENCERESET: false,
            IDPATTERN: "",
          },
      )
      .default({
        IDPREFIX: "",
        SEQUENCELENGTH: "",
        SEQUENCERESET: false,
        IDPATTERN: "",
      }),
    PROPERTIES: z.array(modelPropertySchema).default([]),
    IDROUTINE: z.string().default("").optional(),
    FIELDBASED: z.boolean().default(false).optional(),
    auditData: auditDataSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const seenNames = new Set<string>();

    data.PROPERTIES.forEach((prop, idx) => {
      const nameLower = (prop.NAME || "").trim().toLowerCase();
      if (nameLower) {
        if (seenNames.has(nameLower)) {
          ctx.addIssue({
            code: "custom",
            message: `Duplicate column name "${prop.NAME}". Each property must have a unique name.`,
            path: ["PROPERTIES", idx, "NAME"],
          });
        }
        seenNames.add(nameLower);
      }

      const modelName = (prop.MODELNAME || "").trim();
      if (modelName) {
        if (prop.TYPE !== CBS_PROPERTY_TYPE.STRING) {
          ctx.addIssue({
            code: "custom",
            message: `Property "${prop.NAME || `#${prop.SN}`}" cannot define MODELNAME. MODELNAME is supported only on String properties.`,
            path: ["PROPERTIES", idx, "MODELNAME"],
          });
        }
        if (!/^[A-Z0-9_.]+$/.test(modelName)) {
          ctx.addIssue({
            code: "custom",
            message: `Property "${prop.NAME || `#${prop.SN}`}" has invalid MODELNAME "${modelName}". Must be alphanumeric uppercase with optional dots or underscores.`,
            path: ["PROPERTIES", idx, "MODELNAME"],
          });
        }
      }

      if (Array.isArray(prop.PROP)) {
        const seenSubNames = new Set<string>();
        prop.PROP.forEach((sub, sIdx) => {
          if (sub.TYPE === CBS_PROPERTY_TYPE.ARRAY) {
            ctx.addIssue({
              code: "custom",
              message: `Sub-property "${sub.NAME || `#${sub.SN}`}" cannot be of type Array. Nested arrays are not supported.`,
              path: ["PROPERTIES", idx, "PROP", sIdx, "TYPE"],
            });
          }
          const subModelName = (sub.MODELNAME || "").trim();
          if (subModelName) {
            if (sub.TYPE !== CBS_PROPERTY_TYPE.STRING) {
              ctx.addIssue({
                code: "custom",
                message: `Sub-property "${sub.NAME || `#${sub.SN}`}" cannot define MODELNAME. MODELNAME is supported only on String properties.`,
                path: ["PROPERTIES", idx, "PROP", sIdx, "MODELNAME"],
              });
            }
            if (!/^[A-Z0-9_.]+$/.test(subModelName)) {
              ctx.addIssue({
                code: "custom",
                message: `Sub-property "${sub.NAME || `#${sub.SN}`}" has invalid MODELNAME "${subModelName}". Must be alphanumeric uppercase with optional dots or underscores.`,
                path: ["PROPERTIES", idx, "PROP", sIdx, "MODELNAME"],
              });
            }
          }
          const subNameLower = (sub.NAME || "").trim().toLowerCase();
          if (subNameLower) {
            if (seenSubNames.has(subNameLower)) {
              ctx.addIssue({
                code: "custom",
                message: `Duplicate sub-property name "${sub.NAME}" in "${prop.NAME}". Each sub-property must have a unique name.`,
                path: ["PROPERTIES", idx, "PROP", sIdx, "NAME"],
              });
            }
            seenSubNames.add(subNameLower);
          }
        });
      }
    });
  });

export type ModelConfigRecord = z.infer<typeof modelConfigRecordSchema>;

/* ========================================================================== */
/* 5. SAVE RULES (SMC): what may be written to MODEL.CONFIG                   */
/* ========================================================================== */

const TABLE_NAME_PATTERN = /^[A-Z][A-Z0-9_.]*$/;
const MODEL_ACCESS_CODES: readonly string[] = ["G", "B"];

const isPositiveInteger = (v: unknown): boolean => Number.isInteger(Number(v)) && Number(v) > 0;

/** Variable-length columns (String, Number) need a positive length. */
function checkPropertyLength(
  prop: ModelProperty,
  path: (string | number)[],
  ctx: z.RefinementCtx,
): void {
  if (FIXED_PROPERTY_LENGTHS[prop.TYPE] === undefined && !isPositiveInteger(prop.LENGTH)) {
    ctx.addIssue({
      code: "custom",
      message: `Property "${prop.NAME || `#${prop.SN}`}" needs a length greater than 0.`,
      path: [...path, "LENGTH"],
    });
  }
}

/**
 * The record schema plus the rules a save must meet. Reads (GMC, GFC) and browser drafts stay on
 * `modelConfigRecordSchema`, so a stored model that predates a rule still loads.
 * Used by the MODEL.CONFIG screen before saving and by `/api/proxy` on every SMC.
 */
export const modelConfigSaveSchema = modelConfigRecordSchema.superRefine((data, ctx) => {
  if (!TABLE_NAME_PATTERN.test(data.TABLENAME)) {
    ctx.addIssue({
      code: "custom",
      message:
        "Table Name must be uppercase letters, digits, dots or underscores (e.g. ACCOUNT, USER.MGT).",
      path: ["TABLENAME"],
    });
  }
  if (!MODEL_ACCESS_CODES.includes(data.ACCESS)) {
    ctx.addIssue({
      code: "custom",
      message: "Table Type must be G (Global) or B (Branch).",
      path: ["ACCESS"],
    });
  }
  if (!SERVICE_NAME_PATTERN.test(data.SERVICEPATH)) {
    ctx.addIssue({
      code: "custom",
      message: "Service Path must be a service name: letters and digits (e.g. default, finxurm).",
      path: ["SERVICEPATH"],
    });
  }
  if (!Number.isInteger(data.AUTHLEVEL) || data.AUTHLEVEL < 0) {
    ctx.addIssue({
      code: "custom",
      message: "Authorization Level must be a whole number of 0 or more (0 = no authorization).",
      path: ["AUTHLEVEL"],
    });
  }
  const sequenceLength = data.IDDEF.SEQUENCELENGTH;
  if (sequenceLength !== undefined && sequenceLength !== "" && !isPositiveInteger(sequenceLength)) {
    ctx.addIssue({
      code: "custom",
      message: "Sequence Length must be a whole number greater than 0.",
      path: ["IDDEF", "SEQUENCELENGTH"],
    });
  }
  if (data.PROPERTIES.length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "At least one column/property must be configured in the data dictionary.",
      path: ["PROPERTIES"],
    });
  }
  data.PROPERTIES.forEach((prop, idx) => {
    checkPropertyLength(prop, ["PROPERTIES", idx], ctx);
    prop.PROP?.forEach((sub, sIdx) => {
      checkPropertyLength(sub, ["PROPERTIES", idx, "PROP", sIdx], ctx);
    });
  });
});

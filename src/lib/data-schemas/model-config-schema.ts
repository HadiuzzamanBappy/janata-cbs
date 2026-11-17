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
  /** Repeating group of nested sub-properties (`PROP`); stored with LENGTH 0. */
  ARRAY: "Array",
} as const;

const propertyTypeSchema = z.enum(CBS_PROPERTY_TYPE);

/** Ordered list of column types (drives the MODEL.CONFIG type selector). */
export const PROPERTY_TYPES = propertyTypeSchema.options;

export type PropertyType = z.infer<typeof propertyTypeSchema>;

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
  LENGTH: z.coerce.number().default(50),
  REQUIRED: z
    .union([z.boolean(), z.null()])
    .transform((v) => Boolean(v))
    .default(false)
    .optional(),
});

export type ModelProperty = z.infer<typeof baseFieldSchema> & {
  PROP?: ModelProperty[];
};

export const modelPropertySchema: z.ZodType<ModelProperty> = baseFieldSchema.extend({
  PROP: z.lazy(() => z.array(modelPropertySchema)).optional(),
});

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
    AUTHORIZE: z.boolean().default(false),
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
    });
  });

export type ModelConfigRecord = z.infer<typeof modelConfigRecordSchema>;

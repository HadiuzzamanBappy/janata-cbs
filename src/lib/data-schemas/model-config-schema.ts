import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. PHYSICAL DATABASE COLUMN TYPES (Base Model Types)                       */
/* ========================================================================== */

export const propertyTypeSchema = z.enum([
  "Text",
  "Number",
  "Amount",
  "Rate",
  "Date",
  "DateTime",
  "Boolean",
  "Object",
]);
export type PropertyType = z.infer<typeof propertyTypeSchema>;
export const PROPERTY_TYPES = propertyTypeSchema.options;

/* ========================================================================== */
/* 2. PARAMETER / LOOKUP CONTRACT                                             */
/* ========================================================================== */

export const parameterOptionItemSchema = z.union([
  z.object({
    itemCode: z.string().min(1, "itemCode is required"),
    itemLabel: z.string().min(1, "itemLabel is required"),
  }),
  z.object({
    code: z.string().min(1, "code is required"),
    label: z.string().min(1, "label is required"),
  }),
]);
export type ParameterOptionItem =
  | { itemCode: string; itemLabel: string; code?: string; label?: string }
  | { code: string; label: string; itemCode?: string; itemLabel?: string };

export const formFieldParameterSchema = z.looseObject({
  type: z.string().default("O"),
  data: z.array(parameterOptionItemSchema).default([]).optional(),
  modelName: z.string().default("").optional(),
  codeField: z.string().default("").optional(),
  displayField: z.string().default("").optional(),
  condition: z.string().default("").optional(),
  reference: z.string().default("").optional(),
});
export type FormFieldParameter = z.infer<typeof formFieldParameterSchema>;

/* ========================================================================== */
/* 3. BASE PHYSICAL FIELD & PROPERTY SCHEMA (MODEL.CONFIG Column Definition)  */
/* ========================================================================== */

export const baseFieldSchema = z.looseObject({
  SN: z.coerce.string().default(""),
  NAME: z
    .string()
    .trim()
    .min(1, "Field name is required")
    .regex(
      /^[a-zA-Z_][a-zA-Z0-9_]*$/,
      "Field name must begin with a letter or underscore and contain only alphanumeric characters or underscores",
    ),
  LABEL: z.string().trim().min(1, "Field label is required"),
  TYPE: propertyTypeSchema.default("Text"),
  STRUCTURE: z
    .preprocess((val) => (typeof val === "string" ? val.toUpperCase() : val), z.enum(["S", "M"]))
    .default("S"),
  LENGTH: z.coerce.number().default(50),
  REQUIRED: z
    .union([z.boolean(), z.null()])
    .transform((v) => Boolean(v))
    .default(false)
    .optional(),
  PARAMETER: formFieldParameterSchema.optional(),
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

export const idDefSchema = z.object({
  IDPREFIX: z.string().default(""),
  SEQUENCELENGTH: z.union([z.number(), z.string()]).default("").optional(),
  SEQUENCERESET: z.boolean().default(false),
  IDPATTERN: z.string().default(""),
});

export type IdDef = z.infer<typeof idDefSchema>;

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

      // Check Model Lookup target model
      if (prop.PARAMETER?.type === "M") {
        if (!prop.PARAMETER.modelName?.trim()) {
          ctx.addIssue({
            code: "custom",
            message: "Target model name is required for Model Lookup.",
            path: ["PROPERTIES", idx, "PARAMETER", "modelName"],
          });
        }
      }

      // Check Options List items have valid itemCode and itemLabel
      if (prop.PARAMETER?.type === "O") {
        const optData = Array.isArray(prop.PARAMETER.data) ? prop.PARAMETER.data : [];
        if (optData.length === 0) {
          ctx.addIssue({
            code: "custom",
            message: "At least one option must be defined for Options List (O).",
            path: ["PROPERTIES", idx, "PARAMETER", "data"],
          });
        } else {
          optData.forEach((item: unknown, itemIdx: number) => {
            if (typeof item === "object" && item !== null) {
              const rec = item as Record<string, unknown>;
              const itemCode = String(rec.itemCode ?? "").trim();
              const itemLabel = String(rec.itemLabel ?? "").trim();
              if (!itemCode || !itemLabel) {
                ctx.addIssue({
                  code: "custom",
                  message: `Option #${itemIdx + 1} must have non-empty itemCode and itemLabel.`,
                  path: ["PROPERTIES", idx, "PARAMETER", "data", itemIdx],
                });
              }
            } else {
              ctx.addIssue({
                code: "custom",
                message: `Option #${itemIdx + 1} must be an object with itemCode and itemLabel.`,
                path: ["PROPERTIES", idx, "PARAMETER", "data", itemIdx],
              });
            }
          });
        }
      }
    });
  });

export type ModelConfigRecord = z.infer<typeof modelConfigRecordSchema>;

import { z } from "zod";
import { auditDataSchema } from "./common-schema";
import { baseFieldSchema } from "./form-engine-schema";

/* ========================================================================== */
/* 1. FIELD PROPERTY (Physical Database Column)                               */
/* ========================================================================== */

export const baseModelPropertySchema = baseFieldSchema;

export type ModelProperty = z.infer<typeof baseModelPropertySchema> & {
  PROP?: ModelProperty[];
};

export const modelPropertySchema: z.ZodType<ModelProperty> = baseModelPropertySchema.extend({
  PROP: z.lazy(() => z.array(modelPropertySchema)).optional(),
});

/* ========================================================================== */
/* 2. TABLE RECORD: MODEL CONFIG RECORD (MODEL.CONFIG)                        */
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
            code: z.ZodIssueCode.custom,
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
            code: z.ZodIssueCode.custom,
            message: "Target model name is required for Model Lookup.",
            path: ["PROPERTIES", idx, "PARAMETER", "modelName"],
          });
        }
      }

      // Check Options List items have valid itemCode and itemLabel
      if (prop.PARAMETER?.type === "O") {
        const data = Array.isArray(prop.PARAMETER.data) ? prop.PARAMETER.data : [];
        if (data.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "At least one option must be defined for Options List (O).",
            path: ["PROPERTIES", idx, "PARAMETER", "data"],
          });
        } else {
          data.forEach((item: unknown, itemIdx: number) => {
            if (typeof item === "object" && item !== null) {
              const rec = item as Record<string, unknown>;
              const itemCode = String(rec.itemCode ?? "").trim();
              const itemLabel = String(rec.itemLabel ?? "").trim();
              if (!itemCode || !itemLabel) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: `Option #${itemIdx + 1} must have non-empty itemCode and itemLabel.`,
                  path: ["PROPERTIES", idx, "PARAMETER", "data", itemIdx],
                });
              }
            } else {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
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

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

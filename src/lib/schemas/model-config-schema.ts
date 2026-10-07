import { z } from "zod";

/* -------------------------------------------------------------------------- */
/* Raw Wire Schemas for SYS_MODEL_DEFINITION / MODEL.CONFIG                    */
/* -------------------------------------------------------------------------- */

export const rawModelPropertySchema = z.object({
  NAME: z.string().optional(),
  LABEL: z.string().optional(),
  TYPE: z.string().optional(),
  LENGTH: z.union([z.number(), z.string()]).optional(),
  STRUCTURE: z.enum(["S", "M"]).default("S"),
  REQUIRED: z.union([z.boolean(), z.string()]).optional(),
  DISABLED: z.union([z.boolean(), z.string()]).optional(),
  WIDTH: z.union([z.number(), z.string()]).optional(),
  POSITION: z.string().optional(),
  PARAMETER: z.any().optional(),
  ENRICHTEXT: z.string().optional(),
  VALUE: z.any().optional(),
  ISOPEN: z.boolean().optional(),
  ISLOADING: z.boolean().optional(),
  PROP: z.array(z.any()).optional(),
  DATASOURCE: z.array(z.string()).optional(),
  SN: z.union([z.number(), z.string()]).optional(),
});

export type RawModelProperty = z.infer<typeof rawModelPropertySchema>;

export const rawModelConfigSchema = z.object({
  _DEVBY: z.string().optional(),
  _DEVDATE: z.string().optional(),
  DESCRIPTION: z.string().optional(),
  PREFIX: z.string().optional(),
  TABLENAME: z.string(),
  USERDEFINEID: z.boolean().optional(),
  ACCESS: z.string().optional(),
  READONLY: z.boolean().optional(),
  SEARCHABLE: z.boolean().optional(),
  ASSOCIATES: z.array(z.string()).optional(),
  AUTHORIZE: z.boolean().optional(),
  SERVICEPATH: z.string().optional(),
  IDDEF: z
    .object({
      IDPREFIX: z.string().optional(),
      SEQUENCELENGTH: z.union([z.number(), z.string()]).optional(),
      SEQUENCERESET: z.boolean().optional(),
      IDPATTERN: z.string().optional(),
    })
    .optional(),
  PROPERTIES: z.array(rawModelPropertySchema).optional(),
  PREDIFINEID: z.boolean().optional(),
  auditData: z
    .object({
      recStatus: z.string().optional(),
      recCurrNumber: z.union([z.number(), z.string()]).optional(),
      recInputter: z.string().optional(),
      recInputTime: z.string().optional(),
      recAuthorizer: z.string().optional(),
      recAuthTime: z.string().optional(),
      recBranchCode: z.string().optional(),
    })
    .optional(),
});

export type RawModelConfig = z.infer<typeof rawModelConfigSchema>;

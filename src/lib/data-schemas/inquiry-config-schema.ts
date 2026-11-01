import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. SELECTION / FILTER FIELDS (INQSelectField)                              */
/* ========================================================================== */

export const inqSelectFieldSchema = z.object({
  selectFieldName: z.string().min(1, "Field name is required"),
  selectFieldType: z
    .string()
    .nullish()
    .transform((v) => v ?? "text"),
  selectFieldOperator: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  selectFieldOperatorFixed: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  selectFieldDisplay: z.string().min(1, "Display label is required"),
  selectFieldValue: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  selectFieldRequired: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false),
});

export type INQSelectField = z.infer<typeof inqSelectFieldSchema>;

/* ========================================================================== */
/* 2. COLUMN DEFINITION (INQDef)                                             */
/* ========================================================================== */

export const inqDefSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  fieldType: z
    .string()
    .nullish()
    .transform((v) => v ?? "CH"),
  fieldFunc: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  fieldRowCol: z
    .string()
    .nullish()
    .transform((v) => v ?? "1,1"),
  fieldLength: z
    .string()
    .nullish()
    .transform((v) => v ?? "20,L"),
  fieldDisplay: z.string().min(1, "Display header is required"),
  dataPassable: z.union([z.string(), z.boolean()]).nullish().default(null),
});

export type INQDef = z.infer<typeof inqDefSchema>;

/* ========================================================================== */
/* 3. COMMAND ACTIONS (INQCmds)                                               */
/* ========================================================================== */

export const inqCmdSchema = z.object({
  cmdFor: z.string().min(1, "Command target is required"),
  cmdButton: z.string().min(1, "Button label is required"),
});

export type INQCmd = z.infer<typeof inqCmdSchema>;

/* ========================================================================== */
/* 4. GENERAL INQUIRY INFO (INQInfo)                                          */
/* ========================================================================== */

export const inqInfoSchema = z.object({
  description: z.string().min(1, "Description is required"),
  pageOrientation: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  perpageItem: z
    .union([z.string(), z.number()])
    .nullish()
    .transform((val) => (val != null ? String(val) : "30")),
  showSerial: z
    .boolean()
    .nullish()
    .transform((v) => v ?? true),
  showPagination: z
    .boolean()
    .nullish()
    .transform((v) => v ?? true),
  showBranchWise: z
    .boolean()
    .nullish()
    .transform((v) => v ?? false),
  inqType: z
    .string()
    .nullish()
    .transform((v) => v ?? "DFT"),
  controllerName: z.string().min(1, "Target controller/table is required"),
  rptControllerName: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  fixedSelection: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  inqServicePath: z
    .string()
    .nullish()
    .transform((v) => v ?? "default"),
  cmdFromInternal: z.string().nullish().default(null),
  cmdFieldName: z.string().nullish().default(null),
});

export type INQInfo = z.infer<typeof inqInfoSchema>;

/* ========================================================================== */
/* 5. CANONICAL INQUIRY RECORD SCHEMA (INQUIRY / INQUIRY.CONFIG)              */
/* ========================================================================== */

/**
 * 1:1 Canonical CBS Wire Data Schema matching actual backend response payloads.
 */
export const inquiryConfigRecordSchema = z.object({
  recordId: z.string().optional(),
  INQInfo: inqInfoSchema,
  INQSelectField: z
    .array(inqSelectFieldSchema)
    .nullish()
    .transform((v) => v ?? []),
  INQDef: z
    .array(inqDefSchema)
    .nullish()
    .transform((v) => v ?? []),
  INQCmds: z
    .array(inqCmdSchema)
    .nullish()
    .transform((v) => v ?? []),
  auditData: auditDataSchema.optional(),
});

export type InquiryConfigRecord = z.infer<typeof inquiryConfigRecordSchema>;

/* ========================================================================== */
/* 6. DATASET ROW / RESULT SCHEMA                                             */
/* ========================================================================== */

export const enquiryRowSchema = z.looseObject({
  id: z.string(),
});

export type EnquiryRow = z.infer<typeof enquiryRowSchema> & {
  [key: string]: unknown;
};

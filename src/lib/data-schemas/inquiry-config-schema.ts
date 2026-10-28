import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. SELECTION / FILTER FIELDS (INQSelectField)                              */
/* ========================================================================== */

export const inqSelectFieldSchema = z.object({
  selectFieldName: z.string().min(1, "Field name is required"),
  selectFieldType: z.string().default("text"),
  selectFieldOperator: z.string().default(""),
  selectFieldOperatorFixed: z.string().default(""),
  selectFieldDisplay: z.string().min(1, "Display label is required"),
  selectFieldValue: z.string().default(""),
  selectFieldRequired: z.boolean().default(false),
});

export type INQSelectField = z.infer<typeof inqSelectFieldSchema>;

/* ========================================================================== */
/* 2. COLUMN DEFINITION (INQDef)                                             */
/* ========================================================================== */

export const inqDefSchema = z.object({
  fieldName: z.string().min(1, "Field name is required"),
  fieldType: z.string().default("CH"),
  fieldFunc: z.string().default(""),
  fieldRowCol: z.string().default("1,1"),
  fieldLength: z.string().default("20,L"),
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
  pageOrientation: z.string().default(""),
  perpageItem: z.union([z.string(), z.number()]).transform(String).default("30"),
  showSerial: z.boolean().default(true),
  showPagination: z.boolean().default(true),
  showBranchWise: z.boolean().default(false),
  inqType: z.string().default("DFT"),
  controllerName: z.string().min(1, "Target controller/table is required"),
  rptControllerName: z.string().default(""),
  fixedSelection: z.string().default(""),
  inqServicePath: z.string().default("default"),
  cmdFromInternal: z.string().nullable().optional().default(null),
  cmdFieldName: z.string().nullable().optional().default(null),
});

export type INQInfo = z.infer<typeof inqInfoSchema>;

/* ========================================================================== */
/* 5. CANONICAL INQUIRY RECORD SCHEMA (INQUIRY / INQUIRY.CONFIG)              */
/* ========================================================================== */

/**
 * 1:1 Canonical CBS Wire Data Schema matching actual backend response payloads.
 */
export const inquiryConfigRecordSchema = z.object({
  auditData: auditDataSchema.optional(),
  INQInfo: inqInfoSchema,
  INQSelectField: z.array(inqSelectFieldSchema).default([]),
  INQDef: z.array(inqDefSchema).default([]),
  INQCmds: z.array(inqCmdSchema).default([]),
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

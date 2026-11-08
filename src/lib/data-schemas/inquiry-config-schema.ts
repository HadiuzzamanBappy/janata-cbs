import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* REUSABLE TRANSFORM PRIMITIVES                                              */
/* ========================================================================== */

const cbsString = (fallback = "") =>
  z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v.trim() : fallback));

const cbsBoolean = z
  .union([z.boolean(), z.string()])
  .nullish()
  .transform((v) => v === true || v === "true" || v === "Y")
  .default(false);

/* ========================================================================== */
/* 1. SELECTION / FILTER FIELDS (INQSelectField)                              */
/* ========================================================================== */

export const inqSelectFieldSchema = z.object({
  selectFieldName: cbsString(""),
  selectFieldDisplay: cbsString(""),
  selectFieldType: cbsString("text"),
  selectFieldOperator: cbsString("EQ"),
  selectFieldOperatorFixed: cbsString(""),
  selectFieldValue: cbsString(""),
  selectFieldRequired: cbsBoolean,
});

export type INQSelectField = z.infer<typeof inqSelectFieldSchema>;

/* ========================================================================== */
/* 2. COLUMN DEFINITION (INQDef)                                             */
/* ========================================================================== */

export const inqDefSchema = z.object({
  fieldName: cbsString(""),
  fieldDisplay: cbsString(""),
  fieldType: cbsString("DC"),
  fieldFunc: cbsString(""),
  fieldRowCol: cbsString("1,1"),
  fieldLength: cbsString("20,L"),
  dataPassable: z
    .union([z.string(), z.boolean()])
    .nullish()
    .transform((v) => (v == null ? null : v === true || v === "true" || v === "Y")),
});

export type INQDef = z.infer<typeof inqDefSchema>;

/* ========================================================================== */
/* 3. COMMAND ACTIONS (INQCmds)                                               */
/* ========================================================================== */

export const inqCmdSchema = z.object({
  cmdFor: cbsString(""),
  cmdButton: cbsString(""),
});

export type INQCmd = z.infer<typeof inqCmdSchema>;

/* ========================================================================== */
/* 4. GENERAL INQUIRY INFO (INQInfo)                                          */
/* ========================================================================== */

export const inqInfoSchema = z.object({
  controllerName: cbsString(""),
  description: cbsString(""),
  pageOrientation: cbsString("Portrait"),
  perpageItem: z
    .union([z.string(), z.number()])
    .nullish()
    .transform((val) => (val != null && String(val).trim() !== "" ? String(val) : "30")),
  showSerial: cbsBoolean,
  showPagination: cbsBoolean,
  showBranchWise: cbsBoolean,
  inqType: cbsString("DFT"),
  rptControllerName: cbsString(""),
  fixedSelection: cbsString(""),
  inqServicePath: cbsString("default"),
  cmdFromInternal: cbsBoolean,
  cmdFieldName: cbsString(""),
});

export type INQInfo = z.infer<typeof inqInfoSchema>;

/* ========================================================================== */
/* 5. CANONICAL INQUIRY RECORD SCHEMA (INQUIRY / INQUIRY.CONFIG)              */
/* ========================================================================== */

export const inquiryConfigRecordSchema = z.object({
  INQInfo: inqInfoSchema.default(() => inqInfoSchema.parse({})),
  INQSelectField: z.array(inqSelectFieldSchema).default([]),
  INQDef: z.array(inqDefSchema).default([]),
  INQCmds: z.array(inqCmdSchema).default([]),
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

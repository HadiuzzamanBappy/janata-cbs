import { z } from "zod";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. SELECTION CRITERIA OPERANDS & FIELD TYPES                               */
/* ========================================================================== */

export const INQUIRY_OPERANDS = [
  "EQ",
  "NE",
  "GT",
  "GE",
  "LT",
  "LE",
  "RG",
  "CT",
  "SW",
  "EW",
  "LK",
] as const;

export type SelectionOperand = (typeof INQUIRY_OPERANDS)[number];
export const INQUIRY_OPERAND_SET = new Set<string>(INQUIRY_OPERANDS);

export const INQUIRY_FIELD_TYPES = ["text", "number", "date", "select"] as const;
export type InquiryFieldType = (typeof INQUIRY_FIELD_TYPES)[number];
export const INQUIRY_FIELD_TYPE_SET = new Set<string>(INQUIRY_FIELD_TYPES);

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

export const selectionOperandSchema = z
  .string()
  .nullish()
  .transform((v) => {
    const clean = v?.trim().toUpperCase();
    return clean && INQUIRY_OPERAND_SET.has(clean) ? (clean as SelectionOperand) : "EQ";
  })
  .pipe(z.enum(INQUIRY_OPERANDS));

export const inquiryFieldTypeSchema = z
  .string()
  .nullish()
  .transform((v) => {
    const clean = v?.trim().toLowerCase();
    return clean && INQUIRY_FIELD_TYPE_SET.has(clean) ? (clean as InquiryFieldType) : "text";
  })
  .pipe(z.enum(INQUIRY_FIELD_TYPES));

/* ========================================================================== */
/* 2. SELECTION / FILTER FIELDS (INQSelectField)                              */
/* ========================================================================== */

export const inqSelectFieldSchema = z.object({
  selectFieldName: cbsString(""),
  selectFieldDisplay: cbsString(""),
  selectFieldType: inquiryFieldTypeSchema.default("text"),
  selectFieldOperator: selectionOperandSchema.default("EQ"),
  selectFieldOperatorFixed: cbsString(""),
  selectFieldValue: cbsString(""),
  selectFieldRequired: cbsBoolean,
});

export type INQSelectField = z.infer<typeof inqSelectFieldSchema>;

/* ========================================================================== */
/* 3. COLUMN DEFINITION (INQDef)                                              */
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
/* 4. COMMAND ACTIONS (INQCmds)                                               */
/* ========================================================================== */

export const inqCmdSchema = z.object({
  cmdFor: cbsString(""),
  cmdButton: cbsString(""),
});

export type INQCmd = z.infer<typeof inqCmdSchema>;

/* ========================================================================== */
/* 5. GENERAL INQUIRY INFO (INQInfo)                                          */
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
/* 6. CANONICAL INQUIRY RECORD SCHEMA (INQUIRY / INQUIRY.CONFIG)              */
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
/* 7. RUNTIME QUERY PROTOCOL SCHEMAS & TYPES                                  */
/* ========================================================================== */

export const inquiryCriteriaParamSchema = z.object({
  selectFieldName: z.string().trim().min(1, "Field name is required"),
  selectFieldType: inquiryFieldTypeSchema.default("text"),
  selectFieldOperator: selectionOperandSchema.default("EQ"),
  selectFieldValue: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v.trim() : "")),
});

export interface InquiryCriteriaParam {
  selectFieldName: string;
  selectFieldType?: InquiryFieldType;
  selectFieldOperator?: SelectionOperand;
  selectFieldValue?: string;
}

export const inquiryExecuteOptionsSchema = z.object({
  queryString: z.array(inquiryCriteriaParamSchema).default([]),
  curPage: z.number().int().positive().default(1),
  perPage: z.number().int().positive().default(1000),
  servicePath: z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? v.trim() : undefined)),
});

export interface InquiryExecuteOptions {
  queryString?: InquiryCriteriaParam[];
  curPage?: number;
  perPage?: number;
  servicePath?: string;
}

/* ========================================================================== */
/* 8. DATASET ROW / RESULT SCHEMA                                             */
/* ========================================================================== */

export const enquiryRowSchema = z
  .looseObject({
    id: z.string().nullish(),
    recordId: z.string().nullish(),
  })
  .transform((row) => {
    const canonicalId = (row.id?.trim() || row.recordId?.trim() || "") as string;
    return {
      ...row,
      id: canonicalId,
      recordId: (row.recordId?.trim() || canonicalId) as string,
    };
  });

export type EnquiryRow = {
  id: string;
  recordId: string;
  [key: string]: unknown;
};

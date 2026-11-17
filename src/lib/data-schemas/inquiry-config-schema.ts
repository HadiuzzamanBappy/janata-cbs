import { z } from "zod";
import type { CbsInquiryStep } from "@/types";
import { auditDataSchema } from "./common-schema";

/* ========================================================================== */
/* 1. SELECTION CRITERIA OPERANDS & FIELD TYPES                               */
/* ========================================================================== */

const INQUIRY_OPERANDS = [
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

const INQUIRY_FIELD_TYPES = ["text", "number", "date", "select"] as const;
export type InquiryFieldType = (typeof INQUIRY_FIELD_TYPES)[number];

const selectionOperandSchema = z.enum(INQUIRY_OPERANDS);
const inquiryFieldTypeSchema = z.enum(INQUIRY_FIELD_TYPES);

/* ========================================================================== */
/* 2. SELECTION / FILTER FIELDS (INQSelectField)                              */
/* ========================================================================== */

const inqSelectFieldSchema = z.object({
  selectFieldName: z.string().default(""),
  selectFieldDisplay: z.string().default(""),
  selectFieldType: inquiryFieldTypeSchema.default("text"),
  selectFieldOperator: selectionOperandSchema.default("EQ"),
  selectFieldOperatorFixed: z.string().default(""),
  selectFieldValue: z.string().default(""),
  selectFieldRequired: z.boolean().default(false),
});

export type INQSelectField = z.infer<typeof inqSelectFieldSchema>;

/* ========================================================================== */
/* 3. COLUMN DEFINITION (INQDef)                                              */
/* ========================================================================== */

const inqDefSchema = z.object({
  fieldName: z.string().default(""),
  fieldDisplay: z.string().default(""),
  fieldType: z.string().default("DC"),
  fieldFunc: z.string().default(""),
  fieldRowCol: z.string().default("1,1"),
  fieldLength: z.string().default("20,L"),
  dataPassable: z.boolean().default(false),
});

export type INQDef = z.infer<typeof inqDefSchema>;

/* ========================================================================== */
/* 4. COMMAND ACTIONS (INQCmds)                                               */
/* ========================================================================== */

const inqCmdSchema = z.object({
  cmdFor: z.string().default(""),
  cmdButton: z.string().default(""),
});

export type INQCmd = z.infer<typeof inqCmdSchema>;

/* ========================================================================== */
/* 5. GENERAL INQUIRY INFO (INQInfo)                                          */
/* ========================================================================== */

const inqInfoSchema = z.object({
  controllerName: z.string().default(""),
  description: z.string().default(""),
  pageOrientation: z.enum(["Portrait", "Landscape"]).default("Portrait"),
  perpageItem: z.string().default("30"),
  showSerial: z.boolean().default(false),
  showPagination: z.boolean().default(false),
  showBranchWise: z.boolean().default(false),
  inqType: z.string().default("DFT"),
  rptControllerName: z.string().default(""),
  fixedSelection: z.string().default(""),
  inqServicePath: z.string().default("default"),
  cmdFromInternal: z.boolean().default(false),
  cmdFieldName: z.string().default(""),
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

export interface InquiryCriteriaParam {
  selectFieldName: string;
  selectFieldType?: InquiryFieldType;
  selectFieldOperator?: SelectionOperand;
  selectFieldValue?: string;
}

/** One operator's filter input on the criteria screen, keyed by field name in `FilterCriteriaMap`. */
export interface FilterCriterion {
  value: string;
  operand: SelectionOperand;
}
export type FilterCriteriaMap = Record<string, FilterCriterion>;

/** Inquiry state persisted on a workbench tab and carried across popups / dock-backs. */
export interface InquiryTabState {
  step?: CbsInquiryStep;
  criteria?: FilterCriteriaMap;
  currentPage?: number;
  pageSize?: number;
}

export interface InquiryExecuteOptions {
  queryString?: InquiryCriteriaParam[];
  curPage?: number;
  perPage?: number;
  servicePath?: string;
  inqType?: string;
}

/* ========================================================================== */
/* 8. DATASET ROW / RESULT SCHEMA                                             */
/* ========================================================================== */

export const inquiryRowSchema = z
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

export type InquiryRow = {
  id: string;
  recordId: string;
  [key: string]: unknown;
};

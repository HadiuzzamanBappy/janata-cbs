import { z } from "zod";
import type { CbsInquiryStep } from "@/types";
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

const INQUIRY_FIELD_TYPES = ["text", "number", "date", "select"] as const;
export type InquiryFieldType = (typeof INQUIRY_FIELD_TYPES)[number];

const selectionOperandSchema = z.enum(INQUIRY_OPERANDS);
const inquiryFieldTypeSchema = z.enum(INQUIRY_FIELD_TYPES);

const OPERAND_SET: ReadonlySet<string> = new Set(INQUIRY_OPERANDS);
/** Pattern-match operands only make sense on text filters. */
const TEXT_ONLY_OPERANDS: ReadonlySet<SelectionOperand> = new Set(["CT", "SW", "EW", "LK"]);

/** Narrows any string to a known operand (case-sensitive: operands are stored upper-case). */
export function isSelectionOperand(value: string): value is SelectionOperand {
  return OPERAND_SET.has(value);
}

/** Whether a filter of this type accepts the operand (pattern operands are text-only). */
export function isOperandAllowed(type: InquiryFieldType, operand: SelectionOperand): boolean {
  return type === "text" || !TEXT_ONLY_OPERANDS.has(operand);
}

/** Filter and column names the core accepts: letters, digits, `_` and `.` (e.g. `auditData.recStatus`). */
export const INQUIRY_FIELD_NAME_PATTERN = /^[A-Za-z0-9_.]+$/;

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

/** `<SCREEN[,VERSION]> <RIDASHL function> [row field...]`, e.g. `USERS,NEWUSER I empBankId`. */
const COMMAND_PATTERN = /^\S+\s+[RIDASHL](\s+\S+)*$/;

/** Whether a command (a template or a row-supplied command) has the `SCREEN FUNCTION [...]` shape. */
export function isInquiryCommand(command: string): boolean {
  return COMMAND_PATTERN.test(command.trim());
}

/** Command tokens that always resolve to the row's primary key. */
export const INQUIRY_ID_TOKENS: readonly string[] = ["@ID", "RECORDID", "ID"];

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
/* 7. RUNTIME QUERY PROTOCOL (browser -> /api/proxy -> core)                  */
/* ========================================================================== */

/** Filter field of branch-wise inquiries. `/api/proxy` adds it, pinned to the session's branch. */
export const INQUIRY_BRANCH_FIELD = "branchCode";

/** Most rows one inquiry run returns. The proxy asks the core for this many and trims the rest. */
export const INQUIRY_MAX_ROWS = 5000;

/** One condition of the core's `queryString`, as `/api/proxy` composes it. */
export interface InquiryCriteriaParam {
  selectFieldName: string;
  selectFieldType: InquiryFieldType;
  selectFieldOperator: SelectionOperand;
  selectFieldValue: string;
  [key: string]: unknown;
}

/** One of the operator's filter values, as the browser sends it. Name, type and lock come from the config. */
const inquiryOperatorCriterionSchema = z.looseObject({
  selectFieldName: z
    .string()
    .trim()
    .regex(INQUIRY_FIELD_NAME_PATTERN, "Filter field names are letters, digits, _ and ."),
  selectFieldOperator: selectionOperandSchema,
  selectFieldValue: z.string().trim().min(1, "A filter value is required"),
});

export type InquiryOperatorCriterion = z.infer<typeof inquiryOperatorCriterionSchema>;

/**
 * `data` of an INQ request. The browser sends the inquiry ID (`recordId`) and the operator's
 * filters only: `/api/proxy` resolves the controller, service, fixed selection, branch and row
 * cap from the saved inquiry, so none of them can be chosen by the browser.
 */
export const inquiryRunDataSchema = z
  .object({
    queryString: z.array(inquiryOperatorCriterionSchema).max(100),
    curPage: z.number().int().positive().default(1).optional(),
  })
  .strict();

/** One operator's filter input on the criteria screen, keyed by field name in `FilterCriteriaMap`. */
const filterCriterionSchema = z.object({
  value: z.string(),
  operand: selectionOperandSchema,
});
export type FilterCriterion = z.infer<typeof filterCriterionSchema>;

/** Validates criteria restored from storage (popup hand-off) before they reach the UI. */
export const filterCriteriaMapSchema = z.record(z.string(), filterCriterionSchema);
export type FilterCriteriaMap = z.infer<typeof filterCriteriaMapSchema>;

/** Inquiry state persisted on a workbench tab and carried across popups / dock-backs. */
export interface InquiryTabState {
  step?: CbsInquiryStep;
  criteria?: FilterCriteriaMap;
  currentPage?: number;
}

/* ========================================================================== */
/* 8. RESULT SET (proxy -> browser)                                           */
/* ========================================================================== */

/** A result row. `recordId` is the core's key, or "" when the row has none (no key is invented). */
export type InquiryRow = {
  recordId: string;
  [key: string]: unknown;
};

const inquiryRowSchema = z.looseObject({ recordId: z.string() });

/**
 * INQ result as `/api/proxy` returns it: rows parsed once on the server, at most
 * `INQUIRY_MAX_ROWS` of them, and `total`, the number of rows the core matched.
 */
export const inquiryResultSchema = z.object({
  rows: z.array(inquiryRowSchema),
  total: z.number().int().nonnegative(),
});

export interface InquiryResult {
  readonly rows: InquiryRow[];
  readonly total: number;
}

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

/** Filter field of branch-wise inquiries. `/api/proxy` pins its value to the session's branch. */
export const INQUIRY_BRANCH_FIELD = "branchCode";

export interface InquiryCriteriaParam {
  selectFieldName: string;
  selectFieldType?: InquiryFieldType;
  selectFieldOperator?: SelectionOperand;
  selectFieldValue?: string;
}

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

const inquiryRowSchema = z
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

/** Contract for INQ result sets returned by the BFF (rows are parsed server-side). */
export const inquiryRowListSchema = z.array(inquiryRowSchema);

export type InquiryRow = {
  id: string;
  recordId: string;
  [key: string]: unknown;
};

/* ========================================================================== */
/* 9. FIXED SELECTION GRAMMAR (INQInfo.fixedSelection)                        */
/* ========================================================================== */

const OPERAND_SET: ReadonlySet<string> = new Set(INQUIRY_OPERANDS);
const FIXED_STATEMENT_PATTERN = /^([A-Za-z0-9_.]+)\s+([A-Za-z]{2})\s+(.+)$/;
const QUOTED_VALUE_PATTERN = /^(["'])(.*)\1$/;

/** Splits on `,` `;` or newline outside quotes, so `remarks EQ "a,b"` stays one statement. */
function splitFixedStatements(input: string): string[] {
  const statements: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const ch of input) {
    if (quote) {
      if (ch === quote) quote = null;
      current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
    } else if (ch === "," || ch === ";" || ch === "\n") {
      if (current.trim()) statements.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

export interface ParsedFixedSelection {
  readonly criteria: InquiryCriteriaParam[];
  /** Statements that aren't `field OPERAND value` with a known operand. */
  readonly invalid: string[];
}

/**
 * Parses `INQInfo.fixedSelection` (e.g. `recStatus EQ "AU"; branchType NE RURAL`). A statement that
 * doesn't parse is reported in `invalid`, never dropped silently: a lost condition would widen the
 * inquiry. The save schema rejects invalid statements and the runtime refuses to run them.
 */
export function parseFixedSelection(fixedSelection?: string): ParsedFixedSelection {
  const criteria: InquiryCriteriaParam[] = [];
  const invalid: string[] = [];
  for (const statement of splitFixedStatements(fixedSelection ?? "")) {
    const match = FIXED_STATEMENT_PATTERN.exec(statement);
    const operand = match?.[2]?.toUpperCase() ?? "";
    if (!match || !OPERAND_SET.has(operand)) {
      invalid.push(statement);
      continue;
    }
    criteria.push({
      selectFieldName: match[1],
      selectFieldType: "text",
      selectFieldOperator: operand as SelectionOperand,
      selectFieldValue: match[3].trim().replace(QUOTED_VALUE_PATTERN, "$2"),
    });
  }
  return { criteria, invalid };
}

/* ========================================================================== */
/* 10. SAVE RULES (PUT on INQUIRY): what may be written to INQUIRY.CONFIG     */
/* ========================================================================== */

/** Pattern-match operands only make sense on text filters. */
const TEXT_ONLY_OPERANDS: ReadonlySet<SelectionOperand> = new Set(["CT", "SW", "EW", "LK"]);
const SERVICE_NAME_PATTERN = /^[A-Za-z0-9]+$/;
const ROW_COL_PATTERN = /^\d+,\d+$/;
const FIELD_LENGTH_PATTERN = /^\d+,[LRC]$/;
const PAGE_SIZE_PATTERN = /^[1-9]\d*$/;
/** `<SCREEN[,VERSION]> <RIDASHL function> [row field...]`, e.g. `USERS,NEWUSER I empBankId`. */
const COMMAND_PATTERN = /^\S+\s+[RIDASHL](\s+\S+)*$/;
/** Command tokens that always resolve to the row's primary key. */
export const INQUIRY_ID_TOKENS: readonly string[] = ["@ID", "RECORDID", "ID"];

/**
 * The record schema plus the designer's save rules. Reads stay on `inquiryConfigRecordSchema`,
 * so a stored inquiry that predates a rule still loads. Used by the INQUIRY.CONFIG designer
 * before saving and by `/api/proxy` on every inquiry config PUT.
 */
export const inquiryConfigSaveSchema = inquiryConfigRecordSchema.superRefine((inq, ctx) => {
  const issue = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: "custom", path, message });
  const info = inq.INQInfo;

  if (!info.controllerName.trim()) {
    issue(["INQInfo", "controllerName"], "Target Table / Controller is required");
  }
  if (!info.description.trim()) issue(["INQInfo", "description"], "Description is required");
  if (!PAGE_SIZE_PATTERN.test(info.perpageItem.trim())) {
    issue(["INQInfo", "perpageItem"], "Rows per page must be a whole number greater than 0");
  }
  if (!SERVICE_NAME_PATTERN.test(info.inqServicePath.trim())) {
    issue(
      ["INQInfo", "inqServicePath"],
      "Service Path must be a service name: letters and digits (e.g. default, finxurm)",
    );
  }
  for (const statement of parseFixedSelection(info.fixedSelection).invalid) {
    issue(
      ["INQInfo", "fixedSelection"],
      `Fixed selection "${statement}" must be "field OPERAND value" with a known operand`,
    );
  }

  const columnNames = new Set(inq.INQDef.map((c) => c.fieldName.trim().toLowerCase()));
  // The row command field is a row value the core sends, not necessarily a displayed column
  if (info.cmdFromInternal && !info.cmdFieldName.trim()) {
    issue(
      ["INQInfo", "cmdFieldName"],
      "Row Command Field is required when Dynamic Row Command is enabled",
    );
  }

  const seenFilters = new Set<string>();
  inq.INQSelectField.forEach((filter, idx) => {
    const path = ["INQSelectField", idx];
    const name = filter.selectFieldName.trim();
    if (!name) {
      issue([...path, "selectFieldName"], "Field Key is required");
    } else if (seenFilters.has(name.toLowerCase())) {
      issue([...path, "selectFieldName"], `Duplicate filter field key "${name}"`);
    }
    seenFilters.add(name.toLowerCase());
    if (!filter.selectFieldDisplay.trim()) {
      issue([...path, "selectFieldDisplay"], "Display Label is required");
    }
    if (filter.selectFieldType !== "text" && TEXT_ONLY_OPERANDS.has(filter.selectFieldOperator)) {
      issue(
        [...path, "selectFieldOperator"],
        `Operator ${filter.selectFieldOperator} works only on text filters, not ${filter.selectFieldType}`,
      );
    }
  });

  if (inq.INQDef.length === 0) issue(["INQDef"], "At least one column must be configured");
  const seenColumns = new Set<string>();
  const seenCells = new Set<string>();
  inq.INQDef.forEach((col, idx) => {
    const path = ["INQDef", idx];
    const name = col.fieldName.trim();
    const cell = col.fieldRowCol.trim();
    if (!name) {
      issue([...path, "fieldName"], "Field Name is required");
    } else if (seenColumns.has(name.toLowerCase())) {
      issue([...path, "fieldName"], `Duplicate column field name "${name}"`);
    }
    seenColumns.add(name.toLowerCase());
    if (!col.fieldDisplay.trim()) issue([...path, "fieldDisplay"], "Display Header is required");
    if (!ROW_COL_PATTERN.test(cell)) {
      issue([...path, "fieldRowCol"], `Position "${cell}" must be "row,column" (e.g. 1,2)`);
    } else if (seenCells.has(cell)) {
      issue([...path, "fieldRowCol"], `Position ${cell} is already used by another column`);
    }
    seenCells.add(cell);
    if (!FIELD_LENGTH_PATTERN.test(col.fieldLength.trim())) {
      issue(
        [...path, "fieldLength"],
        `Width "${col.fieldLength}" must be "length,L|R|C" (e.g. 20,L)`,
      );
    }
  });

  inq.INQCmds.forEach((cmd, idx) => {
    const path = ["INQCmds", idx];
    if (!cmd.cmdButton.trim()) issue([...path, "cmdButton"], "Button label is required");
    const command = cmd.cmdFor.trim();
    // With a dynamic row command the row supplies the command, so the action needs no target
    if (!command) {
      if (!info.cmdFromInternal) issue([...path, "cmdFor"], "Command target is required");
      return;
    }
    if (!COMMAND_PATTERN.test(command)) {
      issue(
        [...path, "cmdFor"],
        `Command "${command}" must be "SCREEN FUNCTION [field]" with a function from RIDASHL`,
      );
      return;
    }
    for (const token of command.split(/\s+/).slice(2)) {
      if (
        !INQUIRY_ID_TOKENS.includes(token.toUpperCase()) &&
        !columnNames.has(token.toLowerCase())
      ) {
        issue([...path, "cmdFor"], `Command field "${token}" must be one of the columns (or @ID)`);
      }
    }
  });
});

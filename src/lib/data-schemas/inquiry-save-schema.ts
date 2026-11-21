import { SERVICE_NAME_PATTERN } from "./common-schema";
import {
  INQUIRY_BRANCH_FIELD,
  INQUIRY_FIELD_NAME_PATTERN,
  INQUIRY_ID_TOKENS,
  type InquiryCriteriaParam,
  inquiryConfigRecordSchema,
  isInquiryCommand,
  isOperandAllowed,
  isSelectionOperand,
} from "./inquiry-config-schema";

/* ========================================================================== */
/* 1. FIXED SELECTION GRAMMAR (INQInfo.fixedSelection)                        */
/* ========================================================================== */

const FIXED_STATEMENT_PATTERN = /^([A-Za-z0-9_.]+)\s+([A-Za-z]{2})\s+(.+)$/;
const QUOTED_VALUE_PATTERN = /^(["'])(.*)\1$/;

/**
 * Splits on `,` `;` or newline outside quotes, so `remarks EQ "a,b"` stays one statement. A quote
 * that never closes is returned as `unterminated`: it would otherwise swallow every statement
 * after it (`name NE O'Brien; recStatus EQ AU` would lose the `recStatus` condition).
 */
function splitFixedStatements(input: string): { statements: string[]; unterminated: string } {
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
  if (quote) return { statements, unterminated: current.trim() };
  if (current.trim()) statements.push(current.trim());
  return { statements, unterminated: "" };
}

/** A value is bare (no quotes at all) or one fully quoted string with no quote of its kind inside. */
function parseFixedValue(raw: string): string | null {
  const quoted = QUOTED_VALUE_PATTERN.exec(raw);
  if (quoted) return quoted[2].includes(quoted[1]) ? null : quoted[2];
  return /["']/.test(raw) ? null : raw;
}

interface ParsedFixedSelection {
  readonly criteria: InquiryCriteriaParam[];
  /** Statements that aren't `field OPERAND value` with a known operand and a clean value. */
  readonly invalid: string[];
}

/**
 * Parses `INQInfo.fixedSelection` (e.g. `recStatus EQ "AU"; branchType NE RURAL`). A statement that
 * doesn't parse is reported in `invalid`, never dropped silently: a lost condition would widen the
 * inquiry. The save schema rejects invalid statements and `/api/proxy` refuses to run them.
 */
export function parseFixedSelection(fixedSelection?: string): ParsedFixedSelection {
  const criteria: InquiryCriteriaParam[] = [];
  const invalid: string[] = [];
  const { statements, unterminated } = splitFixedStatements(fixedSelection ?? "");
  for (const statement of statements) {
    const match = FIXED_STATEMENT_PATTERN.exec(statement);
    const operand = match?.[2]?.toUpperCase() ?? "";
    const value = match ? parseFixedValue(match[3].trim()) : null;
    if (!match || !isSelectionOperand(operand) || value === null) {
      invalid.push(statement);
      continue;
    }
    criteria.push({
      selectFieldName: match[1],
      selectFieldType: "text",
      selectFieldOperator: operand,
      selectFieldValue: value,
    });
  }
  if (unterminated) invalid.push(unterminated);
  return { criteria, invalid };
}

/* ========================================================================== */
/* 2. SAVE RULES (PUT on INQUIRY): what may be written to INQUIRY.CONFIG      */
/* ========================================================================== */

const ROW_COL_PATTERN = /^\d+,\d+$/;
const FIELD_LENGTH_PATTERN = /^\d+,[LRC]$/;
const PAGE_SIZE_PATTERN = /^[1-9]\d*$/;

/**
 * The record schema plus the designer's save rules. Reads stay on `inquiryConfigRecordSchema`,
 * so a stored inquiry that predates a rule still loads (and `/api/proxy` still refuses to run what
 * would be unsafe). Used by the INQUIRY.CONFIG designer before saving and by `/api/proxy` on every
 * inquiry commit. Unknown top-level keys are rejected, so nothing rides along unchecked.
 */
export const inquiryConfigSaveSchema = inquiryConfigRecordSchema
  .strict()
  .superRefine((inq, ctx) => {
    const issue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });
    const info = inq.INQInfo;
    const branchField = INQUIRY_BRANCH_FIELD.toLowerCase();

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
    const fixed = parseFixedSelection(info.fixedSelection);
    for (const statement of fixed.invalid) {
      issue(
        ["INQInfo", "fixedSelection"],
        `Fixed selection "${statement}" must be "field OPERAND value" with a known operand (quote a value that holds a quote: "O'Brien")`,
      );
    }
    const fixedFields = new Set(fixed.criteria.map((c) => c.selectFieldName.toLowerCase()));
    if (info.showBranchWise && fixedFields.has(branchField)) {
      issue(
        ["INQInfo", "fixedSelection"],
        `A branch-wise inquiry is filtered to the operator's branch; remove "${INQUIRY_BRANCH_FIELD}" from the fixed selection`,
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
      const key = name.toLowerCase();
      if (!name) {
        issue([...path, "selectFieldName"], "Field Key is required");
      } else if (!INQUIRY_FIELD_NAME_PATTERN.test(name)) {
        issue(
          [...path, "selectFieldName"],
          `Field Key "${name}" may hold letters, digits, _ and .`,
        );
      } else if (seenFilters.has(key)) {
        issue([...path, "selectFieldName"], `Duplicate filter field key "${name}"`);
      } else if (fixedFields.has(key)) {
        issue(
          [...path, "selectFieldName"],
          `"${name}" is set by the fixed selection, so it can't also be an operator filter`,
        );
      } else if (info.showBranchWise && key === branchField) {
        issue(
          [...path, "selectFieldName"],
          `A branch-wise inquiry is filtered to the operator's branch; remove the "${name}" filter`,
        );
      }
      seenFilters.add(key);
      if (!filter.selectFieldDisplay.trim()) {
        issue([...path, "selectFieldDisplay"], "Display Label is required");
      }
      if (!isOperandAllowed(filter.selectFieldType, filter.selectFieldOperator)) {
        issue(
          [...path, "selectFieldOperator"],
          `Operator ${filter.selectFieldOperator} works only on text filters, not ${filter.selectFieldType}`,
        );
      }
      const locked = filter.selectFieldOperatorFixed.trim();
      if (locked && locked !== filter.selectFieldOperator) {
        issue(
          [...path, "selectFieldOperatorFixed"],
          `The locked operator must be the filter's operator (${filter.selectFieldOperator})`,
        );
      }
    });

    if (inq.INQDef.length === 0) issue(["INQDef"], "At least one column must be configured");
    const seenColumns = new Set<string>();
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
      // Two columns may share a position: the core stores that, and the table keeps their order
      if (!ROW_COL_PATTERN.test(cell)) {
        issue([...path, "fieldRowCol"], `Position "${cell}" must be "row,column" (e.g. 1,2)`);
      }
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
      if (!isInquiryCommand(command)) {
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
          issue(
            [...path, "cmdFor"],
            `Command field "${token}" must be one of the columns (or @ID)`,
          );
        }
      }
    });
  });

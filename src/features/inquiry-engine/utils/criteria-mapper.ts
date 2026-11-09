import type { INQSelectField, InquiryCriteriaParam, SelectionOperand } from "@/lib/data-schemas";
import type { FilterCriteriaMap } from "../types";

export type CbsWireCriteriaParam = InquiryCriteriaParam;

/**
 * Builds a default criteria map from an array of INQSelectField definitions.
 */
export function buildDefaultCriteria(fields: readonly INQSelectField[] = []): FilterCriteriaMap {
  const criteria: FilterCriteriaMap = {};
  for (const f of fields) {
    if (!f.selectFieldName?.trim()) continue;
    criteria[f.selectFieldName] = {
      value: f.selectFieldValue || "",
      operand: (f.selectFieldOperator || "EQ") as SelectionOperand,
    };
  }
  return criteria;
}

/**
 * Parses a CBS fixedSelection string (e.g. "STATUS EQ AU" or "RECORD.STATUS NE REVE, CATEGORY EQ 1001")
 * into InquiryCriteriaParam items.
 */
export function parseFixedSelectionToWire(fixedSelection?: string): InquiryCriteriaParam[] {
  if (!fixedSelection || fixedSelection.trim() === "") return [];

  const statements = fixedSelection
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result: InquiryCriteriaParam[] = [];

  for (const stmt of statements) {
    // Expected syntax: FIELD_NAME OPERAND VALUE (e.g. "STATUS EQ 'AU'" or "ACCOUNT.STATUS EQ 1")
    const match = stmt.match(/^([A-Za-z0-9_.]+)\s+([A-Za-z]{2})\s+(.+)$/);
    if (!match) continue;

    const [, rawField, rawOp, rawVal] = match;
    const cleanValue = rawVal?.trim().replace(/^['"]|['"]$/g, "") || "";

    result.push({
      selectFieldName: rawField?.trim() || "",
      selectFieldType: "text",
      selectFieldOperator: (rawOp?.trim().toUpperCase() || "EQ") as SelectionOperand,
      selectFieldValue: cleanValue,
    });
  }

  return result;
}

/**
 * Transforms UI filter criteria map and optional fixedSelection/branchCode into CBS backend queryString payload.
 */
export function serializeCriteriaToWire(
  criteria: FilterCriteriaMap,
  fields: INQSelectField[],
  fixedSelection?: string,
  branchCode?: string | null,
): InquiryCriteriaParam[] {
  const result: InquiryCriteriaParam[] = [];

  // 1. Append branch-wise segregation filter if active
  if (branchCode?.trim()) {
    result.push({
      selectFieldName: "branchCode",
      selectFieldType: "text",
      selectFieldOperator: "EQ",
      selectFieldValue: branchCode.trim(),
    });
  }

  // 2. Append fixed selections if configured
  if (fixedSelection?.trim()) {
    result.push(...parseFixedSelectionToWire(fixedSelection));
  }

  // 3. Append operator-specified filter criteria
  for (const [fieldName, crit] of Object.entries(criteria)) {
    if (!crit.value || crit.value.trim() === "") continue;

    const fieldDef = fields.find((f) => f.selectFieldName === fieldName);
    result.push({
      selectFieldName: fieldName,
      selectFieldType: fieldDef?.selectFieldType || "text",
      selectFieldOperator: (crit.operand || "EQ") as SelectionOperand,
      selectFieldValue: crit.value.trim(),
    });
  }

  return result;
}

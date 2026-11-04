import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";
import type { FilterCriteriaMap } from "../types";

export interface CbsWireCriteriaParam {
  selectFieldName: string;
  selectFieldType: string;
  selectFieldOperator: string;
  selectFieldValue: string;
}

/**
 * Parses a CBS fixedSelection string (e.g. "STATUS EQ AU" or "RECORD.STATUS NE REVE, CATEGORY EQ 1001")
 * into CbsWireCriteriaParam items.
 */
export function parseFixedSelectionToWire(fixedSelection?: string): CbsWireCriteriaParam[] {
  if (!fixedSelection || fixedSelection.trim() === "") return [];

  const statements = fixedSelection
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const result: CbsWireCriteriaParam[] = [];

  for (const stmt of statements) {
    // Expected syntax: FIELD_NAME OPERAND VALUE (e.g. "STATUS EQ 'AU'" or "ACCOUNT.STATUS EQ 1")
    const match = stmt.match(/^([A-Za-z0-9_.]+)\s+([A-Za-z]{2})\s+(.+)$/);
    if (!match) continue;

    const [, rawField, rawOp, rawVal] = match;
    const cleanValue = rawVal?.trim().replace(/^['"]|['"]$/g, "") || "";

    result.push({
      selectFieldName: rawField?.trim() || "",
      selectFieldType: "text",
      selectFieldOperator: (rawOp?.trim().toUpperCase() || "EQ") as string,
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
): CbsWireCriteriaParam[] {
  const result: CbsWireCriteriaParam[] = [];

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
      selectFieldOperator: crit.operand || "EQ",
      selectFieldValue: crit.value.trim(),
    });
  }

  return result;
}

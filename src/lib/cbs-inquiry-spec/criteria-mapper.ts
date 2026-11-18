import {
  type FilterCriteriaMap,
  type INQSelectField,
  INQUIRY_BRANCH_FIELD,
  type InquiryCriteriaParam,
  parseFixedSelection,
  type SelectionOperand,
} from "@/lib/data-schemas";

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
      selectFieldName: INQUIRY_BRANCH_FIELD,
      selectFieldType: "text",
      selectFieldOperator: "EQ",
      selectFieldValue: branchCode.trim(),
    });
  }

  // 2. Append fixed selections if configured
  // Fail closed: running without a fixed condition would return rows the inquiry must hide
  const fixed = parseFixedSelection(fixedSelection);
  if (fixed.invalid.length > 0) {
    throw new Error(`Inquiry fixed selection is invalid: ${fixed.invalid.join("; ")}`);
  }
  result.push(...fixed.criteria);

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

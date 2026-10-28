import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";
import type { FilterCriteriaMap } from "../types";

export interface CbsWireCriteriaParam {
  selectFieldName: string;
  selectFieldType: string;
  selectFieldOperator: string;
  selectFieldValue: string;
}

/**
 * Transforms UI filter criteria map into CBS backend queryString payload.
 */
export function serializeCriteriaToWire(
  criteria: FilterCriteriaMap,
  fields: INQSelectField[],
): CbsWireCriteriaParam[] {
  const result: CbsWireCriteriaParam[] = [];

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

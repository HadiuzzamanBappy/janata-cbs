import type { EnquiryRow, SelectionOperand } from "@/lib/data-schemas";

/**
 * Pure function to filter an inquiry dataset using selection criteria.
 * Eliminates duplicate filtering loops in the UI layer.
 */
export function filterDatasetByCriteria(
  dataset: EnquiryRow[],
  criteria: Record<string, { value: string; operand: SelectionOperand }>,
): EnquiryRow[] {
  let result = [...dataset];

  for (const [key, filter] of Object.entries(criteria)) {
    if (!filter.value?.trim()) continue;
    const term = filter.value.trim().toLowerCase();

    result = result.filter((row) => {
      const val = String(row[key] ?? "").toLowerCase();
      if (filter.operand === "EQ") return val === term;
      if (filter.operand === "NE") return val !== term;
      return val.includes(term);
    });
  }

  return result;
}

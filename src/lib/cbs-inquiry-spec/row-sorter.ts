import type { InquiryRow } from "@/lib/data-schemas";
import type { DerivedColumnMeta } from "./column-compiler";

export interface InquirySort {
  readonly column: string;
  readonly direction: "asc" | "desc";
}

/** One collator for every comparison: `localeCompare` with options builds one per call. */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
const NUMERIC_TEXT = /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i;

/** A numeric cell as a number (`"1,234.50"` → 1234.5), or null when it isn't one. */
function numericKey(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const clean = value.replace(/,/g, "").trim();
  return NUMERIC_TEXT.test(clean) ? Number(clean) : null;
}

/** The sort after a header click: ascending, then descending, then unsorted. */
export function nextInquirySort(current: InquirySort | null, column: string): InquirySort | null {
  if (current?.column !== column) return { column, direction: "asc" };
  return current.direction === "asc" ? { column, direction: "desc" } : null;
}

/**
 * Sorts rows by one column. Amount and number columns compare as numbers (thousands separators
 * allowed), others with a numeric-aware collator (ISO dates sort chronologically). Empty cells go
 * last in both directions, and equal rows keep their order. Each cell is read once (O(n log n)).
 */
export function sortInquiryRows(
  rows: readonly InquiryRow[],
  sort: InquirySort | null,
  columns: readonly DerivedColumnMeta[],
): InquiryRow[] {
  if (!sort) return [...rows];
  const format = columns.find((c) => c.id === sort.column)?.format;
  const numeric = format === "currency" || format === "number";
  const factor = sort.direction === "asc" ? 1 : -1;

  const keyed = rows.map((row, index) => {
    const raw = row[sort.column];
    const empty = raw === undefined || raw === null || raw === "";
    return { row, index, empty, num: numeric ? numericKey(raw) : null, text: String(raw ?? "") };
  });
  keyed.sort((a, b) => {
    if (a.empty !== b.empty) return a.empty ? 1 : -1;
    let diff: number;
    if (a.num !== null && b.num !== null) diff = a.num - b.num;
    else if (a.num !== null || b.num !== null) diff = a.num === null ? 1 : -1;
    else diff = collator.compare(a.text, b.text);
    return diff * factor || a.index - b.index;
  });
  return keyed.map((k) => k.row);
}

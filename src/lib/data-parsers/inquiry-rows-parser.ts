import type { InquiryRow } from "@/lib/data-schemas";
import { unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Dataset Rows Parser (for runtime tabular inquiry queries)                  */
/* -------------------------------------------------------------------------- */

function keyOf(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

/**
 * Unpacks tabular records from a decoded INQ response payload into InquiryRow[]. `recordId` is
 * the row's own key (`recordId`, else `id`), or "" when the core sent none: a key is never
 * invented, so `@ID` commands can't open a record that doesn't exist.
 * Runs once, in the BFF proxy; clients receive the rows and only validate them.
 */
export function parseInquiryRecords(rawPayload: unknown): InquiryRow[] {
  if (!rawPayload) return [];

  return unwrapRecordsPayload<Record<string, unknown>>(rawPayload).map((item) => ({
    ...item,
    recordId: keyOf(item.recordId) || keyOf(item.id),
  }));
}

/**
 * Extracts total matched row count from a decoded INQ payload (`total`, `totalRecords`, or
 * `totalCount`), falling back to the decoded page length when the core omits a total.
 */
export function extractInquiryTotal(rawPayload: unknown, fallbackCount: number): number {
  if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) {
    return fallbackCount;
  }
  const obj = rawPayload as Record<string, unknown>;
  for (const key of ["total", "totalRecords", "totalCount"] as const) {
    const val = obj[key];
    if (typeof val === "number" && Number.isInteger(val) && val >= 0) return val;
  }
  return fallbackCount;
}

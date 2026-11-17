import type { InquiryRow } from "@/lib/data-schemas";
import { unwrapRecordsPayload } from "./protobuf-decoder";

/* -------------------------------------------------------------------------- */
/* Dataset Rows Parser (for runtime tabular inquiry queries)                  */
/* -------------------------------------------------------------------------- */

/**
 * Unpacks tabular records from a decoded INQ response payload into a typed InquiryRow array.
 * Runs once, in the BFF proxy; clients receive the rows and only validate them.
 */
export function parseInquiryRecords(rawPayload: unknown): InquiryRow[] {
  if (!rawPayload) return [];

  const records = unwrapRecordsPayload<Record<string, unknown>>(rawPayload);
  return records.map((item, idx) => {
    const rawId = item.id ?? item.recordId ?? item.txnReference ?? item.accountNumber;
    const cleanId =
      rawId !== undefined && rawId !== null && String(rawId).trim() !== ""
        ? String(rawId).trim()
        : `row_${idx + 1}`;

    return {
      ...item,
      id: cleanId,
      recordId:
        typeof item.recordId === "string" && item.recordId.trim() !== ""
          ? item.recordId.trim()
          : cleanId,
    };
  });
}

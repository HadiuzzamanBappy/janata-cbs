import { cbs } from "@/lib/cbs-client";
import { deriveInquiryColumnMeta, serializeCriteriaToWire } from "@/lib/cbs-inquiry-spec";
import { toIsoTemporal } from "@/lib/core-utils";
import {
  type FilterCriteriaMap,
  type InquiryConfigRecord,
  type InquiryResult,
  type InquiryRow,
  inquiryResultSchema,
  isApiSuccess,
} from "@/lib/data-schemas";

/**
 * Runs the saved inquiry `inquiryId` with the operator's filters and returns its rows (at most
 * `INQUIRY_MAX_ROWS`) and the matched total. `/api/proxy` resolves everything else from the saved
 * definition. `config` (the same definition, already loaded for the screen) supplies the filter
 * fields and the date columns. Throws the core's message on rejection and rethrows an abort;
 * callers own the loading state and the single toast.
 */
export async function runInquiry(
  inquiryId: string,
  config: InquiryConfigRecord,
  criteria: FilterCriteriaMap,
  signal?: AbortSignal,
  curPage = 1,
): Promise<InquiryResult> {
  const queryString = serializeCriteriaToWire(criteria, config.INQSelectField);
  const res = await cbs.send(cbs.inquiry.executeQuery(inquiryId, queryString, curPage), {
    silent: true,
    signal,
    responseSchema: inquiryResultSchema,
  });
  if (!isApiSuccess(res) || !res.data) {
    throw new Error(res.message || `Core rejected inquiry ${inquiryId}`);
  }
  // Inbound dates become ISO once, here, for the table, sorting and exports alike
  const dateColumns = config.INQDef.filter(
    (col) => deriveInquiryColumnMeta(col).format === "date",
  ).map((col) => col.fieldName);
  const { rows, total } = res.data;
  if (dateColumns.length === 0) return { rows, total };
  return {
    total,
    rows: rows.map((row) => {
      const next: InquiryRow = { ...row };
      for (const name of dateColumns) next[name] = toIsoTemporal(next[name]);
      return next;
    }),
  };
}

import { cbs } from "@/lib/cbs-client";
import { deriveInquiryColumnMeta, serializeCriteriaToWire } from "@/lib/cbs-inquiry-spec";
import { toIsoTemporal } from "@/lib/core-utils";
import {
  type FilterCriteriaMap,
  type InquiryConfigRecord,
  type InquiryRow,
  inquiryRowListSchema,
  isApiSuccess,
} from "@/lib/data-schemas";

export interface RunInquiryOptions {
  /** The operator's branch; sent only when the inquiry is branch-wise (`INQInfo.showBranchWise`). */
  readonly branchCode?: string | null;
  readonly perPage: number;
  readonly signal?: AbortSignal;
}

/**
 * Executes an inquiry against its configured target controller (never the command text) and
 * returns the rows. Throws with a user-facing message when the inquiry has no controller or the
 * core rejects it; callers own their loading state and toasts.
 */
export async function runInquiry(
  config: InquiryConfigRecord,
  criteria: FilterCriteriaMap,
  { branchCode, perPage, signal }: RunInquiryOptions,
): Promise<InquiryRow[]> {
  const info = config.INQInfo;
  const controller = info?.controllerName?.trim();
  if (!controller) {
    throw new Error(
      "This inquiry has no target controller (INQInfo.controllerName). Set it in the Inquiry Designer.",
    );
  }

  const queryString = serializeCriteriaToWire(
    criteria,
    config.INQSelectField || [],
    info?.fixedSelection,
    info?.showBranchWise ? (branchCode ?? null) : null,
  );
  const res = await cbs.send(
    cbs.inquiry.executeQuery(controller, {
      servicePath: info?.inqServicePath,
      inqType: info?.inqType,
      perPage,
      curPage: 1,
      queryString,
    }),
    { silent: true, signal, responseSchema: inquiryRowListSchema },
  );
  if (!isApiSuccess(res)) {
    throw new Error(res.message || `Core rejected inquiry on ${controller}`);
  }
  // Inbound dates become ISO once, here, for the table, sorting and exports alike
  const dateColumns = (config.INQDef || [])
    .filter((col) => deriveInquiryColumnMeta(col).format === "date")
    .map((col) => col.fieldName);
  const rows = res.data ?? [];
  if (dateColumns.length === 0) return rows;
  return rows.map((row) => {
    const next: InquiryRow = { ...row };
    for (const name of dateColumns) next[name] = toIsoTemporal(next[name]);
    return next;
  });
}

import type { CbsWirePayload, InquiryOperatorCriterion } from "@/lib/data-schemas";
import { CbsRecordFunction, CbsRequestType } from "@/types";

/**
 * Runtime inquiry payload builder. Table definition maintenance (get, list, save) is handled by
 * `cbs.inquiryConfig`.
 */
export const inquiryPayloads = {
  /**
   * Run a saved inquiry ('INQ'). The browser names the inquiry (its INQUIRY record ID) and sends
   * the operator's filter values; `/api/proxy` resolves the controller, service, fixed selection,
   * branch and row cap from the saved definition.
   */
  executeQuery: (
    inquiryId: string,
    queryString: readonly InquiryOperatorCriterion[] = [],
  ): CbsWirePayload => ({
    requestType: CbsRequestType.INQ,
    recordFunction: CbsRecordFunction.SEE,
    recordId: inquiryId.trim().toUpperCase(),
    data: { queryString: [...queryString] },
  }),
};

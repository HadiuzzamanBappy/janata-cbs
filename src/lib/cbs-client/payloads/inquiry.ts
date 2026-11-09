import type {
  CbsWirePayload,
  InquiryCriteriaParam,
  InquiryExecuteOptions,
} from "@/lib/data-schemas";
import { CbsRecordFunction, CbsRequestType } from "@/types";

export type { InquiryCriteriaParam, InquiryExecuteOptions };

/**
 * Pure runtime enquiry executor payload builder.
 * Table definition maintenance (get, list, save) is handled by `cbs.inquiryConfig`.
 */
export const inquiryPayloads = {
  /**
   * Execute tabular runtime enquiry query ('INQ').
   */
  executeQuery: (controlName: string, options: InquiryExecuteOptions = {}): CbsWirePayload => ({
    servicePath: options.servicePath,
    requestType: CbsRequestType.INQ,
    controlName: controlName.trim().toUpperCase(),
    recordFunction: CbsRecordFunction.SEE,
    recordId: "",
    data: {
      queryString: options.queryString || [],
      curPage: options.curPage || 1,
      perPage: options.perPage || 1000,
    },
  }),
};

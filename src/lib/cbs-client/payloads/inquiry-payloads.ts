import type { CbsWirePayload } from "../contracts/envelope-schema";
import { CbsRecordFunction } from "../contracts/record-functions";
import { CbsRequestType } from "../contracts/request-types";

export interface InquiryCriteriaParam {
  selectFieldName: string;
  selectFieldType?: string;
  selectFieldOperator: string;
  selectFieldValue: string;
}

export interface InquiryExecuteOptions {
  queryString?: InquiryCriteriaParam[];
  curPage?: number;
  perPage?: number;
}

/**
 * Domain payload builders for Inquiry Runtime Engine (INQ)
 */
export const inquiryPayloads = {
  /**
   * Execute an inquiry search query with criteria and pagination
   */
  executeQuery: (controlName: string, options: InquiryExecuteOptions = {}): CbsWirePayload => {
    const { queryString = [], curPage = 1, perPage = 1000 } = options;
    return {
      servicePath: "default",
      requestType: CbsRequestType.INQUIRY_EXEC,
      controlName,
      recordFunction: CbsRecordFunction.SEE,
      recordId: "",
      data: {
        queryString,
        curPage,
        perPage,
      },
    };
  },

  /**
   * Fetch a single record via INQ request
   */
  fetchSingleRecord: (controlName: string, recordId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.INQUIRY_EXEC,
    controlName,
    recordFunction: CbsRecordFunction.SEE,
    recordId,
  }),

  /**
   * Fetch inquiry metadata definition (INQUIRY / ENQUIRY designer)
   */
  getInquiryConfig: (inquiryId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_GET,
    controlName: "INQUIRY",
    recordFunction: CbsRecordFunction.SEE,
    recordId: inquiryId,
  }),

  /**
   * Save inquiry metadata definition
   */
  saveInquiryConfig: (inquiryId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName: "INQUIRY",
    recordFunction: CbsRecordFunction.INPUT,
    recordId: inquiryId,
    data,
  }),

  /**
   * Authorize inquiry definition
   */
  authorizeInquiryConfig: (inquiryId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: "INQUIRY",
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: inquiryId,
  }),
};

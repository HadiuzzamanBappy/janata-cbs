import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

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
      servicePath: DEFAULT_SERVICE_PATH,
      requestType: CbsRequestType.INQUIRY_EXEC,
      controlName: controlName.trim().toUpperCase(),
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
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.INQUIRY_EXEC,
    controlName: controlName.trim().toUpperCase(),
    recordFunction: CbsRecordFunction.SEE,
    recordId: recordId.trim(),
  }),

  /**
   * Fetch inquiry metadata definition (INQUIRY designer)
   */
  getInquiryConfig: (inquiryId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.INQUIRY,
    recordFunction: CbsRecordFunction.SEE,
    recordId: inquiryId.trim().toUpperCase(),
  }),

  /**
   * Save inquiry metadata definition
   */
  saveInquiryConfig: (inquiryId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.INQUIRY,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: inquiryId.trim().toUpperCase(),
    data,
  }),

  /**
   * Authorize inquiry definition
   */
  authorizeInquiryConfig: (inquiryId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.INQUIRY,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: inquiryId.trim().toUpperCase(),
  }),

  /**
   * Delete inquiry definition
   */
  deleteInquiryConfig: (inquiryId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.INQUIRY,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: inquiryId.trim().toUpperCase(),
  }),
};

import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

/**
 * Filter criteria parameter for dynamic inquiry grid searches.
 */
export interface InquiryCriteriaParam {
  /** Field name / column ID to filter against */
  selectFieldName: string;
  /** Field datatype (e.g. 'text', 'date', 'number') */
  selectFieldType?: string;
  /** Operator code (e.g. 'EQ', 'LK', 'GT', 'LT', 'BETWEEN') */
  selectFieldOperator: string;
  /** Comparison value */
  selectFieldValue: string;
}

/**
 * Options for executing an inquiry search query.
 */
export interface InquiryExecuteOptions {
  /** Array of criteria filters applied to the query */
  queryString?: InquiryCriteriaParam[];
  /** 1-based page index */
  curPage?: number;
  /** Page size limit */
  perPage?: number;
}

/**
 * Domain payload builders for Inquiry Runtime Engine (INQ).
 */
export const inquiryPayloads = {
  /**
   * Execute an inquiry search query with criteria and pagination.
   *
   * @param controlName - Inquiry controller or enquiry code (e.g. "%ACCOUNT")
   * @param options - Pagination and filter criteria
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
   * Fetch a single record via INQ request.
   *
   * @param controlName - Inquiry controller or enquiry code
   * @param recordId - Record ID to inspect
   */
  fetchSingleRecord: (controlName: string, recordId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.INQUIRY_EXEC,
    controlName: controlName.trim().toUpperCase(),
    recordFunction: CbsRecordFunction.SEE,
    recordId: recordId.trim(),
  }),

  /**
   * Fetch inquiry metadata definition (INQUIRY designer).
   *
   * @param inquiryId - Primary enquiry ID
   */
  getInquiryConfig: (inquiryId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.INQUIRY,
    recordFunction: CbsRecordFunction.SEE,
    recordId: inquiryId.trim().toUpperCase(),
  }),

  /**
   * Save inquiry metadata definition.
   *
   * @param inquiryId - Primary enquiry ID
   * @param data - Full enquiry metadata configuration
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
   * Authorize inquiry definition (Maker-Checker approval step).
   *
   * @param inquiryId - Primary enquiry ID to authorize
   */
  authorizeInquiryConfig: (inquiryId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.INQUIRY,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: inquiryId.trim().toUpperCase(),
  }),

  /**
   * Delete inquiry definition.
   *
   * @param inquiryId - Primary enquiry ID to decommission
   */
  deleteInquiryConfig: (inquiryId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.INQUIRY,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: inquiryId.trim().toUpperCase(),
  }),
};

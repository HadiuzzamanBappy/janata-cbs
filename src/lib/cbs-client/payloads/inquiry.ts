import {
  CbsControlTable,
  CbsRecordFunction,
  CbsRequestType,
  type CbsWirePayload,
  DEFAULT_SERVICE_PATH,
} from "@/types";
import { createModelPayloads } from "./base-model";

export interface InquiryCriteriaParam {
  readonly selectFieldName: string;
  readonly selectFieldType?: string;
  readonly selectFieldOperator: string;
  readonly selectFieldValue: string;
}

export interface InquiryExecuteOptions {
  readonly queryString?: readonly InquiryCriteriaParam[];
  readonly curPage?: number;
  readonly perPage?: number;
  readonly servicePath?: string;
}

const base = createModelPayloads(CbsControlTable.INQUIRY);

export const inquiryPayloads = {
  ...base,

  // Runtime Enquiry Queries
  executeQuery: (controlName: string, options: InquiryExecuteOptions = {}): CbsWirePayload => ({
    servicePath: options.servicePath || DEFAULT_SERVICE_PATH,
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

  fetchSingleRecord: (
    controlName: string,
    recordId: string,
    servicePath = DEFAULT_SERVICE_PATH,
  ): CbsWirePayload => ({
    servicePath,
    requestType: CbsRequestType.INQ,
    controlName: controlName.trim().toUpperCase(),
    recordFunction: CbsRecordFunction.SEE,
    recordId: recordId.trim(),
  }),
};

import type { CbsWirePayload } from "../contracts/envelope-schema";
import { CbsRecordFunction } from "../contracts/record-functions";
import { CbsRequestType } from "../contracts/request-types";

/**
 * Domain payload builders for Generic Form Engine Records
 */
export const formPayloads = {
  /** Fetch a specific record by ID for a generic form */
  fetchRecord: (
    controlName: string,
    recordId: string,
    servicePath = "default",
  ): CbsWirePayload => ({
    servicePath,
    requestType: CbsRequestType.RECORD_GET,
    controlName,
    recordFunction: CbsRecordFunction.SEE,
    recordId,
  }),

  /** Commit / Save form record */
  commitRecord: (
    controlName: string,
    data: Record<string, unknown>,
    options?: {
      recordId?: string;
      recordFunction?: CbsRecordFunction;
      servicePath?: string;
    },
  ): CbsWirePayload => ({
    servicePath: options?.servicePath || "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName,
    recordFunction: options?.recordFunction || CbsRecordFunction.INPUT,
    recordId: options?.recordId || "",
    data,
  }),

  /** Authorize form record */
  authorizeRecord: (
    controlName: string,
    recordId: string,
    servicePath = "default",
  ): CbsWirePayload => ({
    servicePath,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId,
  }),

  /** Delete / Reverse form record */
  deleteRecord: (
    controlName: string,
    recordId: string,
    servicePath = "default",
  ): CbsWirePayload => ({
    servicePath,
    requestType: CbsRequestType.RECORD_PUT,
    controlName,
    recordFunction: CbsRecordFunction.DELETE,
    recordId,
  }),
};

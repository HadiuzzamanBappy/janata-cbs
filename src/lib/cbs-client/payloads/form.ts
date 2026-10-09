import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsRequestType } from "../types/request-types";

/**
 * Domain payload builders for Generic Form Engine Records.
 */
export const formPayloads = {
  /**
   * Fetch a specific record by ID for a generic form screen.
   *
   * @param controlName - Target table/screen name (e.g. "ACCOUNT")
   * @param recordId - Primary record key
   * @param servicePath - gRPC routing target (defaults to DEFAULT_SERVICE_PATH)
   */
  fetchRecord: (
    controlName: string,
    recordId: string,
    servicePath = DEFAULT_SERVICE_PATH,
  ): CbsWirePayload => ({
    servicePath: servicePath.trim() || DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: controlName.trim().toUpperCase(),
    recordFunction: CbsRecordFunction.SEE,
    recordId: recordId.trim(),
  }),

  /**
   * Commit / Save form record (Input or Amend).
   *
   * @param controlName - Target table/screen name (e.g. "ACCOUNT")
   * @param data - Form key-value dictionary to commit
   * @param options - Additional options including recordId, recordFunction ('I'/'A'), and servicePath
   */
  commitRecord: (
    controlName: string,
    data: Record<string, unknown>,
    options?: {
      recordId?: string;
      recordFunction?: CbsRecordFunction;
      servicePath?: string;
    },
  ): CbsWirePayload => ({
    servicePath: options?.servicePath?.trim() || DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: controlName.trim().toUpperCase(),
    recordFunction: options?.recordFunction || CbsRecordFunction.INPUT,
    recordId: options?.recordId ? options.recordId.trim() : "",
    data,
  }),

  /**
   * Authorize form record (Maker-Checker approval step).
   *
   * @param controlName - Target table/screen name (e.g. "ACCOUNT")
   * @param recordId - Primary record key to authorize
   * @param servicePath - gRPC routing target (defaults to DEFAULT_SERVICE_PATH)
   */
  authorizeRecord: (
    controlName: string,
    recordId: string,
    servicePath = DEFAULT_SERVICE_PATH,
  ): CbsWirePayload => ({
    servicePath: servicePath.trim() || DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: controlName.trim().toUpperCase(),
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: recordId.trim(),
  }),

  /**
   * Delete / Reverse form record.
   *
   * @param controlName - Target table/screen name (e.g. "ACCOUNT")
   * @param recordId - Primary record key to delete or reverse
   * @param servicePath - gRPC routing target (defaults to DEFAULT_SERVICE_PATH)
   */
  deleteRecord: (
    controlName: string,
    recordId: string,
    servicePath = DEFAULT_SERVICE_PATH,
  ): CbsWirePayload => ({
    servicePath: servicePath.trim() || DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: controlName.trim().toUpperCase(),
    recordFunction: CbsRecordFunction.DELETE,
    recordId: recordId.trim(),
  }),
};

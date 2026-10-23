import type { CbsWirePayload } from "@/lib/data-schemas";
import type { CbsRecordFunction } from "@/types";
import { createModelPayloads } from "./base-model";

/* -------------------------------------------------------------------------- */
/* Generic Form Engine Payload Builders                                       */
/* -------------------------------------------------------------------------- */

/**
 * Domain payload builders for Generic Form Engine Records.
 * Clean dynamic dispatcher delegating to the universal BaseModel factory template.
 */
export const formPayloads = {
  /**
   * Search record IDs for a specific model / control ('SBI', Record Lookup).
   */
  searchRecordIds: (
    controlName: string,
    searchPattern?: string,
    servicePath?: string,
  ): CbsWirePayload =>
    createModelPayloads(controlName, { servicePath }).searchIds({ recordId: searchPattern }),

  /**
   * Allocate new record ID / sequence ('GNI') or initialize user-defined draft for a specific model / control.
   */
  getNewRecordId: (controlName: string, recordId?: string, servicePath?: string): CbsWirePayload =>
    createModelPayloads(controlName, { servicePath }).getNewId({ recordId }),

  /**
   * Fetch a specific record by ID for a generic form screen.
   */
  fetchRecord: (controlName: string, recordId: string, servicePath?: string): CbsWirePayload =>
    createModelPayloads(controlName, { servicePath }).get(recordId),

  /**
   * Commit / Save form record (Input or Amend).
   */
  commitRecord: (
    controlName: string,
    data: Record<string, unknown>,
    options?: {
      recordId?: string;
      recordFunction?: CbsRecordFunction;
      idempotencyKey?: string;
      servicePath?: string;
    },
  ): CbsWirePayload =>
    createModelPayloads(controlName, { servicePath: options?.servicePath }).save(data, options),

  /**
   * Authorize form record (Maker-Checker approval step).
   */
  authorizeRecord: (controlName: string, recordId: string, servicePath?: string): CbsWirePayload =>
    createModelPayloads(controlName, { servicePath }).authorize(recordId),

  /**
   * Delete / Reverse form record.
   */
  deleteRecord: (controlName: string, recordId: string, servicePath?: string): CbsWirePayload =>
    createModelPayloads(controlName, { servicePath }).delete(recordId),

  /**
   * Hold form record (HLD status).
   */
  holdRecord: (
    controlName: string,
    recordId: string,
    data?: Record<string, unknown>,
    servicePath?: string,
  ): CbsWirePayload => createModelPayloads(controlName, { servicePath }).hold(recordId, data),

  /**
   * Reverse live form record (REV status).
   */
  reverseRecord: (controlName: string, recordId: string, servicePath?: string): CbsWirePayload =>
    createModelPayloads(controlName, { servicePath }).reverse(recordId),
};

import {
  CbsControlTable,
  CbsRecordFunction,
  CbsRequestType,
  type CbsWirePayload,
  DEFAULT_SERVICE_PATH,
} from "@/types";

/* -------------------------------------------------------------------------- */
/* Form Config (Presentation Designer) Payload Builders                       */
/* -------------------------------------------------------------------------- */

/**
 * Domain payload builders for Form Layout / Presentation Designer (SC.FORM.CONFIG).
 */
export const formConfigPayloads = {
  /**
   * Fetch a form presentation specification by ID.
   *
   * @param formId - Target form specification identifier (e.g. "FC.ACCOUNT.RETAIL")
   */
  getFormConfig: (formId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.FORM_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: formId.trim().toUpperCase(),
  }),

  /**
   * Fetch catalog list of available form layout designs.
   */
  listFormConfigs: (): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.FORM_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "LIST",
  }),

  /**
   * Save or update a form presentation layout specification.
   *
   * @param formId - Target form specification identifier
   * @param data - Full form configuration record
   */
  saveFormConfig: (formId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.FORM_CONFIG,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: formId.trim().toUpperCase(),
    data,
  }),

  /**
   * Authorize a form layout specification (Maker-Checker approval step).
   *
   * @param formId - Target form specification identifier to authorize
   */
  authorizeFormConfig: (formId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.FORM_CONFIG,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: formId.trim().toUpperCase(),
  }),
};

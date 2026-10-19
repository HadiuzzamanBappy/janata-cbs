import {
  type CbsControlTable,
  CbsRecordFunction,
  CbsRequestType,
  type CbsWirePayload,
  DEFAULT_SERVICE_PATH,
} from "@/types";

export interface ModelOptions {
  servicePath?: string;
}

export interface CbsModelPayloadFactory<TData = Record<string, unknown>> {
  readonly controlName: string;
  readonly servicePath: string;

  /** S: See / Read single record */
  get: (recordId: string, options?: ModelOptions) => CbsWirePayload;

  /** L: List records */
  list: (options?: ModelOptions & { criteria?: Record<string, unknown> }) => CbsWirePayload;

  /** L: Search record IDs ('SBI') for record finder lookups */
  searchIds: (options?: ModelOptions) => CbsWirePayload;

  /** N: Get New Record Id sequence ('GNI') */
  getNewId: (options?: ModelOptions) => CbsWirePayload;

  /** I: Insert or Update */
  save: (
    data: TData,
    options?: ModelOptions & {
      recordId?: string;
      recordFunction?: CbsRecordFunction;
      idempotencyKey?: string;
    },
  ) => CbsWirePayload;

  /** A: Authorize under Maker-Checker */
  authorize: (recordId: string, options?: ModelOptions) => CbsWirePayload;

  /** D: Delete record */
  delete: (recordId: string, options?: ModelOptions) => CbsWirePayload;

  /** H: Hold draft record */
  hold: (recordId: string, data?: TData, options?: ModelOptions) => CbsWirePayload;

  /** R: Reverse live record */
  reverse: (recordId: string, options?: ModelOptions) => CbsWirePayload;
}

/**
 * Creates standard CBS Wire Payloads for any model.
 */
export function createModelPayloads<TData = Record<string, unknown>>(
  controlName: CbsControlTable | string,
  defaultOptions?: ModelOptions,
): CbsModelPayloadFactory<TData> {
  const control = controlName.trim().toUpperCase();
  const servicePath = defaultOptions?.servicePath?.trim() || DEFAULT_SERVICE_PATH;

  const toPayload = (
    requestType: string,
    recordFunction: CbsRecordFunction,
    recordId = "",
    data?: Record<string, unknown>,
    opts?: ModelOptions & { idempotencyKey?: string },
  ): CbsWirePayload => ({
    servicePath: opts?.servicePath?.trim() || servicePath,
    requestType,
    controlName: control,
    recordFunction,
    recordId: recordId ? recordId.trim().toUpperCase() : "",
    idempotencyKey: opts?.idempotencyKey,
    data,
  });

  return {
    controlName: control,
    servicePath,

    get: (id, opts) => toPayload(CbsRequestType.GET, CbsRecordFunction.SEE, id, undefined, opts),

    list: (opts) => toPayload(CbsRequestType.GRL, CbsRecordFunction.LIST, "", opts?.criteria, opts),

    searchIds: (opts) => toPayload(CbsRequestType.SBI, CbsRecordFunction.LIST, "", undefined, opts),

    getNewId: (opts) => toPayload(CbsRequestType.GNI, CbsRecordFunction.INPUT, "", undefined, opts),

    save: (data, opts) =>
      toPayload(
        CbsRequestType.PUT,
        opts?.recordFunction || CbsRecordFunction.INPUT,
        opts?.recordId,
        data as Record<string, unknown>,
        opts,
      ),

    authorize: (id, opts) =>
      toPayload(CbsRequestType.AUT, CbsRecordFunction.AUTHORIZE, id, undefined, opts),

    delete: (id, opts) =>
      toPayload(CbsRequestType.PUT, CbsRecordFunction.DELETE, id, undefined, opts),

    hold: (id, data, opts) =>
      toPayload(
        CbsRequestType.HLD,
        CbsRecordFunction.HOLD,
        id,
        (data || {}) as Record<string, unknown>,
        opts,
      ),

    reverse: (id, opts) =>
      toPayload(CbsRequestType.REV, CbsRecordFunction.REVERSE, id, undefined, opts),
  };
}

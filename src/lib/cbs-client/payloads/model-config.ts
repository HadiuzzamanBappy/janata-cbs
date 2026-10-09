import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

/**
 * Domain payload builders for Schema / Data Dictionary Designer (MODEL.CONFIG).
 */
export const modelConfigPayloads = {
  /**
   * Fetch a model / schema definition by ID.
   *
   * @param modelId - Target model identifier (e.g. "ACCOUNT")
   */
  getModelConfig: (modelId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MODEL_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: modelId.trim().toUpperCase(),
  }),

  /**
   * Fetch catalog list of available models.
   */
  listModelConfigs: (): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MODEL_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "LIST",
  }),

  /**
   * Save or update a model schema definition.
   *
   * @param modelId - Target model identifier
   * @param data - Full model metadata and property list
   */
  saveModelConfig: (modelId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MODEL_CONFIG,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: modelId.trim().toUpperCase(),
    data,
  }),

  /**
   * Authorize a model schema definition (Maker-Checker approval step).
   *
   * @param modelId - Target model identifier to authorize
   */
  authorizeModelConfig: (modelId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.MODEL_CONFIG,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: modelId.trim().toUpperCase(),
  }),

  /**
   * Delete / Decommission a model schema definition.
   *
   * @param modelId - Target model identifier to delete
   */
  deleteModelConfig: (modelId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MODEL_CONFIG,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: modelId.trim().toUpperCase(),
  }),
};

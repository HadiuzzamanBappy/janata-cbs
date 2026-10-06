import { CbsControlTable } from "../contracts/control-tables";
import type { CbsWirePayload } from "../contracts/envelope-schema";
import { CbsRecordFunction } from "../contracts/record-functions";
import { CbsRequestType } from "../contracts/request-types";

/**
 * Domain payload builders for Schema / Data Dictionary Designer (MODEL.CONFIG)
 */
export const modelConfigPayloads = {
  /** Fetch a model / schema definition by ID */
  getModelConfig: (modelId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.MODEL_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: modelId,
  }),

  /** Save or update a model schema definition */
  saveModelConfig: (modelId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.MODEL_CONFIG,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: modelId,
    data,
  }),

  /** Authorize a model schema definition */
  authorizeModelConfig: (modelId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.MODEL_CONFIG,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: modelId,
  }),
};

import { CbsControlTable } from "../contracts/control-tables";
import type { CbsWirePayload } from "../contracts/envelope-schema";
import { CbsRecordFunction } from "../contracts/record-functions";
import { CbsRequestType } from "../contracts/request-types";

/**
 * Domain payload builders for Close of Business (COB) Pipeline
 */
export const cobPayloads = {
  /** Fetch COB batch pipeline configuration */
  getPipeline: (pipelineId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.COB_REGISTRY,
    recordFunction: CbsRecordFunction.SEE,
    recordId: pipelineId,
  }),

  /** Save / update pipeline stage configuration */
  savePipeline: (pipelineId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.COB_REGISTRY,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: pipelineId,
    data,
  }),

  /** Authorize COB pipeline configuration */
  authorizePipeline: (pipelineId: string): CbsWirePayload => ({
    servicePath: "default",
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.COB_REGISTRY,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: pipelineId,
  }),
};

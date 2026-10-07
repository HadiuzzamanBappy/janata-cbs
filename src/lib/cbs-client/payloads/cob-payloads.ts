import { CbsRecordFunction } from "@/types";
import { type CbsWirePayload, DEFAULT_SERVICE_PATH } from "../types";
import { CbsControlTable } from "../types/control-tables";
import { CbsRequestType } from "../types/request-types";

/**
 * Domain payload builders for Close of Business (COB) Pipeline
 */
export const cobPayloads = {
  /** Fetch COB batch pipeline configuration */
  getPipeline: (pipelineId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_GET,
    controlName: CbsControlTable.COB_REGISTRY,
    recordFunction: CbsRecordFunction.SEE,
    recordId: pipelineId.trim().toUpperCase(),
  }),

  /** Save / update pipeline stage configuration */
  savePipeline: (pipelineId: string, data: Record<string, unknown>): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.COB_REGISTRY,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: pipelineId.trim().toUpperCase(),
    data,
  }),

  /** Authorize COB pipeline configuration */
  authorizePipeline: (pipelineId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_AUTH,
    controlName: CbsControlTable.COB_REGISTRY,
    recordFunction: CbsRecordFunction.AUTHORIZE,
    recordId: pipelineId.trim().toUpperCase(),
  }),

  /** Delete / Decommission COB pipeline configuration */
  deletePipeline: (pipelineId: string): CbsWirePayload => ({
    servicePath: DEFAULT_SERVICE_PATH,
    requestType: CbsRequestType.RECORD_PUT,
    controlName: CbsControlTable.COB_REGISTRY,
    recordFunction: CbsRecordFunction.DELETE,
    recordId: pipelineId.trim().toUpperCase(),
  }),
};

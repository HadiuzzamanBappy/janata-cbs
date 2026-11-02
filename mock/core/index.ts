import "server-only";

import type { CbsWirePayload, GrpcEnvelope } from "@/lib/data-schemas";
import type { GrpcRequest, GrpcResponse } from "@/lib/infra-grpc/generated/service";
import { type ApiResponse, CbsRecordFunction, CbsRequestType } from "@/types";
import { buildMockUserAuthResponse, getMockUserResponse, mockLogin } from "./auth-simulator";
import {
  getMockFormPayload,
  getMockInquiryPayload,
  handleGetFormConfig,
  handleGetModelConfig,
  handleInquiry,
  handleMutation,
  handleNextId,
  handleRecordList,
  handleSearchById,
  handleSeeRecord,
} from "./handlers";
import { notFoundResult, toGrpcResponse } from "./response-factory";

export {
  buildMockUserAuthResponse,
  getMockFormPayload,
  getMockInquiryPayload,
  getMockUserResponse,
  handleSearchById,
  mockLogin,
};

/**
 * Handles offline static CRUD and inquiry responses for the `/api/proxy` endpoint.
 * Direct dispatch following CBS Core requestType verbs.
 * Accepts either a canonical CbsWirePayload or positional (requestType, controlName, recordId, data).
 */
export function getMockProxyResponse(
  requestTypeOrPayload: string | CbsWirePayload,
  controlName?: string,
  recordId?: string,
  data?: Record<string, unknown>,
): ApiResponse {
  const payload: CbsWirePayload =
    typeof requestTypeOrPayload === "object"
      ? requestTypeOrPayload
      : {
          requestType: requestTypeOrPayload,
          controlName,
          recordId,
          data,
        };

  const reqType = (payload.requestType || CbsRequestType.GET).trim().toUpperCase();
  const cleanCmd = (payload.controlName || "").trim().toUpperCase();
  const recId = (payload.recordId || "").trim().toUpperCase();

  const normalizedPayload: CbsWirePayload = {
    ...payload,
    requestType: reqType,
    controlName: cleanCmd,
    recordId: recId,
  };

  // 1. GMC (Get Model Configuration Schema)
  if (reqType === CbsRequestType.GMC) {
    return handleGetModelConfig(normalizedPayload);
  }

  // 2. GFC (Get Form Configuration Layout Presentation)
  if (reqType === CbsRequestType.GFC) {
    return handleGetFormConfig(normalizedPayload);
  }

  // 3. INQ (Dynamic Inquiry Execution)
  if (reqType === CbsRequestType.INQ) {
    return handleInquiry(normalizedPayload);
  }

  // 4. GNI (Get Next Sequence ID)
  if (reqType === CbsRequestType.GNI) {
    return handleNextId(normalizedPayload);
  }

  // 5. SBI / RIL (Search by Record ID / Wildcard or Key List)
  if (reqType === CbsRequestType.SBI || reqType === CbsRequestType.RIL) {
    return handleSearchById(normalizedPayload);
  }

  // 6. GRL / GCQ / GMV / GGL (Generic Record Collection Queries)
  if (
    reqType === CbsRequestType.GRL ||
    reqType === CbsRequestType.GCQ ||
    reqType === CbsRequestType.GMV ||
    reqType === CbsRequestType.GGL
  ) {
    return handleRecordList(normalizedPayload);
  }

  // 7. S / SEE / GET / GRV (Read / View Single Record in View Mode)
  if (
    reqType === CbsRequestType.GET ||
    reqType === CbsRequestType.GRV ||
    reqType === "S" ||
    reqType === "SEE" ||
    payload.recordFunction === CbsRecordFunction.SEE
  ) {
    return handleSeeRecord(normalizedPayload);
  }

  // 8. Transactional Mutations (PUT, AUT, DEL, HLD, REV, TRV, SMC, AMC, SFC, SMR, DTR, ATT, CTT, AFT)
  const isMutation =
    reqType === CbsRequestType.PUT ||
    reqType === CbsRequestType.AUT ||
    reqType === CbsRequestType.DEL ||
    reqType === CbsRequestType.HLD ||
    reqType === CbsRequestType.REV ||
    reqType === CbsRequestType.TRV ||
    reqType === CbsRequestType.SMC ||
    reqType === CbsRequestType.AMC ||
    reqType === CbsRequestType.SFC ||
    reqType === CbsRequestType.SMR ||
    reqType === CbsRequestType.DTR ||
    reqType === CbsRequestType.ATT ||
    reqType === CbsRequestType.CTT ||
    reqType === CbsRequestType.AFT;

  if (isMutation) {
    return handleMutation(normalizedPayload);
  }

  return notFoundResult(`Unsupported requestType "${reqType}" for model "${cleanCmd}"`);
}

/**
 * Simulates unary gRPC process request from local database fixtures.
 * Universally dispatches all protocol operations through getMockProxyResponse.
 */
export async function mockProcess(req: GrpcRequest): Promise<GrpcResponse> {
  const cleanCmd = (req.controlName || "").trim().toUpperCase();
  const reqType = (req.requestType || "").trim().toUpperCase();
  const recId = (req.recordId || "").trim().toUpperCase();

  // Dispatch all standard protocol operations through the universal mock proxy router
  const result = getMockProxyResponse(
    reqType,
    cleanCmd,
    recId,
    req.data as Record<string, unknown>,
  );

  return toGrpcResponse(result, req.idempotencyKey);
}

/**
 * Handles raw wire payload from HTTP Proxy (/api/proxy).
 */
export async function mockDispatch(
  payload: CbsWirePayload | GrpcEnvelope,
  _token?: string,
): Promise<ApiResponse> {
  return getMockProxyResponse(payload as CbsWirePayload);
}

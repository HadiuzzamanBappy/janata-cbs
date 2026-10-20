import "server-only";

import type { GrpcRequest, GrpcResponse } from "@/lib/infra-grpc/generated/service";
import type { ApiResponse, CbsWirePayload, GrpcEnvelope } from "@/types";
import {
  buildMockUserAuthResponse,
  getMockUserResponse,
  mockLogin,
  SYS_USER_AUTH_RESPONSES,
} from "./auth-simulator";
import {
  getMockFormPayload,
  getMockInquiryPayload,
  getMockMenuPayload,
  handleGetMenu,
  handleGetModelConfig,
  handleGetRecord,
  handleInquiry,
  handleMutation,
  handleNextId,
  handleRecordList,
} from "./operation-handlers";
import { notFoundResult, successResult, toGrpcResponse } from "./response-factory";

export {
  buildMockUserAuthResponse,
  getMockFormPayload,
  getMockInquiryPayload,
  getMockMenuPayload,
  getMockUserResponse,
  mockLogin,
  SYS_USER_AUTH_RESPONSES,
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

  const reqType = (payload.requestType || "GET").trim().toUpperCase();
  const cleanCmd = (payload.controlName || "").trim().toUpperCase();
  const recId = (payload.recordId || "").trim().toUpperCase();

  const normalizedPayload: CbsWirePayload = {
    ...payload,
    requestType: reqType,
    controlName: cleanCmd,
    recordId: recId,
  };

  // 1. GUM (Get User Menu Navigation Tree)
  if (reqType === "GUM" || cleanCmd === "GUM") {
    return handleGetMenu();
  }

  // 2. GMC (Get Model Configuration Schema)
  if (reqType === "GMC" || cleanCmd === "FORM") {
    return handleGetModelConfig(normalizedPayload);
  }

  // 3. Legacy Inquiry Spec (GET on INQUIRY) vs Query Execution (INQ)
  if (cleanCmd === "INQUIRY" && reqType !== "INQ") {
    const spec = getMockInquiryPayload(recId || cleanCmd);
    if (!spec) return notFoundResult(`Inquiry spec for ${recId || cleanCmd} not found`);
    return successResult(spec, "Inquiry spec loaded from simulated database");
  }

  if (reqType === "INQ" || cleanCmd === "INQUIRY") {
    return handleInquiry(normalizedPayload);
  }

  // 4. GNI (Get Next Sequence ID)
  if (reqType === "GNI") {
    return handleNextId(normalizedPayload);
  }

  // 5. Transactional Mutations (PUT, AUT, DEL, HLD, REV)
  const isMutation =
    reqType === "PUT" ||
    reqType === "AUT" ||
    reqType === "DEL" ||
    reqType === "HLD" ||
    reqType === "REV";
  if (isMutation) {
    return handleMutation(normalizedPayload);
  }

  // 6. GRL / SBI (Generic Record List / Record ID Search)
  if (reqType === "GRL" || reqType === "SBI" || reqType === "RECORD_LIST" || !recId) {
    return handleRecordList(normalizedPayload);
  }

  // 7. GET (Get Single Record)
  if (reqType === "GET") {
    return handleGetRecord(normalizedPayload);
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
 * Simulates CBS Dispatcher envelope processing from local database fixtures.
 */
export async function mockDispatch(envelope: GrpcEnvelope): Promise<ApiResponse> {
  const req: GrpcRequest = {
    idempotencyKey: envelope.idempotencyKey || "",
    clientId: envelope.clientId,
    requestType: envelope.requestType,
    controlName: envelope.controlName ?? "",
    recordFunction: envelope.recordFunction,
    recordId: envelope.recordId,
    branchCode: envelope.branchCode,
    authLevel: envelope.authLevel,
    userId: envelope.userId,
    data: envelope.data,
  };

  const res = await mockProcess(req);
  return {
    success: res.statusCode === 200,
    status: res.status,
    statusCode: res.statusCode,
    message: res.message,
    idempotencyKey: res.idempotencyKey,
    errors: res.errors,
    timestamp: res.timestamp,
    data: res.data ?? null,
  };
}

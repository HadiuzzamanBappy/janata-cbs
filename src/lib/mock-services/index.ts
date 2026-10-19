import "server-only";

import type { GrpcRequest, GrpcResponse } from "@/lib/infra-grpc/generated/service";
import type { ApiResponse, GrpcEnvelope } from "@/types";
import {
  buildMockUserAuthResponse,
  getMockUserResponse,
  mockLogin,
  SYS_USER_AUTH_RESPONSES,
} from "./auth-simulator";
import {
  getMockBranchesPayload,
  getMockControlsPayload,
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
import type { MockProxyResult, OperationContext } from "./types";

export type { MockProxyResult, OperationContext };
export {
  buildMockUserAuthResponse,
  getMockBranchesPayload,
  getMockControlsPayload,
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
 */
export function getMockProxyResponse(
  requestType: string,
  controlName?: string,
  recordId?: string,
  data?: Record<string, unknown>,
): MockProxyResult {
  const reqType = (requestType || "GET").trim().toUpperCase();
  const cleanCmd = (controlName || "").trim().toUpperCase();
  const recId = (recordId || "").trim().toUpperCase();

  const ctx: OperationContext = {
    requestType: reqType,
    controlName: cleanCmd,
    recordId: recId,
    data,
  };

  // 1. GUM (Get User Menu)
  if (reqType === "GUM" || cleanCmd === "MENU") {
    return handleGetMenu();
  }

  // 2. GMC (Get Model Configuration Schema)
  if (reqType === "GMC" || cleanCmd === "FORM") {
    return handleGetModelConfig(ctx);
  }

  // 3. Inquiry Spec (GET on INQUIRY) vs Query Execution (INQ)
  if (cleanCmd === "INQUIRY" && reqType !== "INQ") {
    const spec = getMockInquiryPayload(recId || cleanCmd);
    if (!spec) return notFoundResult(`Inquiry spec for ${recId || cleanCmd} not found`);
    return successResult(spec, "Inquiry spec loaded from simulated database");
  }

  if (reqType === "INQ" || cleanCmd === "INQUIRY") {
    return handleInquiry(ctx);
  }

  // 4. GNI (Get Next Sequence ID)
  if (reqType === "GNI") {
    return handleNextId(ctx);
  }

  // 5. Transactional Mutations (PUT, AUT, DEL, HLD, REV)
  const isMutation =
    reqType === "PUT" ||
    reqType === "AUT" ||
    reqType === "DEL" ||
    reqType === "HLD" ||
    reqType === "REV";
  if (isMutation) {
    return handleMutation(ctx);
  }

  // 6. GRL / SBI (Generic Record List / Record ID Search)
  if (reqType === "GRL" || reqType === "SBI" || reqType === "RECORD_LIST" || !recId) {
    return handleRecordList(ctx);
  }

  // 7. GET (Get Single Record)
  if (reqType === "GET") {
    return handleGetRecord(ctx);
  }

  return notFoundResult(`Unsupported requestType "${requestType}" for model "${cleanCmd}"`);
}

/**
 * Simulates unary gRPC process request from local database fixtures.
 */
export async function mockProcess(req: GrpcRequest): Promise<GrpcResponse> {
  const cleanCmd = (req.controlName || "").trim().toUpperCase();
  const reqType = (req.requestType || "").trim().toUpperCase();
  const recId = (req.recordId || "").trim().toUpperCase();

  // Branch Directory
  if (cleanCmd === "BRANCH" || (reqType === "GRL" && cleanCmd === "SC.BRANCH")) {
    return toGrpcResponse(
      successResult(getMockBranchesPayload(), "Branches loaded from simulated database"),
      req.idempotencyKey,
    );
  }

  // System Controls
  if (cleanCmd === "CONTROL" || (reqType === "GRL" && cleanCmd === "SC.CONTROL")) {
    return toGrpcResponse(
      successResult(getMockControlsPayload(), "Controls loaded from simulated database"),
      req.idempotencyKey,
    );
  }

  // Dispatch all standard protocol operations
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
    status: res.status,
    statusCode: res.statusCode,
    message: res.message,
    idempotencyKey: res.idempotencyKey,
    errors: res.errors,
    timestamp: res.timestamp,
    data: res.data ?? null,
  };
}

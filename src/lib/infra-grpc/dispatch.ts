import "server-only";

import { randomUUID } from "node:crypto";
import { appConfig, getService, REQUEST_TYPE_OVERLAYS } from "@/lib/core-config/server";
import { grpcProcess, grpcStatusToHttp, type ProcessKind } from "@/lib/infra-grpc/client";
import type { GrpcRequest } from "@/lib/infra-grpc/generated/service";
import type { ApiResponse, GrpcEnvelope } from "@/types";

/* -------------------------------------------------------------------------- */
/* Classification & Overlay Helpers                                           */
/* -------------------------------------------------------------------------- */

const FINANCIAL_REQUEST_TYPES = new Set(
  appConfig.grpc.financialTransactionTypes.map((s) => s.trim().toUpperCase()),
);

/**
 * Classifies an incoming transaction into financial or nonfinancial category.
 */
function classify(requestType: string): ProcessKind {
  return FINANCIAL_REQUEST_TYPES.has(requestType.toUpperCase()) ? "financial" : "nonfinancial";
}

/**
 * Resolves specialized domain command overlays based on control keyword tokens.
 */
function resolveRequestType(controlName: string | undefined, originalType: string): string {
  if (!controlName) return originalType;
  const controlTags = controlName.split(",");

  for (const [tag, overrides] of Object.entries(REQUEST_TYPE_OVERLAYS)) {
    if (controlTags.includes(tag) && overrides[originalType]) {
      return overrides[originalType];
    }
  }

  return originalType;
}

/* -------------------------------------------------------------------------- */
/* Transport Executions                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Dispatches an envelope via binary gRPC transport channel.
 */
async function executeGrpcTransport(
  address: string,
  kind: ProcessKind,
  envelope: GrpcEnvelope,
  token: string,
): Promise<ApiResponse> {
  const req: GrpcRequest = {
    idempotencyKey: envelope.idempotencyKey || (kind === "financial" ? randomUUID() : ""),
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

  const res = await grpcProcess(address, kind, req, { token });
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

/**
 * Dispatches an envelope via downstream HTTP REST microservice.
 */
async function executeRestTransport(
  baseUrl: string,
  envelope: GrpcEnvelope,
  token: string,
): Promise<ApiResponse> {
  const restEndpoint = `${baseUrl}/${envelope.requestType}`;
  const response = await fetch(restEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(envelope),
    cache: "no-store",
  });

  let res: Partial<ApiResponse> = {};
  try {
    res = (await response.json()) as Partial<ApiResponse>;
  } catch {
    res = {
      status: response.ok ? "SUCCESS" : "FAIL",
      statusCode: response.status,
      message: `Downstream service returned non-JSON response (${response.statusText || response.status})`,
      errors: [response.statusText || `HTTP_${response.status}`],
    };
  }

  return {
    status: res.status || "SUCCESS",
    statusCode: res.statusCode || response.status,
    message: res.message || "",
    idempotencyKey: res.idempotencyKey || "",
    errors: res.errors || [],
    timestamp: res.timestamp || new Date().toISOString(),
    data: res.data ?? null,
  };
}

/* -------------------------------------------------------------------------- */
/* Public Dispatcher API                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Universal CBS Request Dispatcher.
 * Dynamically routes requests across either binary gRPC or HTTP REST microservices.
 */
export async function dispatch(envelope: GrpcEnvelope, token: string): Promise<ApiResponse> {
  try {
    const isDefault = envelope.servicePath === "default" || !envelope.servicePath;
    const targetServiceKey = isDefault ? "default" : envelope.servicePath.split("/")[0];

    const service = getService(targetServiceKey);
    if (!service) {
      return {
        status: "ERROR",
        statusCode: 404,
        message: `Unknown service path "${envelope.servicePath}" registered.`,
        idempotencyKey: "",
        errors: [`Service "${targetServiceKey}" not found`],
        timestamp: new Date().toISOString(),
        data: null,
      };
    }

    const resolvedType = resolveRequestType(envelope.controlName, envelope.requestType);
    const enrichedEnvelope: GrpcEnvelope =
      resolvedType === envelope.requestType ? envelope : { ...envelope, requestType: resolvedType };
    const kind = classify(enrichedEnvelope.requestType);

    if (service.protocol === "rest") {
      return await executeRestTransport(service.url, enrichedEnvelope, token);
    }

    return await executeGrpcTransport(service.url, kind, enrichedEnvelope, token);
  } catch (error: unknown) {
    const { status, message } = grpcStatusToHttp(error);
    return {
      status: "FAIL",
      statusCode: status,
      message,
      idempotencyKey: "",
      errors: [message],
      timestamp: new Date().toISOString(),
      data: null,
    };
  }
}

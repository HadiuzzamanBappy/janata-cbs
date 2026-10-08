import "server-only";
import { randomUUID } from "node:crypto";
import { appConfig } from "@/lib/config";
import { getService, REQUEST_TYPE_OVERLAYS } from "@/lib/config/service-endpoints";
import { grpcProcess, grpcStatusToHttp, type ProcessKind } from "@/lib/grpc/client";
import type { GrpcRequest } from "@/lib/grpc/generated/service";
import type { ApiResponse, GrpcEnvelope } from "@/types";

export type { GrpcEnvelope };

const FINANCIAL_REQUEST_TYPES = new Set(
  appConfig.grpc.financialTransactionTypes.map((s) => s.trim().toUpperCase()),
);

function classify(requestType: string): ProcessKind {
  return FINANCIAL_REQUEST_TYPES.has(requestType.toUpperCase()) ? "financial" : "nonfinancial";
}

/**
 * Resolves any specialized domain override for a given control and requestType.
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

/**
 * Dispatches an envelope via gRPC transport.
 */
async function executeGrpcTransport(
  address: string,
  kind: ProcessKind,
  envelope: GrpcEnvelope,
  token: string,
): Promise<ApiResponse> {
  const req: GrpcRequest = {
    idempotencyKey: kind === "financial" ? randomUUID() : "",
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
 * Dispatches an envelope via downstream HTTP REST transport.
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

  const res = await response.json();
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

/**
 * Universal CBS Request Dispatcher.
 * Dynamically routes to gRPC or REST microservices based on protocol metadata in the Service Registry.
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

    envelope.requestType = resolveRequestType(envelope.controlName, envelope.requestType);
    const kind = classify(envelope.requestType);

    if (service.protocol === "rest") {
      return await executeRestTransport(service.url, envelope, token);
    }

    return await executeGrpcTransport(service.url, kind, envelope, token);
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



import "server-only";
import { randomUUID } from "node:crypto";
import { appConfig, getService, REQUEST_TYPE_OVERLAYS } from "@/lib/config/server";
import { grpcProcess, grpcStatusToHttp, type ProcessKind } from "@/lib/grpc/client";
import type { GrpcRequest } from "@/lib/grpc/generated/service";
import type { ApiResponse, GrpcEnvelope } from "@/types";

const FINANCIAL_REQUEST_TYPES = new Set(
  appConfig.grpc.financialTransactionTypes.map((s) => s.trim().toUpperCase()),
);

/**
 * Classifies an incoming transaction into financial or nonfinancial category.
 *
 * @param requestType - CBS transaction request type code (e.g. 'AFT', 'ACT', 'GRL').
 * @returns 'financial' if requiring idempotency and ledger mutation semantics, else 'nonfinancial'.
 */
function classify(requestType: string): ProcessKind {
  return FINANCIAL_REQUEST_TYPES.has(requestType.toUpperCase()) ? "financial" : "nonfinancial";
}

/**
 * Resolves specialized domain command overlays based on control keyword tokens.
 *
 * @param controlName - Control tag identifier (e.g. "USER,LIST", "FUNDS.TRANSFER").
 * @param originalType - Default request type code.
 * @returns Overlaid request type code if matched, otherwise the original code.
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
 * Dispatches an envelope via binary gRPC transport channel.
 *
 * @param address - Backend gRPC host address.
 * @param kind - 'financial' or 'nonfinancial' process classification.
 * @param envelope - Session-enriched gRPC envelope.
 * @param token - Authenticated user bearer token.
 * @returns Standardized ApiResponse.
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
 * Dispatches an envelope via downstream HTTP REST microservice.
 * Safely guards against non-JSON reverse proxy error pages (e.g., 502/504 Bad Gateway).
 *
 * @param baseUrl - Base URL for the downstream REST service.
 * @param envelope - Session-enriched envelope.
 * @param token - Authenticated user bearer token.
 * @returns Standardized ApiResponse.
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

/**
 * Universal CBS Request Dispatcher.
 * Dynamically routes requests across either binary gRPC or HTTP REST microservices
 * based on registry protocol metadata and transaction overrides.
 *
 * @param envelope - Enriched transaction payload with officer session details.
 * @param token - Authenticated session bearer token.
 * @returns Standardized ApiResponse contract.
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

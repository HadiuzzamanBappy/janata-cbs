import "server-only";
import { randomUUID } from "node:crypto";
import {
  type GrpcRequest,
  grpcProcess,
  type ProcessKind,
} from "@/lib/core/grpc";
import { env } from "@/lib/env";
import { getServiceUrl } from "@/lib/services";
import type { APIResponse, Envelope } from "@/types";

export type { Envelope };

const FINANCIAL_REQUEST_TYPES = new Set(
  (env.GRPC_FINANCIAL_TYPES || "AFT,ACT")
    .split(",")
    .map((s) => s.trim().toUpperCase()),
);

function classify(requestType: string): ProcessKind {
  return FINANCIAL_REQUEST_TYPES.has(requestType.toUpperCase())
    ? "financial"
    : "nonfinancial";
}

export async function dispatch(
  envelope: Envelope,
  token: string,
): Promise<APIResponse> {
  try {
    const isDefault =
      envelope.servicePath === "default" || !envelope.servicePath;
    const targetServiceKey = isDefault
      ? process.env.NODE_ENV === "development"
        ? "defaultdev"
        : "default"
      : envelope.servicePath.split("/")[0];

    const serviceUrl = getServiceUrl(targetServiceKey);

    if (!serviceUrl) {
      return {
        status: "ERROR",
        statusCode: 404,
        message: `Unknown service path "${envelope.servicePath}" defined.`,
        idempotencyKey: "",
        errors: [],
        timestamp: new Date().toISOString(),
        data: null,
      };
    }

    const controlNameArray = envelope.controlName
      ? envelope.controlName.split(",")
      : [];

    const requestType =
      controlNameArray.includes("USER") && envelope.requestType === "AUT"
        ? "UAU"
        : controlNameArray.includes("FUNDS.TRANSFER") &&
            ["PUT", "AUT", "REV"].includes(envelope.requestType)
          ? "AFT"
          : controlNameArray.includes("CASH.TRANSFER") &&
              ["PUT", "AUT", "REV"].includes(envelope.requestType)
            ? "ACT"
            : envelope.requestType;

    envelope.requestType = requestType;
    const kind = classify(envelope.requestType);

    if (!isDefault) {
      // ---- REST Microservice Transport ----
      // TODO: [Step 8 - Resilience] Implement exponential backoff retry policy for REST microservice endpoints.
      const restEndpoint = `${serviceUrl}/${envelope.requestType}`;
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
    } else {
      // ---- gRPC Core Microservice Transport ----
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

      const res = await grpcProcess(serviceUrl, kind, req, { token });
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
  } catch (error: any) {
    return {
      status: "FAIL",
      statusCode: 500,
      message: error?.details || error?.message || "Internal Dispatch Error",
      idempotencyKey: "",
      errors: [error?.message || "Internal Server Error"],
      timestamp: new Date().toISOString(),
      data: null,
    };
  }
}

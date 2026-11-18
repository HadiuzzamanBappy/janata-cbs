import "server-only";

import { serverConfig } from "@/lib/core-config/server";
import type { GrpcRequest, GrpcResponse } from "./generated/service";

/** A REST microservice that couldn't be reached or didn't answer with a CBS envelope. */
export class RestTransportError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "RestTransportError";
  }
}

/** HTTP status for a service the BFF couldn't get a CBS answer from. */
export const UPSTREAM_STATUS = { BAD_GATEWAY: 502, UNAVAILABLE: 503, TIMEOUT: 504 } as const;

const asString = (v: unknown): string => (typeof v === "string" ? v : "");

/**
 * Sends the same flat request the core receives over gRPC (plus `servicePath`) as a JSON POST to
 * the service's endpoint URL, with the core login token as `Authorization: Bearer` and the
 * `GRPC_TIMEOUT_MS` deadline. The reply must be the CBS envelope (`status`, `statusCode`, `data`…).
 */
export async function restProcess(
  url: string,
  body: GrpcRequest & { readonly servicePath: string },
  token: string,
): Promise<GrpcResponse> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(serverConfig.grpc.timeoutMs),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new RestTransportError(
        `Service "${body.servicePath}" timed out after ${serverConfig.grpc.timeoutMs} ms`,
        UPSTREAM_STATUS.TIMEOUT,
      );
    }
    throw new RestTransportError(
      `Service "${body.servicePath}" is unreachable`,
      UPSTREAM_STATUS.UNAVAILABLE,
    );
  }

  const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!json || typeof json.status !== "string") {
    throw new RestTransportError(
      `Service "${body.servicePath}" returned HTTP ${res.status} without a CBS response`,
      UPSTREAM_STATUS.BAD_GATEWAY,
    );
  }

  const data = json.data;
  return {
    status: json.status,
    statusCode: typeof json.statusCode === "number" ? json.statusCode : res.status,
    idempotencyKey: asString(json.idempotencyKey),
    message: asString(json.message),
    data: data && typeof data === "object" ? (data as GrpcResponse["data"]) : undefined,
    errors: Array.isArray(json.errors) ? json.errors.map(String) : [],
    timestamp: asString(json.timestamp),
  };
}

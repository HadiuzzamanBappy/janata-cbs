import "server-only";

import {
  type CallOptions,
  type ChannelCredentials,
  credentials,
  status as grpcStatus,
  Metadata,
  type ServiceError,
} from "@grpc/grpc-js";
import { appConfig } from "@/lib/core-config/server";
import {
  type GrpcRequest,
  type GrpcResponse,
  GrpcServiceClient,
  type LoginRequest,
} from "@/lib/infra-grpc/generated/service";
import { mockLogin, mockProcess } from "@/lib/mock-services";

/**
 * Single source of truth for runtime mode check.
 */
export const isStaticMode = (): boolean => appConfig.dataSource === "static";

/* -------------------------------------------------------------------------- */
/* Channel Pool Registry                                                      */
/* -------------------------------------------------------------------------- */

declare global {
  var __grpcClientPool: Map<string, GrpcServiceClient> | undefined;
}

if (!globalThis.__grpcClientPool) {
  globalThis.__grpcClientPool = new Map<string, GrpcServiceClient>();
}
const clientPool: Map<string, GrpcServiceClient> = globalThis.__grpcClientPool;

/**
 * Constructs a configured gRPC client channel with TLS security and keepalive options.
 */
function buildClient(address: string): GrpcServiceClient {
  const creds: ChannelCredentials = appConfig.grpc.useTls
    ? credentials.createSsl()
    : credentials.createInsecure();

  return new GrpcServiceClient(address, creds, {
    "grpc.keepalive_time_ms": appConfig.grpc.keepaliveTimeMs,
    "grpc.keepalive_timeout_ms": appConfig.grpc.keepaliveTimeoutMs,
  });
}

/**
 * Retrieves or lazily instantiates a pooled gRPC client channel for a target address.
 */
export function getClient(address: string): GrpcServiceClient {
  let client = clientPool.get(address);
  if (!client) {
    client = buildClient(address);
    clientPool.set(address, client);
  }
  return client;
}

/* -------------------------------------------------------------------------- */
/* Types & Execution Interfaces                                               */
/* -------------------------------------------------------------------------- */

export type ProcessKind = "financial" | "nonfinancial";

export interface CallOpts {
  token?: string;
  deadlineMs?: number;
  metadata?: Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/* RPC Execution Procedures                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Unauthenticated RPC: Authenticates user credentials with the backend CBS host.
 */
export function loginProcess(req: LoginRequest, _opts: CallOpts = {}): Promise<GrpcResponse> {
  if (isStaticMode()) {
    return mockLogin(req);
  }

  const address = appConfig.grpc.host;
  const client = getClient(address);

  return new Promise<GrpcResponse>((resolve, reject) => {
    client.loginProcess(req, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

/**
 * Executes an authenticated unary gRPC transaction against the target service address.
 */
export function grpcProcess(
  address: string,
  kind: ProcessKind,
  req: GrpcRequest,
  opts: CallOpts = {},
): Promise<GrpcResponse> {
  if (isStaticMode()) {
    return mockProcess(req);
  }

  const client = getClient(address);

  const metadata = new Metadata();
  if (opts.token) {
    metadata.set("authorization", `Bearer ${opts.token}`);
  }
  if (opts.metadata) {
    for (const [k, v] of Object.entries(opts.metadata)) {
      metadata.set(k, String(v));
    }
  }

  const ms = opts.deadlineMs ?? appConfig.grpc.timeoutMs;
  const options: CallOptions = { deadline: new Date(Date.now() + ms) };

  return new Promise<GrpcResponse>((resolve, reject) => {
    const cb = (err: ServiceError | null, res: GrpcResponse) => {
      if (err) reject(err);
      else resolve(res);
    };

    if (kind === "financial") {
      client.financialProcess(req, metadata, options, cb);
    } else {
      client.nonFinancialProcess(req, metadata, options, cb);
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Status & Error Mapping                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Maps a gRPC status code and service error to standard HTTP status codes.
 */
export function grpcStatusToHttp(err: unknown): {
  status: number;
  message: string;
} {
  const e = err as ServiceError;
  const map: Record<number, number> = {
    [grpcStatus.OK]: 200,
    [grpcStatus.INVALID_ARGUMENT]: 400,
    [grpcStatus.UNAUTHENTICATED]: 401,
    [grpcStatus.PERMISSION_DENIED]: 403,
    [grpcStatus.NOT_FOUND]: 404,
    [grpcStatus.ALREADY_EXISTS]: 409,
    [grpcStatus.DEADLINE_EXCEEDED]: 504,
    [grpcStatus.UNAVAILABLE]: 503,
  };
  return {
    status: map[e?.code ?? grpcStatus.UNKNOWN] ?? 500,
    message: e?.details || e?.message || "gRPC service invocation failed",
  };
}

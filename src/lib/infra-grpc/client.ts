import "server-only";

import {
  type CallOptions,
  credentials,
  status as grpcStatus,
  Metadata,
  type ServiceError,
} from "@grpc/grpc-js";
import { mockLogin, mockProcess } from "@mock/core";
import { serverConfig } from "@/lib/core-config/server";
import {
  type GrpcRequest,
  type GrpcResponse,
  GrpcServiceClient,
  type LoginRequest,
} from "@/lib/infra-grpc/generated/service";

const MAX_GRPC_MESSAGE_BYTES = 16 * 1024 * 1024; // 16 MB for large INQ / GMC / GFC payloads

/**
 * Single source of truth for static mock vs live gRPC runtime mode.
 */
export const isStaticMode = (): boolean => serverConfig.dataSource === "static";

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
 * Retrieves or lazily creates a pooled gRPC channel with TLS, keepalive, and message size limits.
 */
function getClient(address: string): GrpcServiceClient {
  const target = address.trim().replace(/^https?:\/\//i, "");
  let client = clientPool.get(target);
  if (!client) {
    const creds = serverConfig.grpc.useTls ? credentials.createSsl() : credentials.createInsecure();

    client = new GrpcServiceClient(target, creds, {
      "grpc.keepalive_time_ms": serverConfig.grpc.keepaliveTimeMs,
      "grpc.keepalive_timeout_ms": serverConfig.grpc.keepaliveTimeoutMs,
      "grpc.max_receive_message_length": MAX_GRPC_MESSAGE_BYTES,
      "grpc.max_send_message_length": MAX_GRPC_MESSAGE_BYTES,
    });
    clientPool.set(target, client);
  }
  return client;
}

/* -------------------------------------------------------------------------- */
/* RPC Execution Helpers & Procedures                                         */
/* -------------------------------------------------------------------------- */

function createCallOptions(): CallOptions {
  return { deadline: new Date(Date.now() + serverConfig.grpc.timeoutMs) };
}

function unaryCall(
  invoke: (cb: (err: ServiceError | null, res: GrpcResponse) => void) => void,
): Promise<GrpcResponse> {
  return new Promise<GrpcResponse>((resolve, reject) => {
    invoke((err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

function invokeProcessRpc(
  address: string,
  isFinancial: boolean,
  req: GrpcRequest,
  token: string,
): Promise<GrpcResponse> {
  if (isStaticMode()) {
    return mockProcess(req);
  }

  const client = getClient(address);
  const metadata = new Metadata();
  if (token) {
    metadata.set("authorization", `Bearer ${token}`);
  }

  const options = createCallOptions();
  return unaryCall((cb) =>
    isFinancial
      ? client.financialProcess(req, metadata, options, cb)
      : client.nonFinancialProcess(req, metadata, options, cb),
  );
}

/**
 * Unauthenticated RPC: Authenticates user credentials with the backend CBS host.
 */
export function loginProcess(req: LoginRequest): Promise<GrpcResponse> {
  if (isStaticMode()) {
    return mockLogin(req);
  }

  const client = getClient(serverConfig.grpc.host);
  return unaryCall((cb) => client.loginProcess(req, new Metadata(), createCallOptions(), cb));
}

/**
 * Financial RPC: Executes money-movement operations with strict consistency and idempotency.
 */
export function financialProcess(
  address: string,
  req: GrpcRequest,
  token: string,
): Promise<GrpcResponse> {
  return invokeProcessRpc(address, true, req, token);
}

/**
 * Non-Financial RPC: Executes maintenance, lookups, schemas, and authorizations.
 */
export function nonFinancialProcess(
  address: string,
  req: GrpcRequest,
  token: string,
): Promise<GrpcResponse> {
  return invokeProcessRpc(address, false, req, token);
}

/* -------------------------------------------------------------------------- */
/* Status & Error Mapping                                                     */
/* -------------------------------------------------------------------------- */

const GRPC_TO_HTTP_STATUS: Record<number, number> = {
  [grpcStatus.OK]: 200,
  [grpcStatus.CANCELLED]: 499,
  [grpcStatus.INVALID_ARGUMENT]: 400,
  [grpcStatus.UNAUTHENTICATED]: 401,
  [grpcStatus.PERMISSION_DENIED]: 403,
  [grpcStatus.NOT_FOUND]: 404,
  [grpcStatus.ALREADY_EXISTS]: 409,
  [grpcStatus.RESOURCE_EXHAUSTED]: 429,
  [grpcStatus.FAILED_PRECONDITION]: 412,
  [grpcStatus.ABORTED]: 409,
  [grpcStatus.OUT_OF_RANGE]: 400,
  [grpcStatus.UNIMPLEMENTED]: 501,
  [grpcStatus.INTERNAL]: 500,
  [grpcStatus.DATA_LOSS]: 500,
  [grpcStatus.DEADLINE_EXCEEDED]: 504,
  [grpcStatus.UNAVAILABLE]: 503,
};

/**
 * Maps a gRPC status code and service error to standard HTTP status codes.
 */
export function grpcStatusToHttp(err: unknown): {
  status: number;
  message: string;
} {
  const e = err as ServiceError;
  return {
    status: GRPC_TO_HTTP_STATUS[e?.code ?? grpcStatus.UNKNOWN] ?? 500,
    message: e?.details || e?.message || "gRPC service invocation failed",
  };
}

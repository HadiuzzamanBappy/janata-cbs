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

/**
 * Global registry cache for gRPC client channels by target host address.
 * Preserves active connection pools across Next.js dev server HMR cycles
 * and prevents socket descriptor exhaustion.
 */
declare global {
  var __grpcClientPool: Map<string, GrpcServiceClient> | undefined;
}

if (!globalThis.__grpcClientPool) {
  globalThis.__grpcClientPool = new Map<string, GrpcServiceClient>();
}
const clientPool: Map<string, GrpcServiceClient> = globalThis.__grpcClientPool;

/**
 * Constructs a configured gRPC client channel with TLS security and keepalive options.
 *
 * @param address - Host and port target (e.g. "localhost:9090").
 * @returns Configured GrpcServiceClient instance.
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
 * Reuses existing channels across both development and production to eliminate socket leaks.
 *
 * @param address - Host and port target.
 * @returns Cached or newly initialized GrpcServiceClient.
 */
export function getClient(address: string): GrpcServiceClient {
  let client = clientPool.get(address);
  if (!client) {
    client = buildClient(address);
    clientPool.set(address, client);
  }
  return client;
}

/**
 * RPC execution options including authentication token, deadline timeout, and custom headers.
 */
export interface CallOpts {
  /** Optional JWT or bearer session token */
  token?: string;
  /** Explicit deadline in milliseconds */
  deadlineMs?: number;
  /** Additional custom metadata key-value headers */
  metadata?: Record<string, string>;
}

/**
 * Unauthenticated RPC: Authenticates user credentials with the backend CBS host.
 *
 * @param req - Login request containing user credentials and client ID.
 * @param _opts - Optional call parameters.
 * @returns Promise resolving to the GrpcResponse envelope from CBS.
 */
export function loginProcess(req: LoginRequest, _opts: CallOpts = {}): Promise<GrpcResponse> {
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
 * Core banking process classification:
 * - 'financial': executes with state-altering ledger mechanics and idempotency keys.
 * - 'nonfinancial': executes read/inquiry operations without idempotency overhead.
 */
export type ProcessKind = "financial" | "nonfinancial";

/**
 * Executes an authenticated unary gRPC transaction against the target service address.
 *
 * @param address - Target host address.
 * @param kind - 'financial' or 'nonfinancial' process classification.
 * @param req - Fully populated GrpcRequest envelope.
 * @param opts - Invocation options (bearer token, deadline, headers).
 * @returns Promise resolving to the backend GrpcResponse.
 */
export function grpcProcess(
  address: string,
  kind: ProcessKind,
  req: GrpcRequest,
  opts: CallOpts = {},
): Promise<GrpcResponse> {
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

/**
 * Maps a gRPC status code and service error to standard HTTP status codes and human-readable error messages.
 *
 * @param err - Unknown error caught from gRPC invocation.
 * @returns HTTP status number and sanitized error message string.
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

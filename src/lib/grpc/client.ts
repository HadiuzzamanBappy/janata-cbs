import "server-only";
import {
  type CallOptions,
  type ChannelCredentials,
  credentials,
  status as grpcStatus,
  Metadata,
  type ServiceError,
} from "@grpc/grpc-js";
import { env } from "@/lib/config";
import {
  type GrpcRequest,
  type GrpcResponse,
  GrpcServiceClient,
  type LoginRequest,
} from "@/lib/grpc/generated/service";

export type { GrpcRequest, GrpcResponse, LoginRequest };

/* ---------- Singleton gRPC Client ---------- */
declare global {
  // eslint-disable-next-line no-var
  var __grpcClient: GrpcServiceClient | undefined;
}

// TODO: [Step 8 - Production Tuning] Implement multi-channel gRPC connection pooling for high-concurrency peak load.
function buildClient(address: string): GrpcServiceClient {
  const creds: ChannelCredentials = env.GRPC_TLS
    ? credentials.createSsl()
    : credentials.createInsecure();
  return new GrpcServiceClient(address, creds, {
    "grpc.keepalive_time_ms": 60_000,
    "grpc.keepalive_timeout_ms": 20_000,
  });
}

function getClient(address: string): GrpcServiceClient {
  if (process.env.NODE_ENV === "production") {
    if (!globalThis.__grpcClient) {
      globalThis.__grpcClient = buildClient(address);
    }
    return globalThis.__grpcClient;
  }
  // Development mode: build fresh client per call to prevent hot-reload socket leakage
  return buildClient(address);
}

/* ---------- Call Options ---------- */
export interface CallOpts {
  token?: string;
  deadlineMs?: number;
  metadata?: Record<string, string>;
}

/* ---------- Unauthenticated RPC: Login ---------- */
export function loginProcess(
  req: LoginRequest,
  _opts: CallOpts = {},
): Promise<GrpcResponse> {
  const address =
    process.env.NODE_ENV === "development"
      ? env.GRPC_ADDRESS_DEFAULTDEV || env.GRPC_ADDRESS
      : env.GRPC_ADDRESS_DEFAULT || env.GRPC_ADDRESS;

  const client = getClient(address);
  return new Promise<GrpcResponse>((resolve, reject) => {
    client.loginProcess(req, (err, res) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}

/* ---------- Authenticated RPC: Financial & Non-Financial ---------- */
export type ProcessKind = "financial" | "nonfinancial";

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

  const ms = opts.deadlineMs ?? 15_000;
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

/* ---------- gRPC status code to HTTP status conversion ---------- */
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

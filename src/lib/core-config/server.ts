import "server-only";
import { DEFAULT_SERVICE, isRestServiceAddress } from "@/lib/data-schemas";
import { clientConfig } from "./client";
import { env, serviceEnv } from "./env";

export const SERVICE_PROTOCOL = { GRPC: "grpc", REST: "rest" } as const;
type ServiceProtocol = (typeof SERVICE_PROTOCOL)[keyof typeof SERVICE_PROTOCOL];

interface ServiceDef {
  readonly name: string;
  /** `host:port` for gRPC; the full endpoint URL for REST. */
  readonly address: string;
  readonly protocol: ServiceProtocol;
}

/**
 * Service registry: the core (`default`, always gRPC at `GRPC_HOST`) plus every
 * `SERVICE_<NAME>_URL`. The address decides the protocol: `http(s)://…` is REST, `host:port` gRPC.
 */
export const SERVICES: ReadonlyMap<string, ServiceDef> = new Map<string, ServiceDef>([
  [
    DEFAULT_SERVICE,
    { name: DEFAULT_SERVICE, address: env.GRPC_HOST, protocol: SERVICE_PROTOCOL.GRPC },
  ],
  ...Object.entries(serviceEnv).map(
    ([name, address]) =>
      [
        name,
        {
          name,
          address,
          protocol: isRestServiceAddress(address) ? SERVICE_PROTOCOL.REST : SERVICE_PROTOCOL.GRPC,
        },
      ] as const,
  ),
]);

/** Service name for a `servicePath`: trimmed, lowercase, empty = the core. */
export function serviceNameOf(servicePath?: string | null): string {
  return servicePath?.trim().toLowerCase() || DEFAULT_SERVICE;
}

/** The registered service for a `servicePath`, or `undefined` (never a silent fallback to the core). */
export function resolveService(servicePath?: string | null): ServiceDef | undefined {
  return SERVICES.get(serviceNameOf(servicePath));
}

/**
 * Complete Server-Only Application Configuration.
 * Composes isomorphic client constants with validated server-only runtime secrets and infrastructure configs.
 * Protected by `import "server-only"`.
 */
export const serverConfig = {
  ...clientConfig,

  // 1. Application & Runtime Mode
  nodeEnv: env.NODE_ENV,
  isDev: env.NODE_ENV === "development",
  logLevel: env.LOG_LEVEL,
  dataSource: env.DATA_SOURCE,

  // 2. Security & Authentication
  loginLimit: env.LOGIN_LIMIT,
  useHttps: env.USE_HTTPS,

  // 3. Core Banking Engine (gRPC)
  grpc: {
    host: env.GRPC_HOST,
    useTls: env.GRPC_USE_TLS,
    timeoutMs: env.GRPC_TIMEOUT_MS,
    financialTransactionTypes: env.GRPC_FINANCIAL_TRANSACTION_TYPES.split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    clientId: env.CLIENT_ID,
    keepaliveTimeMs: 60_000,
    keepaliveTimeoutMs: 20_000,
  },

  // 4. Caching Layer (Redis)
  redis: {
    url: env.REDIS_URL,
    keyPrefix: env.REDIS_KEY_PREFIX,
    enabled: env.CACHE_ENABLED,
    cooldownMs: env.CACHE_COOLDOWN_MS,
    invalidateToken: env.CACHE_INVALIDATE_TOKEN,
    menuTtlSeconds: env.MENU_TTL_SECONDS,
    specTtlSeconds: env.SPEC_TTL_SECONDS,
    defaultTtlSeconds: 86400,
    cacheKeys: {
      formSpec: (id: string) => `spec:form:${id}`,
      modelSpec: (id: string) => `spec:model:${id}`,
      inquirySpec: (id: string) => `spec:enq:${id}`,
      menu: (target: string) => `menu:${target}`,
      session: (id: string) => `sess:${id}`,
      userSession: (userId: string) => `user:sess:${userId}`,
      rateLimit: (key: string) => `rl:${key}`,
    },
  },

  // 5. Server Session Invariants
  auth: {
    ...clientConfig.auth,
    loginLimit: env.LOGIN_LIMIT,
    sessionMaxAgeSeconds: (env.NEXT_PUBLIC_LOGOUT_TIME + 1) * 60,
  },
} as const;

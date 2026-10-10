import "server-only";
import { clientConfig } from "./client";
import { env } from "./env";

/**
 * Supported transport protocols for downstream microservices.
 */
export type ServiceProtocol = "grpc" | "rest";

/**
 * Microservice endpoint definition contract.
 */
export interface ServiceDef {
  url: string;
  protocol: ServiceProtocol;
}

/**
 * Microservice Endpoint Registry with transport protocol metadata.
 * Dynamically resolves core gRPC engines and HTTP microservices.
 */
export const SERVICES: Record<string, ServiceDef> = {
  default: { url: env.GRPC_HOST, protocol: "grpc" },
  customer: { url: env.SERVICE_CUSTOMER_BASE_URL, protocol: "grpc" },
  urm: { url: env.SERVICE_URM_BASE_URL, protocol: "grpc" },
};

/**
 * Domain-specific requestType overrides based on control keywords.
 * Decouples business transaction overrides from the low-level transport layer.
 */
export const REQUEST_TYPE_OVERLAYS: Record<string, Record<string, string>> = {
  USER: {
    AUT: "UAU",
  },
  "FUNDS.TRANSFER": {
    PUT: "AFT",
    AUT: "AFT",
    REV: "AFT",
  },
  "CASH.TRANSFER": {
    PUT: "ACT",
    AUT: "ACT",
    REV: "ACT",
  },
};

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
  modelSource: env.MODEL_SOURCE,
  userSource: env.USER_SOURCE,

  // 2. Security & Authentication
  loginLimit: env.LOGIN_LIMIT,
  useHttps: env.USE_HTTPS,

  // 3. Core Banking Engine (gRPC)
  grpc: {
    host: env.GRPC_HOST,
    useTls: env.GRPC_USE_TLS,
    timeoutMs: env.GRPC_TIMEOUT_MS,
    financialTransactionTypes: env.GRPC_FINANCIAL_TRANSACTION_TYPES.split(","),
    clientId: env.CLIENT_ID,
    modelSource: env.MODEL_SOURCE,
    keepaliveTimeMs: 60_000,
    keepaliveTimeoutMs: 20_000,
  },

  // 4. Downstream Microservices (HTTP / REST)
  services: {
    customerBaseUrl: env.SERVICE_CUSTOMER_BASE_URL,
    urmBaseUrl: env.SERVICE_URM_BASE_URL,
    registry: SERVICES,
  },

  // 5. Caching Layer (Redis)
  redis: {
    url: env.REDIS_URL,
    keyPrefix: env.REDIS_KEY_PREFIX,
    enabled: env.CACHE_ENABLED,
    cooldownMs: env.CACHE_COOLDOWN_MS,
    invalidateToken: env.CACHE_INVALIDATE_TOKEN,
    menuTtlSeconds: env.MENU_TTL_SECONDS,
    specTtlSeconds: env.SPEC_TTL_SECONDS,
    defaultTtlSeconds: 86400,
  },

  // 6. Server Session Invariants
  auth: {
    ...clientConfig.auth,
    loginLimit: env.LOGIN_LIMIT,
    userSource: env.USER_SOURCE,
    sessionPrefix: `${env.REDIS_KEY_PREFIX}:sess:`,
    sessionMaxAgeSeconds: (env.NEXT_PUBLIC_LOGOUT_TIME + 2) * 60,
  },
} as const;

export type ServerConfig = typeof serverConfig;

/**
 * Backward compatibility alias for server contexts.
 */
export const appConfig = serverConfig;

/**
 * Retrieves the full service endpoint registry.
 */
export function getServices(): Record<string, ServiceDef> {
  return SERVICES;
}

/**
 * Retrieves configuration for a specific downstream service key.
 * Falls back to 'default' if the requested key is not registered.
 */
export function getService(serviceKey: string = "default"): ServiceDef {
  const targetKey = serviceKey || "default";
  return SERVICES[targetKey] || SERVICES.default;
}

/**
 * Returns the resolved connection URL for a service key.
 */
export function getServiceUrl(serviceKey: string = "default"): string {
  return getService(serviceKey).url;
}

import { env } from "./env";

export const appConfig = {
  isDev: env.NODE_ENV === "development",
  useHttps: env.USE_HTTPS,
  logoutTimeMinutes: env.NEXT_PUBLIC_LOGOUT_TIME,
  defaultBranch: env.NEXT_PUBLIC_CENTRAL_BRANCH,

  grpc: {
    address: env.GRPC_HOST,
    useTls: env.GRPC_USE_TLS,
    deadlineMs: env.GRPC_TIMEOUT_MS,
    keepaliveTimeMs: 60_000,
    keepaliveTimeoutMs: 20_000,
    modelSource: env.MODEL_SOURCE,
    financialTypes: env.GRPC_FINANCIAL_TRANSACTION_TYPES.split(","),
  },

  services: {
    customerUrl: env.SERVICE_CUSTOMER_BASE_URL,
    urmUrl: env.SERVICE_URM_BASE_URL,
  },

  redis: {
    url: env.REDIS_URL,
    prefix: env.REDIS_KEY_PREFIX,
    enabled: env.CACHE_ENABLED,
    invalidateToken: env.CACHE_INVALIDATE_TOKEN,
    cooldownMs: 5000,
    // Unified TTL Tiers:
    metadataTtlSeconds: 3600, // 1 Hour: GMC Screen Specs, Branches, Controls
    menuTtlSeconds: 600, // 10 Minutes: Navigation hierarchy
    defaultTtlSeconds: 86400, // 24 Hours: Generic fallback
  },

  auth: {
    loginLimit: env.LOGIN_LIMIT,
    rateLimitWindowSec: 60,
    cookieName: "sid",
    sessionPrefix: "sess:",
    userSource: env.USER_SOURCE,
    sessionMaxAgeSeconds: (env.NEXT_PUBLIC_LOGOUT_TIME + 2) * 60,
  },
} as const;

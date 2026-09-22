import { env } from "@/lib/env";

export const appConfig = {
  isDev: env.NODE_ENV === "development",
  baseUrl: env.NEXT_PUBLIC_BASE_URL,
  logoutTimeMinutes: env.NEXT_PUBLIC_LOGOUT_TIME,
  defaultBranch: env.NEXT_PUBLIC_CENTRAL_BRANCH,
  defaultServicePath: env.NEXT_PUBLIC_DEFAULT_SERVICE_PATH,

  grpc: {
    address: env.GRPC_ADDRESS,
    useTls: env.GRPC_TLS,
    deadlineMs: env.GRPC_DEADLINE_MS,
    modelSource: env.MODEL_SOURCE,
    financialTypes: env.GRPC_FINANCIAL_TYPES.split(","),
    modelRequestType: env.MODEL_REQUEST_TYPE,
    menuRequestType: env.MENU_REQUEST_TYPE,
    menuControlName: env.MENU_CONTROL_NAME,
  },

  redis: {
    url: env.REDIS_URL,
    prefix: env.REDIS_KEY_PREFIX,
    enabled: env.CACHE_ENABLED,
    cooldownMs: env.CACHE_COOLDOWN_MS,
    specTtlSeconds: env.SPEC_TTL_SECONDS,
    menuTtlSeconds: env.MENU_TTL_SECONDS,
    invalidateToken: env.CACHE_INVALIDATE_TOKEN,
  },

  auth: {
    sessionSecret: env.SESSION_SECRET,
    loginLimit: env.LOGIN_LIMIT,
  },

  services: {
    apiBaseUrl: env.API_BASE_URL,
  },
} as const;

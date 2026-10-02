import { env } from "./env";

export const appConfig = {
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

  // 6. Client-exposed Config & Session
  centralBranch: env.NEXT_PUBLIC_CENTRAL_BRANCH,
  logoutTime: env.NEXT_PUBLIC_LOGOUT_TIME,
  auth: {
    loginLimit: env.LOGIN_LIMIT,
    userSource: env.USER_SOURCE,
    rateLimitWindowSec: 60,
    cookieName: "sid",
    initLoginCookie: "initLogin",
    sessionPrefix: "sess:",
    sessionMaxAgeSeconds: (env.NEXT_PUBLIC_LOGOUT_TIME + 2) * 60,
    minPasswordLength: 6,
  },

  // 7. Core Banking Presentation & Formatting Standards
  format: {
    currency: "BDT",
    locale: "en-IN",
    dateLocale: "en-GB",
    accountNumberLength: 13,
  },

  // 8. Canonical Application Routes & Endpoints
  routes: {
    home: "/",
    dashboard: "/dashboard",
    screen: "/screen",
    login: "/login",
    changePassword: "/change-password",
    api: {
      login: "/api/login",
      logout: "/api/logout",
      session: "/api/session",
      proxy: "/api/proxy",
      cache: "/api/cache",
      model: "/api/model",
      menu: "/api/menu",
      controls: "/api/controls",
      branches: "/api/branches",
      changePassword: "/api/change-password",
    },
  },

  // 9. Client Storage & Sync Keys
  storageKeys: {
    lastActivity: "cbs:session:last_activity",
    workbenchTabs: "cbs:workbench:tabs",
    themeAccent: "cbs:theme:accent",
    idleWarningWindowMs: 60 * 1000, // 60s warning before timeout
  },
} as const;

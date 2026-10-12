import "server-only";
import { type Env, envSchema } from "@/lib/data-schemas/env-schema";

export type { Env };
export { envSchema };

/**
 * Validated runtime server environment configuration.
 * Protected by `import "server-only"`.
 */
export const env: Env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  LOG_LEVEL: process.env.LOG_LEVEL,
  MODEL_SOURCE: process.env.MODEL_SOURCE,
  USER_SOURCE: process.env.USER_SOURCE,

  LOGIN_LIMIT: process.env.LOGIN_LIMIT,
  USE_HTTPS: process.env.USE_HTTPS,

  GRPC_HOST: process.env.GRPC_HOST,
  GRPC_USE_TLS: process.env.GRPC_USE_TLS,
  GRPC_TIMEOUT_MS: process.env.GRPC_TIMEOUT_MS,
  GRPC_FINANCIAL_TRANSACTION_TYPES: process.env.GRPC_FINANCIAL_TRANSACTION_TYPES,
  CLIENT_ID: process.env.CLIENT_ID,

  SERVICE_CUSTOMER_BASE_URL: process.env.SERVICE_CUSTOMER_BASE_URL,
  SERVICE_URM_BASE_URL: process.env.SERVICE_URM_BASE_URL,

  REDIS_URL: process.env.REDIS_URL,
  REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX,
  CACHE_ENABLED: process.env.CACHE_ENABLED,
  CACHE_COOLDOWN_MS: process.env.CACHE_COOLDOWN_MS,
  CACHE_INVALIDATE_TOKEN: process.env.CACHE_INVALIDATE_TOKEN,
  MENU_TTL_SECONDS: process.env.MENU_TTL_SECONDS,
  SPEC_TTL_SECONDS: process.env.SPEC_TTL_SECONDS,

  NEXT_PUBLIC_CENTRAL_BRANCH: process.env.NEXT_PUBLIC_CENTRAL_BRANCH,
  NEXT_PUBLIC_LOGOUT_TIME: process.env.NEXT_PUBLIC_LOGOUT_TIME,
});

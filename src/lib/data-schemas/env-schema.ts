import { z } from "zod";

/**
 * Reusable environment boolean coercion helper.
 * Handles strings ("true", "1", "false", "0") and booleans safely.
 */
const booleanEnv = (defaultValue: boolean) =>
  z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((val) => {
      if (val === undefined || val === null) return defaultValue;
      if (typeof val === "boolean") return val;
      const normalized = val.trim().toLowerCase();
      if (defaultValue) {
        return normalized !== "false" && normalized !== "0";
      }
      return normalized === "true" || normalized === "1";
    })
    .default(defaultValue);

/**
 * Zod schema validating server environment variables and runtime secrets.
 * Enforced on server initialization. Guarantees fail-fast configuration validation.
 */
export const envSchema = z
  .object({
    // 1. Application & Runtime Mode
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    DATA_SOURCE: z.enum(["grpc", "static"]).default("grpc"),

    // 2. Security & Authentication
    LOGIN_LIMIT: z.coerce.number().int().positive().default(3),
    USE_HTTPS: booleanEnv(false),

    // 3. Core Banking Engine (gRPC)
    GRPC_HOST: z.string().trim().default("localhost:9090"),
    GRPC_USE_TLS: booleanEnv(false),
    GRPC_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
    GRPC_FINANCIAL_TRANSACTION_TYPES: z.string().trim().default("ATT,CTT,AFT"),
    CLIENT_ID: z.string().trim().default("WEB-CLIENT"),

    // 4. Downstream Microservices (HTTP / REST)
    SERVICE_CUSTOMER_BASE_URL: z.string().trim().default("http://localhost:8383"),
    SERVICE_URM_BASE_URL: z.string().trim().default("http://localhost:8282"),

    // 5. Caching Layer (Redis)
    REDIS_URL: z.string().trim().default("redis://127.0.0.1:6379"),
    REDIS_KEY_PREFIX: z.string().trim().default("cbs"),
    CACHE_ENABLED: booleanEnv(true),
    CACHE_COOLDOWN_MS: z.coerce.number().int().nonnegative().default(5000),
    CACHE_INVALIDATE_TOKEN: z.string().trim().default("super-secret-cache-token"),
    MENU_TTL_SECONDS: z.coerce.number().int().positive().default(600),
    SPEC_TTL_SECONDS: z.coerce.number().int().positive().default(3600),

    // 6. Client-exposed Config (Next.js Public Bundle)
    NEXT_PUBLIC_APP_KEY: z.string().trim().default("cbs"),
    NEXT_PUBLIC_CENTRAL_BRANCH: z.string().trim().default("JB9999"),
    NEXT_PUBLIC_LOGOUT_TIME: z.coerce.number().int().positive().default(10),
  })
  .superRefine((data, ctx) => {
    if (data.DATA_SOURCE === "grpc") {
      if (!data.GRPC_HOST || data.GRPC_HOST.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["GRPC_HOST"],
          message: "GRPC_HOST must be provided when DATA_SOURCE is set to 'grpc'",
        });
      }
    }

    if (data.CACHE_ENABLED && (!data.REDIS_URL || data.REDIS_URL.trim() === "")) {
      ctx.addIssue({
        code: "custom",
        path: ["REDIS_URL"],
        message: "REDIS_URL must be provided when CACHE_ENABLED is true",
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

import { z } from "zod";

export const envSchema = z
  .object({
    // 1. Application & Runtime Mode
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    MODEL_SOURCE: z.enum(["grpc", "static"]).default("grpc"),
    USER_SOURCE: z.enum(["grpc", "static"]).default("grpc"),

    // 2. Security & Authentication
    LOGIN_LIMIT: z.coerce.number().default(3),
    USE_HTTPS: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((val) => val === true || val === "true")
      .default(false),

    // 3. Core Banking Engine (gRPC)
    GRPC_HOST: z.string().default("localhost:9090"),
    GRPC_USE_TLS: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((val) => val === true || val === "true")
      .default(false),
    GRPC_TIMEOUT_MS: z.coerce.number().default(8000),
    GRPC_FINANCIAL_TRANSACTION_TYPES: z.string().default("AFT,ACT"),
    CLIENT_ID: z.string().default("WEB-CLIENT"),

    // 4. Downstream Microservices (HTTP / REST)
    SERVICE_CUSTOMER_BASE_URL: z.string().default("http://localhost:8383"),
    SERVICE_URM_BASE_URL: z.string().default("http://localhost:8282"),

    // 5. Caching Layer (Redis)
    REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
    REDIS_KEY_PREFIX: z.string().default("finx"),
    CACHE_ENABLED: z
      .union([z.boolean(), z.string()])
      .optional()
      .transform((val) => val !== false && val !== "false")
      .default(true),
    CACHE_COOLDOWN_MS: z.coerce.number().default(5000),
    CACHE_INVALIDATE_TOKEN: z.string().default("super-secret-cache-token"),
    MENU_TTL_SECONDS: z.coerce.number().default(600),
    SPEC_TTL_SECONDS: z.coerce.number().default(3600),

    // 6. Client-exposed Config (Next.js Public Bundle)
    NEXT_PUBLIC_CENTRAL_BRANCH: z.string().default("JB9999"),
    NEXT_PUBLIC_LOGOUT_TIME: z.coerce.number().default(10),
  })
  .superRefine((data, ctx) => {
    if (data.MODEL_SOURCE === "grpc" || data.USER_SOURCE === "grpc") {
      if (!data.GRPC_HOST || data.GRPC_HOST.trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["GRPC_HOST"],
          message: "GRPC_HOST must be provided when MODEL_SOURCE or USER_SOURCE is set to 'grpc'",
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

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
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

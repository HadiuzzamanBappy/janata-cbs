import { z } from "zod";

const envSchema = z.object({
  // 1. Application & Runtime Mode
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MODEL_SOURCE: z.enum(["grpc", "static"]).default("grpc"),
  USER_SOURCE: z.enum(["grpc", "static"]).default("grpc"),

  // 2. Security & Authentication
  LOGIN_LIMIT: z.coerce.number().default(3),
  USE_HTTPS: z
    .string()
    .transform((val) => val === "true")
    .default(false),

  // 3. Core Banking Engine (gRPC)
  GRPC_HOST: z.string().default("localhost:9090"),
  GRPC_USE_TLS: z
    .string()
    .transform((val) => val === "true")
    .default(false),
  GRPC_TIMEOUT_MS: z.coerce.number().default(8000),
  GRPC_FINANCIAL_TRANSACTION_TYPES: z.string().default("AFT,ACT"),

  // 4. Downstream Microservices (HTTP / REST)
  SERVICE_CUSTOMER_BASE_URL: z.string().default("http://customer:8383"),
  SERVICE_URM_BASE_URL: z.string().default("http://finxurm:8282"),

  // 5. Caching Layer (Redis)
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  REDIS_KEY_PREFIX: z.string().default("finx"),
  CACHE_ENABLED: z
    .string()
    .transform((val) => val !== "false")
    .default(true),
  CACHE_INVALIDATE_TOKEN: z.string().default("super-secret-cache-token"),

  // 6. Client-exposed Config (Next.js Public Bundle)
  NEXT_PUBLIC_CENTRAL_BRANCH: z.string().default("JB9999"),
  NEXT_PUBLIC_LOGOUT_TIME: z.coerce.number().default(10),
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

  SERVICE_CUSTOMER_BASE_URL: process.env.SERVICE_CUSTOMER_BASE_URL,
  SERVICE_URM_BASE_URL: process.env.SERVICE_URM_BASE_URL,

  REDIS_URL: process.env.REDIS_URL,
  REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX,
  CACHE_ENABLED: process.env.CACHE_ENABLED,
  CACHE_INVALIDATE_TOKEN: process.env.CACHE_INVALIDATE_TOKEN,

  NEXT_PUBLIC_CENTRAL_BRANCH: process.env.NEXT_PUBLIC_CENTRAL_BRANCH,
  NEXT_PUBLIC_LOGOUT_TIME: process.env.NEXT_PUBLIC_LOGOUT_TIME,
});

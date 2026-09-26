import { z } from "zod";

const envSchema = z.object({
  // Server Execution Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Core Banking gRPC Settings & Microservice Endpoints
  MODEL_SOURCE: z.enum(["grpc", "static"]).default("grpc"),
  USER_SOURCE: z.enum(["grpc", "static"]).default("grpc"),
  GRPC_ADDRESS: z.string().default("localhost:9090"),
  GRPC_ADDRESS_DEFAULTDEV: z.string().default("172.18.18.66:50055"),
  GRPC_ADDRESS_DEFAULT: z.string().default("finx-server:50055"),
  SERVICE_URL_CUSTOMER: z.string().default("http://customer:8383"),
  SERVICE_URL_FINXURM: z.string().default("http://finxurm:8282"),

  GRPC_TLS: z
    .string()
    .transform((val) => val === "true")
    .default(false),
  GRPC_DEADLINE_MS: z.coerce.number().default(8000),
  GRPC_FINANCIAL_TYPES: z.string().default("AFT,ACT"),
  MODEL_REQUEST_TYPE: z.string().default("GMC"),
  MENU_REQUEST_TYPE: z.string().default("MNU"),
  MENU_CONTROL_NAME: z.string().default("MAIN_MENU"),

  // Redis & Session Cache Settings
  REDIS_URL: z.string().default("redis://127.0.0.1:6379"),
  REDIS_KEY_PREFIX: z.string().default("finx"),
  CACHE_ENABLED: z
    .string()
    .transform((val) => val !== "false")
    .default(true),
  CACHE_COOLDOWN_MS: z.coerce.number().default(5000),
  SPEC_TTL_SECONDS: z.coerce.number().default(3600),
  MENU_TTL_SECONDS: z.coerce.number().default(600),
  CACHE_INVALIDATE_TOKEN: z.string().default("super-secret-cache-token"),

  // Security & Authentication Settings
  SESSION_SECRET: z
    .string()
    .min(16, "SESSION_SECRET must be at least 16 characters")
    .default("a960b9e379952ddc2699ae9259b9c28597c6a59a199fbf4b7357bd8e978095ac"),
  LOGIN_LIMIT: z.coerce.number().default(3),

  // External Microservice Endpoints
  API_BASE_URL: z.string().default("http://localhost:8080"),

  // Client-exposed Environment Variables (NEXT_PUBLIC_)
  NEXT_PUBLIC_BASE_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_LOGOUT_TIME: z.coerce.number().default(10),
  NEXT_PUBLIC_CENTRAL_BRANCH: z.string().default("JB9999"),
  NEXT_PUBLIC_DEFAULT_SERVICE_PATH: z.string().default("default"),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  MODEL_SOURCE: process.env.MODEL_SOURCE,
  USER_SOURCE: process.env.USER_SOURCE,
  GRPC_ADDRESS: process.env.GRPC_ADDRESS,
  GRPC_ADDRESS_DEFAULTDEV: process.env.GRPC_ADDRESS_DEFAULTDEV,
  GRPC_ADDRESS_DEFAULT: process.env.GRPC_ADDRESS_DEFAULT,
  SERVICE_URL_CUSTOMER: process.env.SERVICE_URL_CUSTOMER,
  SERVICE_URL_FINXURM: process.env.SERVICE_URL_FINXURM,

  GRPC_TLS: process.env.GRPC_TLS,
  GRPC_DEADLINE_MS: process.env.GRPC_DEADLINE_MS,
  GRPC_FINANCIAL_TYPES: process.env.GRPC_FINANCIAL_TYPES,
  MODEL_REQUEST_TYPE: process.env.MODEL_REQUEST_TYPE,
  MENU_REQUEST_TYPE: process.env.MENU_REQUEST_TYPE,
  MENU_CONTROL_NAME: process.env.MENU_CONTROL_NAME,

  REDIS_URL: process.env.REDIS_URL,
  REDIS_KEY_PREFIX: process.env.REDIS_KEY_PREFIX,
  CACHE_ENABLED: process.env.CACHE_ENABLED,
  CACHE_COOLDOWN_MS: process.env.CACHE_COOLDOWN_MS,
  SPEC_TTL_SECONDS: process.env.SPEC_TTL_SECONDS,
  MENU_TTL_SECONDS: process.env.MENU_TTL_SECONDS,
  CACHE_INVALIDATE_TOKEN: process.env.CACHE_INVALIDATE_TOKEN,

  SESSION_SECRET: process.env.SESSION_SECRET,
  LOGIN_LIMIT: process.env.LOGIN_LIMIT,
  API_BASE_URL: process.env.API_BASE_URL,

  NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  NEXT_PUBLIC_LOGOUT_TIME: process.env.NEXT_PUBLIC_LOGOUT_TIME,
  NEXT_PUBLIC_CENTRAL_BRANCH: process.env.NEXT_PUBLIC_CENTRAL_BRANCH,
  NEXT_PUBLIC_DEFAULT_SERVICE_PATH: process.env.NEXT_PUBLIC_DEFAULT_SERVICE_PATH,
});

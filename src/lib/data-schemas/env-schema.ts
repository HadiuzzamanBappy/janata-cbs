import { z } from "zod";
import { DEFAULT_SERVICE } from "./common-schema";

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

    // 4. Caching Layer (Redis)
    REDIS_URL: z.string().trim().default("redis://127.0.0.1:6379"),
    REDIS_KEY_PREFIX: z.string().trim().default("cbs"),
    CACHE_ENABLED: booleanEnv(true),
    CACHE_COOLDOWN_MS: z.coerce.number().int().nonnegative().default(5000),
    CACHE_INVALIDATE_TOKEN: z.string().trim().default(""),
    MENU_TTL_SECONDS: z.coerce.number().int().positive().default(600),
    SPEC_TTL_SECONDS: z.coerce.number().int().positive().default(3600),

    // 5. Client-exposed Config (Next.js Public Bundle)
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

/* -------------------------------------------------------------------------- */
/* Microservice Registry (SERVICE_<NAME>_URL)                                 */
/* -------------------------------------------------------------------------- */

const SERVICE_ENV_PREFIX = "SERVICE_";
const SERVICE_ENV_KEY = /^SERVICE_([A-Z0-9]+)_URL$/;
const REST_ADDRESS = /^https?:\/\//i;
const GRPC_ADDRESS = /^[\w.-]+:\d{1,5}$/;

/** `http(s)://…` is a REST endpoint (POST to that exact URL); `host:port` is gRPC. */
export function isRestServiceAddress(address: string): boolean {
  return REST_ADDRESS.test(address);
}

/**
 * Collects every `SERVICE_<NAME>_URL` into `{ name (lowercase): address }`. NAME is the jar name
 * and the DB `servicePath`, so a new microservice is one env line. Start-up fails on any other
 * `SERVICE_*` key (a leftover or misspelled variable), on `SERVICE_DEFAULT_URL` (the core is
 * always `GRPC_HOST`), and on an address that is neither `host:port` nor an http(s) URL.
 */
export const serviceEnvSchema = z
  .record(z.string(), z.string().optional())
  .transform((vars, ctx) => {
    const services: Record<string, string> = {};
    for (const [key, raw] of Object.entries(vars)) {
      if (!key.startsWith(SERVICE_ENV_PREFIX)) continue;
      const name = SERVICE_ENV_KEY.exec(key)?.[1]?.toLowerCase();
      const address = (raw ?? "").trim();
      if (!name) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is not recognised; use SERVICE_<NAME>_URL`,
        });
      } else if (name === DEFAULT_SERVICE) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} is reserved: the core is GRPC_HOST`,
        });
      } else if (
        isRestServiceAddress(address) ? !URL.canParse(address) : !GRPC_ADDRESS.test(address)
      ) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: `${key} must be host:port (gRPC) or a full http(s):// endpoint URL (REST)`,
        });
      } else {
        services[name] = address;
      }
    }
    return services;
  });

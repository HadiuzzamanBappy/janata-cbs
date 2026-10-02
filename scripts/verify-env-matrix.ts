/**
 * Environment Matrix & Wire Fixture Verification Script
 *
 * Verifies system configuration permutations & wire fixture parsing integrity
 * with zero clutter and a clear, readable test suite pattern.
 */

import {
  STATIC_BRANCH_RESPONSE,
  STATIC_COMMANDS,
  STATIC_MENU,
  STATIC_MODELS,
  STATIC_USER_RESPONSES,
} from "../fixtures";
import { envSchema } from "../src/lib/config/env";
import {
  parseAuthWirePayload,
  parseBranchesWirePayload,
  parseControlsWirePayload,
  parseGMC,
  parseMNU,
} from "../src/lib/parsers";

// ============================================================================
// Minimalist Test Runner Pattern
// ============================================================================

interface TestContext {
  passed: number;
  total: number;
  suite: string;
}

const ctx: TestContext = {
  passed: 0,
  total: 0,
  suite: "",
};

function suite(name: string, fn: () => void): void {
  ctx.suite = name;
  console.log(`\n── ${name} ──────────────────────────────────────`);
  fn();
}

function test(description: string, assertion: () => boolean): void {
  ctx.total++;
  try {
    const passed = assertion();
    if (passed) {
      ctx.passed++;
      console.log(`  ✓ ${description}`);
    } else {
      console.error(`  ✗ ${description} [ASSERTION FAILED]`);
    }
  } catch (err) {
    console.error(`  ✗ ${description} [THREW ERROR]:`, err instanceof Error ? err.message : err);
  }
}

// ============================================================================
// Test Suites
// ============================================================================

suite("1. Wire Fixture Structs (Protobuf 1:1 Format)", () => {
  test("STATIC_USER_RESPONSES contains valid user wire structures", () => {
    return Object.keys(STATIC_USER_RESPONSES).length >= 2;
  });

  test("STATIC_USER_RESPONSES matches .response/user.json Protobuf fields", () => {
    return STATIC_USER_RESPONSES.ZZ028459?.data?.fields?.userId?.string_value === "ZZ0284590";
  });

  test("STATIC_BRANCH_RESPONSE contains records list in Protobuf struct format", () => {
    return Boolean(STATIC_BRANCH_RESPONSE?.data?.fields?.records?.list_value?.values?.length);
  });

  test("STATIC_COMMANDS contains records list in Protobuf struct format", () => {
    return Boolean(STATIC_COMMANDS?.data?.fields?.records?.list_value?.values?.length);
  });

  test("STATIC_MENU contains records list in Protobuf struct format", () => {
    return Boolean(STATIC_MENU?.data?.fields?.records?.list_value?.values?.length);
  });
});

suite("2. Wire Payload Domain Parsers", () => {
  test("parseAuthWirePayload extracts CurrentUser and RIDASH rights", () => {
    const parsed = parseAuthWirePayload(STATIC_USER_RESPONSES.ZZ028459.data);
    return parsed.currUser.userId === "ZZ0284590" && parsed.currUser.accessibility === "RIDASH";
  });

  test("parseBranchesWirePayload extracts list of branches (recordId JB9999)", () => {
    const branches = parseBranchesWirePayload(STATIC_BRANCH_RESPONSE.data);
    return branches.length >= 4 && branches[0].recordId === "JB9999";
  });

  test("parseControlsWirePayload extracts system commands from control payload", () => {
    const commands = parseControlsWirePayload(STATIC_COMMANDS.data);
    return commands.length >= 6 && commands.some((c) => c.command === "ACCOUNT");
  });

  test("parseMNU transforms 2-level hierarchy from menu wire payload", () => {
    const menuResult = parseMNU(STATIC_MENU.data);
    return menuResult.success && menuResult.data.length > 0;
  });

  test("parseGMC parses form model schema (idPrefix='AC')", () => {
    const formAccount = parseGMC(STATIC_MODELS.ACCOUNT.data, "ACCOUNT");
    return formAccount.success && formAccount.data.idPrefix === "AC";
  });

  test("parseGMC parses enquiry model schema (columns for USER.LIST)", () => {
    const enq = parseGMC(STATIC_MODELS["USER.LIST"].data, "USER.LIST");
    return enq.success && Array.isArray(enq.data.columns) && enq.data.columns.length > 0;
  });
});

suite("3. Environment Permutations", () => {
  test("Permutation 1 [Pure Offline]: static + cache disabled", () => {
    const res = envSchema.safeParse({
      MODEL_SOURCE: "static",
      USER_SOURCE: "static",
      CACHE_ENABLED: "false",
    });
    return res.success;
  });

  test("Permutation 2 [Cached Offline]: rejects when REDIS_URL is missing", () => {
    const res = envSchema.safeParse({
      MODEL_SOURCE: "static",
      USER_SOURCE: "static",
      CACHE_ENABLED: "true",
      REDIS_URL: "",
    });
    return !res.success;
  });

  test("Permutation 2 [Cached Offline]: accepts when REDIS_URL is provided", () => {
    const res = envSchema.safeParse({
      MODEL_SOURCE: "static",
      USER_SOURCE: "static",
      CACHE_ENABLED: "true",
      REDIS_URL: "redis://127.0.0.1:6379",
    });
    return res.success;
  });

  test("Permutation 3 [Direct gRPC]: rejects when GRPC_HOST is missing", () => {
    const res = envSchema.safeParse({
      MODEL_SOURCE: "grpc",
      USER_SOURCE: "grpc",
      CACHE_ENABLED: "false",
      GRPC_HOST: "",
    });
    return !res.success;
  });

  test("Permutation 3 [Direct gRPC]: accepts when GRPC_HOST is provided", () => {
    const res = envSchema.safeParse({
      MODEL_SOURCE: "grpc",
      USER_SOURCE: "grpc",
      CACHE_ENABLED: "false",
      GRPC_HOST: "127.0.0.1:9090",
      CLIENT_ID: "CBS_CLIENT",
    });
    return res.success;
  });

  test("Permutation 4 [Full Production]: accepts valid gRPC + Redis configuration", () => {
    const res = envSchema.safeParse({
      MODEL_SOURCE: "grpc",
      USER_SOURCE: "grpc",
      CACHE_ENABLED: "true",
      GRPC_HOST: "127.0.0.1:9090",
      CLIENT_ID: "CBS_CLIENT",
      REDIS_URL: "redis://127.0.0.1:6379",
    });
    return res.success;
  });
});

suite("4. Banking-Grade Logger & PII Redaction", () => {
  const { redactSensitiveData, maskAccountNumber } = require("../src/lib/logger");

  test("masks financial account numbers correctly (e.g. AC****1234)", () => {
    const masked = maskAccountNumber("AC12345678");
    return masked === "AC****5678";
  });

  test("redacts sensitive credential keys in nested payloads", () => {
    const payload = {
      user: "ZZ028459",
      password: "SuperSecretPassword123!",
      token: "jwt_bearer_token_xyz",
      accountNumber: "AC98765432",
      nested: {
        pin: "1234",
        safeData: "visible",
      },
    };
    interface CleanedPayload {
      user: string;
      password: string;
      token: string;
      accountNumber: string;
      nested: {
        pin: string;
        safeData: string;
      };
    }
    const cleaned = redactSensitiveData(payload) as unknown as CleanedPayload;
    return (
      cleaned.user === "ZZ028459" &&
      cleaned.password === "[REDACTED]" &&
      cleaned.token === "[REDACTED]" &&
      cleaned.accountNumber === "AC****5432" &&
      cleaned.nested.pin === "[REDACTED]" &&
      cleaned.nested.safeData === "visible"
    );
  });
});

// ============================================================================
// Execution Summary
// ============================================================================

console.log("\n==================================================");
console.log(` Results: ${ctx.passed}/${ctx.total} passed`);
console.log("==================================================\n");

if (ctx.passed !== ctx.total) {
  process.exit(1);
}

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
import { parseCbsCommand, validateCommandForUser } from "../src/lib/core";
import type { CurrentUser } from "../src/lib/schemas";

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

  test("parseBranchesWirePayload extracts list of branches (recordId JB0001)", () => {
    const branches = parseBranchesWirePayload(STATIC_BRANCH_RESPONSE.data);
    return branches.length >= 4 && branches[0].recordId === "JB0001";
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

suite("Phase 1: CBS Command Grammar Parser", () => {
  test("parses pure application code into IDLE mode", () => {
    const cmd = parseCbsCommand("ACCOUNT");
    return (
      cmd.isValid &&
      cmd.type === "FORM" &&
      cmd.application === "ACCOUNT" &&
      cmd.screenMode === "IDLE"
    );
  });

  test("parses comma-separated application and recordId into EDIT mode", () => {
    const cmd = parseCbsCommand("ACCOUNT,1001");
    return (
      cmd.isValid &&
      cmd.application === "ACCOUNT" &&
      cmd.recordId === "1001" &&
      cmd.screenMode === "EDIT"
    );
  });

  test("parses space-separated application and recordId into EDIT mode", () => {
    const cmd = parseCbsCommand("CUSTOMER 2002");
    return (
      cmd.isValid &&
      cmd.application === "CUSTOMER" &&
      cmd.recordId === "2002" &&
      cmd.screenMode === "EDIT"
    );
  });

  test("parses application with function code (I) into CREATE mode", () => {
    const cmd = parseCbsCommand("ACCOUNT I");
    return (
      cmd.isValid &&
      cmd.application === "ACCOUNT" &&
      cmd.functionCode === "I" &&
      cmd.screenMode === "CREATE"
    );
  });

  test("parses application with function (I) and new ID placeholder (F3)", () => {
    const cmd = parseCbsCommand("ACCOUNT I F3");
    return (
      cmd.isValid &&
      cmd.application === "ACCOUNT" &&
      cmd.functionCode === "I" &&
      cmd.recordId === "F3" &&
      cmd.screenMode === "CREATE"
    );
  });

  test("parses application with See function (S) into VIEW mode", () => {
    const cmd = parseCbsCommand("ACCOUNT S 1001");
    return (
      cmd.isValid &&
      cmd.application === "ACCOUNT" &&
      cmd.functionCode === "S" &&
      cmd.recordId === "1001" &&
      cmd.screenMode === "VIEW"
    );
  });

  test("parses application with Authorise function (A) into EDIT mode", () => {
    const cmd = parseCbsCommand("ACCOUNT A 1001");
    return (
      cmd.isValid &&
      cmd.application === "ACCOUNT" &&
      cmd.functionCode === "A" &&
      cmd.recordId === "1001" &&
      cmd.screenMode === "EDIT"
    );
  });

  test("parses INQ inquiry queries correctly", () => {
    const cmd = parseCbsCommand("INQ USER.LIST");
    return (
      cmd.isValid &&
      cmd.type === "INQUIRY" &&
      cmd.application === "USER.LIST" &&
      cmd.screenMode === "VIEW"
    );
  });

  test("parses SETTINGS:<TAB> shortcuts into SETTINGS type", () => {
    const cmd = parseCbsCommand("SETTINGS:SECURITY");
    return cmd.isValid && cmd.type === "SETTINGS" && cmd.settingsTabId === "security";
  });

  test("parses standalone fixed shortcuts (PROFILE, THEME, DARK, LOGOUT)", () => {
    const profileCmd = parseCbsCommand("PROFILE");
    const themeCmd = parseCbsCommand("THEME");
    const darkCmd = parseCbsCommand("DARK");
    const logoutCmd = parseCbsCommand("LOGOUT");
    return (
      profileCmd.isValid &&
      profileCmd.type === "SETTINGS" &&
      profileCmd.settingsTabId === "profile" &&
      themeCmd.isValid &&
      themeCmd.type === "SETTINGS" &&
      themeCmd.settingsTabId === "appearance" &&
      darkCmd.isValid &&
      darkCmd.type === "ACTION" &&
      darkCmd.actionId === "toggle_theme" &&
      logoutCmd.isValid &&
      logoutCmd.type === "ACTION" &&
      logoutCmd.actionId === "logout"
    );
  });

  test("parses ACTION:<ACT> shortcuts into ACTION type", () => {
    const cmd = parseCbsCommand("ACTION:TOGGLE_THEME");
    return cmd.isValid && cmd.type === "ACTION" && cmd.actionId === "toggle_theme";
  });

  test("rejects empty string or invalid syntax safely", () => {
    const emptyCmd = parseCbsCommand("");
    const invalidCharCmd = parseCbsCommand("###@@@");
    return !emptyCmd.isValid && !invalidCharCmd.isValid;
  });
});

suite("Phase 2: User Profile & Function Rights Enforcement Validator", () => {
  const fullUser: CurrentUser = {
    userId: "ZZ0284590",
    fullName: "MD. HADIUZZAMAN BAPPY",
    userRole: ["Administrator"],
    accessibility: "RIDASH",
    functionRights: ["R", "I", "D", "A", "S", "H"],
    branchCode: "JB9999",
    branchName: "CENTRAL OFFICE, HO, DHAKA",
    txnDate: "2026-01-07",
    isLoggedIn: true,
    commandLine: true,
    initLogin: false,
    userStatus: 1,
  };

  const restrictedUser: CurrentUser = {
    ...fullUser,
    userId: "ST010001",
    commandLine: false, // No commandLine right
    accessibility: "R---S-",
    functionRights: ["R", "S"], // Only Read & See
  };

  test("allows valid command for user with commandLine=true and full RIDASH", () => {
    const parsed = parseCbsCommand("ACCOUNT I F3");
    const result = validateCommandForUser(parsed, fullUser);
    return result.allowed;
  });

  test("blocks raw application command if user has commandLine=false", () => {
    const parsed = parseCbsCommand("ACCOUNT");
    const result = validateCommandForUser(parsed, restrictedUser);
    return !result.allowed && Boolean(result.reason?.includes("does not have Command Line access"));
  });

  test("blocks specific function if user lacks RIDASH code (e.g. lacks 'I')", () => {
    const tellerWithCLI: CurrentUser = {
      ...restrictedUser,
      commandLine: true, // CLI enabled, but only R and S rights
    };
    const parsed = parseCbsCommand("ACCOUNT I F3");
    const result = validateCommandForUser(parsed, tellerWithCLI);
    return (
      !result.allowed && Boolean(result.reason?.includes("User lacks Input / Create ('I') rights"))
    );
  });

  test("allows permitted function for user (e.g. has 'S')", () => {
    const tellerWithCLI: CurrentUser = {
      ...restrictedUser,
      commandLine: true,
    };
    const parsed = parseCbsCommand("ACCOUNT S 1001");
    const result = validateCommandForUser(parsed, tellerWithCLI);
    return result.allowed;
  });

  test("universally allows SETTINGS and ACTION regardless of user role", () => {
    const parsedSettings = parseCbsCommand("SETTINGS:PROFILE");
    const parsedAction = parseCbsCommand("ACTION:TOGGLE_THEME");
    return (
      validateCommandForUser(parsedSettings, restrictedUser).allowed &&
      validateCommandForUser(parsedAction, restrictedUser).allowed
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

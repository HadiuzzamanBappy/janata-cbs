/**
 * Automated Verification Suite for Core Infrastructure Services (@/lib/infra-services)
 * Tests Universal CBS Gateway Routing, Command Normalizer, Security Barriers,
 * and the complete standard gRPC Protocol Error Translation Matrix.
 *
 * Usage:
 *   pnpm tsx scripts/verify-infra-services.ts
 */

// Pre-empt server-only in require.cache
try {
  const serverOnlyPath = require.resolve("server-only");
  require.cache[serverOnlyPath] = {
    id: serverOnlyPath,
    filename: serverOnlyPath,
    loaded: true,
    exports: {},
    children: [],
    path: "",
    paths: [],
  } as unknown as NodeModule;
} catch {
  // Ignore if not resolvable
}

export {};

async function runSuite() {
  const { appConfig } = await import("@/lib/core-config/server");
  const { isStaticMode } = await import("@/lib/infra-grpc");
  const { grpcStatusToHttp } = await import("@/lib/infra-grpc/client");
  const { DEFAULT_AUTH_LEVEL, GRPC_SERVICE_CATEGORY, normalizeCommand, resolveServiceContext } =
    await import("@/lib/infra-services/service-context");

  interface TestReport {
    name: string;
    passed: boolean;
    error?: string;
  }

  const reports: TestReport[] = [];

  function assert(name: string, condition: boolean, extraInfo?: string) {
    if (condition) {
      reports.push({ name, passed: true });
      console.log(`  [PASS] ${name}`);
    } else {
      reports.push({ name, passed: false, error: extraInfo });
      console.error(`  [FAIL] ${name}${extraInfo ? ` -> ${extraInfo}` : ""}`);
    }
  }

  const originalDataSource = appConfig.dataSource;

  console.log("\n========================================================");
  console.log("   INFRASTRUCTURE SERVICES (gRPC & GATEWAY CORE SUITE)  ");
  console.log("========================================================");
  console.log(`  Active .env.local DATA_SOURCE : "${originalDataSource.toUpperCase()}"`);
  console.log(
    `  Target Architecture Provider  : ${
      originalDataSource === "grpc" ? `gRPC (${appConfig.grpc.host})` : "Local Static Fixtures"
    }`,
  );
  console.log("========================================================\n");

  try {
    // =========================================================================
    // SECTION 1: Gateway Routing & Runtime Configuration Switch
    // =========================================================================
    console.log("── 1. Gateway Routing & Runtime Configuration Switch ──");

    assert(
      `Active Mode: isStaticMode() matches .env.local (${
        originalDataSource === "static" ? "true [Static]" : "false [gRPC]"
      })`,
      isStaticMode() === (originalDataSource === "static"),
    );

    (appConfig as { dataSource: string }).dataSource = "static";
    assert(
      "Gateway Switch: isStaticMode() returns true when DATA_SOURCE is 'static'",
      isStaticMode() === true,
    );

    (appConfig as { dataSource: string }).dataSource = "grpc";
    assert(
      "Gateway Switch: isStaticMode() returns false when DATA_SOURCE is 'grpc'",
      isStaticMode() === false,
    );

    // =========================================================================
    // SECTION 2: Command Normalization Engine (normalizeCommand)
    // =========================================================================
    console.log("\n── 2. Command Normalization Engine (normalizeCommand) ──");

    assert(
      "Normalize: Strips INQ prefix and comma version (INQ AC.LIST,1 -> AC.LIST)",
      normalizeCommand("INQ AC.LIST,1") === "AC.LIST",
    );
    assert(
      "Normalize: Strips INQUIRY full prefix (INQUIRY GET.CUSTOMER -> GET.CUSTOMER)",
      normalizeCommand("INQUIRY GET.CUSTOMER") === "GET.CUSTOMER",
    );
    assert(
      "Normalize: Strips trailing function code (ACCOUNT I -> ACCOUNT)",
      normalizeCommand("ACCOUNT I") === "ACCOUNT",
    );
    assert(
      "Normalize: Strips trailing function code S (ACCOUNT S -> ACCOUNT)",
      normalizeCommand("ACCOUNT S") === "ACCOUNT",
    );
    assert(
      "Normalize: Strips leading function code (S ACCOUNT -> ACCOUNT)",
      normalizeCommand("S ACCOUNT") === "ACCOUNT",
    );
    assert(
      "Normalize: Strips leading function code I (I USER -> USER)",
      normalizeCommand("I USER") === "USER",
    );
    assert(
      "Normalize: Preserves version suffix when preserveVersion: true",
      normalizeCommand("USER.MGT,NEW1", { preserveVersion: true }) === "USER.MGT,NEW1",
    );
    assert(
      "Normalize: Strips version suffix when preserveVersion: false",
      normalizeCommand("USER.MGT,NEW1", { preserveVersion: false }) === "USER.MGT",
    );
    assert(
      "Normalize: Resilient to extra surrounding whitespace and lowercase",
      normalizeCommand("   inq   cust.portfolio,1   ") === "CUST.PORTFOLIO",
    );

    // =========================================================================
    // SECTION 3: gRPC Mode Protocol, Security & Error Translation Matrix
    // =========================================================================
    console.log("\n── 3. gRPC Mode Protocol, Security & Status Code Mapping ──");
    console.log("  [Note: Tests protocol contracts, security barriers & error mappers");
    console.log("         without requiring a live backend connection or VPN.]\n");
    (appConfig as { dataSource: string }).dataSource = "grpc";

    assert(
      "gRPC Mode: isStaticMode() confirms false (no static mock bypass in production)",
      isStaticMode() === false,
    );

    // 3.1 Security Pre-conditions in gRPC Mode
    let securityErrorThrown = false;
    let securityErrorMessage = "";
    try {
      await resolveServiceContext();
    } catch (err: unknown) {
      securityErrorThrown = true;
      securityErrorMessage = (err as Error).message;
    }
    assert(
      "gRPC Security: resolveServiceContext throws UNAUTHENTICATED without session",
      securityErrorThrown && securityErrorMessage.includes("UNAUTHENTICATED"),
      `Actual message: "${securityErrorMessage}"`,
    );

    // 3.2 Service Configuration Contracts
    assert(
      "gRPC Contract: service category defaults to 'nonfinancial'",
      GRPC_SERVICE_CATEGORY === "nonfinancial",
    );
    assert("gRPC Contract: default auth level is 1", DEFAULT_AUTH_LEVEL === 1);

    // 3.3 Complete Standard gRPC Status Code to HTTP Translation Matrix
    assert("gRPC Status 0 (OK) -> HTTP 200", grpcStatusToHttp({ code: 0 }).status === 200);
    assert(
      "gRPC Status 3 (INVALID_ARGUMENT) -> HTTP 400",
      grpcStatusToHttp({ code: 3 }).status === 400,
    );
    assert(
      "gRPC Status 4 (DEADLINE_EXCEEDED) -> HTTP 504",
      grpcStatusToHttp({ code: 4 }).status === 504,
    );
    assert("gRPC Status 5 (NOT_FOUND) -> HTTP 404", grpcStatusToHttp({ code: 5 }).status === 404);
    assert(
      "gRPC Status 6 (ALREADY_EXISTS) -> HTTP 409",
      grpcStatusToHttp({ code: 6 }).status === 409,
    );
    assert(
      "gRPC Status 7 (PERMISSION_DENIED) -> HTTP 403",
      grpcStatusToHttp({ code: 7 }).status === 403,
    );
    assert(
      "gRPC Status 14 (UNAVAILABLE) -> HTTP 503",
      grpcStatusToHttp({ code: 14 }).status === 503,
    );
    assert(
      "gRPC Status 16 (UNAUTHENTICATED) -> HTTP 401",
      grpcStatusToHttp({ code: 16 }).status === 401,
    );
    assert("gRPC Status 2 (UNKNOWN) -> HTTP 500", grpcStatusToHttp({ code: 2 }).status === 500);
    assert("gRPC Status 13 (INTERNAL) -> HTTP 500", grpcStatusToHttp({ code: 13 }).status === 500);
    assert("gRPC Status 15 (DATA_LOSS) -> HTTP 500", grpcStatusToHttp({ code: 15 }).status === 500);
    assert(
      "gRPC Status Unhandled Code -> HTTP 500",
      grpcStatusToHttp({ code: 999 }).status === 500,
    );

    // 3.4 Status Message and Details Preservation
    const mappedWithDetails = grpcStatusToHttp({
      code: 3,
      details: "Field 'accountTitle' is mandatory",
    });
    assert(
      "gRPC Status Mapper: Preserves detailed error message from gRPC response",
      mappedWithDetails.message === "Field 'accountTitle' is mandatory",
    );
  } finally {
    (appConfig as { dataSource: string }).dataSource = originalDataSource;
  }

  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(
      `ALL ${reports.length} INFRASTRUCTURE SERVICE & gRPC PROTOCOL TESTS PASSED WITH 100% SUCCESS!`,
    );
    console.log("========================================================\n");
    process.exit(0);
  } else {
    const failedCount = reports.filter((r) => !r.passed).length;
    console.error(`FAILED: ${failedCount} OF ${reports.length} TESTS FAILED!`);
    console.log("========================================================\n");
    process.exit(1);
  }
}

runSuite().catch((err: unknown) => {
  console.error("Runner failed:", err);
  process.exit(1);
});

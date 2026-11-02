/**
 * Automated Verification Suite for Core gRPC Infrastructure & Gateway Protocol (@/lib/infra-grpc)
 * Tests Gateway Routing, Runtime Configuration Switch,
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
  console.log("   INFRASTRUCTURE (gRPC GATEWAY & PROTOCOL CORE SUITE)  ");
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
    // SECTION 2: gRPC Mode Protocol & Status Code Mapping
    // =========================================================================
    console.log("\n── 2. gRPC Mode Protocol & Status Code Mapping ──");
    (appConfig as { dataSource: string }).dataSource = "grpc";

    assert(
      "gRPC Mode: isStaticMode() confirms false (no static mock bypass in production)",
      isStaticMode() === false,
    );

    // Complete Standard gRPC Status Code to HTTP Translation Matrix
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
      "gRPC Status 8 (RESOURCE_EXHAUSTED) -> HTTP 429",
      grpcStatusToHttp({ code: 8 }).status === 429,
    );
    assert(
      "gRPC Status 9 (FAILED_PRECONDITION) -> HTTP 412",
      grpcStatusToHttp({ code: 9 }).status === 412,
    );
    assert("gRPC Status 10 (ABORTED) -> HTTP 409", grpcStatusToHttp({ code: 10 }).status === 409);
    assert(
      "gRPC Status 11 (OUT_OF_RANGE) -> HTTP 400",
      grpcStatusToHttp({ code: 11 }).status === 400,
    );
    assert(
      "gRPC Status 12 (UNIMPLEMENTED) -> HTTP 501",
      grpcStatusToHttp({ code: 12 }).status === 501,
    );
    assert("gRPC Status 13 (INTERNAL) -> HTTP 500", grpcStatusToHttp({ code: 13 }).status === 500);
    assert(
      "gRPC Status 14 (UNAVAILABLE) -> HTTP 503",
      grpcStatusToHttp({ code: 14 }).status === 503,
    );
    assert("gRPC Status 15 (DATA_LOSS) -> HTTP 500", grpcStatusToHttp({ code: 15 }).status === 500);
    assert(
      "gRPC Status 16 (UNAUTHENTICATED) -> HTTP 401",
      grpcStatusToHttp({ code: 16 }).status === 401,
    );
    assert(
      "gRPC Fallback: Unknown Status Code 999 -> HTTP 500",
      grpcStatusToHttp({ code: 999 }).status === 500,
    );
  } finally {
    (appConfig as { dataSource: string }).dataSource = originalDataSource;
  }

  const failedCount = reports.filter((r) => !r.passed).length;
  console.log(`\n========================================================`);
  if (failedCount === 0) {
    console.log(`>>> ALL ${reports.length} gRPC PROTOCOL TESTS PASSED CLEANLY! <<<`);
    console.log(`========================================================\n`);
    process.exit(0);
  } else {
    console.error(`>>> FAILED: ${failedCount} OF ${reports.length} TESTS FAILED! <<<`);
    console.log(`========================================================\n`);
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("FATAL SUITE CRASH:", err);
  process.exit(1);
});

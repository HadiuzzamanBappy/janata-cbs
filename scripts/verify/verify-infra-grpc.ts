/**
 * Automated Verification Suite for Core gRPC Infrastructure & Gateway Protocol (@/lib/infra-grpc)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/infra-grpc` with explicit Input and Output visualization:
 * 1. Runtime Mode Check (isStaticMode: validates dataSource configuration)
 * 2. Downstream Gateway Routing (getService: default gRPC route vs custom microservices)
 * 3. Financial Transaction Classification (financial vs non-financial pipeline)
 * 4. gRPC Protocol to HTTP Status Error Translation (standard mapping matrix)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-infra-grpc.ts
 */

// Pre-empt server-only in require.cache for standalone Node test runner
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

interface TestCase {
  title: string;
  input: unknown;
  output: unknown;
  passed: boolean;
  error?: string;
}

const testCases: TestCase[] = [];

function recordTest(
  title: string,
  input: unknown,
  output: unknown,
  condition: boolean,
  error?: string,
) {
  testCases.push({ title, input, output, passed: condition, error });
  const statusTag = condition ? "\x1b[32m✔ [PASS]\x1b[0m" : "\x1b[31m✖ [FAIL]\x1b[0m";
  console.log(`\n${statusTag} ${title}`);
  console.log(`       Input  : ${typeof input === "string" ? input : JSON.stringify(input)}`);
  console.log(`       Output : ${typeof output === "string" ? output : JSON.stringify(output)}`);
  if (!condition && error) {
    console.error(`       Error  : ${error}`);
  }
}

async function runSuite() {
  const { appConfig, getService } = await import("@/lib/core-config/server");
  const { isStaticMode } = await import("@/lib/infra-grpc");
  const { grpcStatusToHttp } = await import("@/lib/infra-grpc/client");

  console.log("\n================================================================================");
  console.log("             CBS GRPC INFRASTRUCTURE & DISPATCH VERIFICATION                   ");
  console.log("================================================================================");
  console.log(" Architecture : Server-Side gRPC Gateway & Protocol Mapper (@/lib/infra-grpc)");
  console.log(" Pattern      : Single Unique Test per Infra Capability with Visible IO");
  console.log("================================================================================");

  // ── 1. Runtime Mode Check ──
  console.log("\n── 1. Runtime Mode Check (isStaticMode) ──");
  const isStatic = isStaticMode();
  recordTest(
    "1.1 Checks whether runtime mode matches dataSource configuration",
    { dataSource: appConfig.dataSource },
    { isStaticMode: isStatic },
    isStatic === (appConfig.dataSource === "static"),
  );

  // ── 2. Downstream Gateway Service Routing ──
  console.log("\n── 2. Downstream Gateway Routing (getService) ──");
  const defaultRoute = getService("default");
  recordTest(
    "2.1 Resolves default gRPC routing destination and protocol",
    { servicePath: "default" },
    { url: defaultRoute?.url, protocol: defaultRoute?.protocol },
    Boolean(defaultRoute?.url) && defaultRoute?.protocol === "grpc",
  );

  const unknownRoute = getService("unknown-service-path");
  recordTest(
    "2.2 Falls back safely to default route when requested servicePath is unknown",
    { servicePath: "unknown-service-path" },
    { url: unknownRoute?.url, protocol: unknownRoute?.protocol },
    unknownRoute?.url === defaultRoute?.url,
  );

  // ── 3. Financial Transaction Classification ──
  console.log("\n── 3. Financial Transaction Classification ──");
  const financialTypes = appConfig.grpc.financialTransactionTypes;
  recordTest(
    "3.1 Validates financial transaction types configured for dual-phase processing",
    { configuredTypes: financialTypes },
    { isConfigured: financialTypes.length > 0, typesCount: financialTypes.length },
    financialTypes.length > 0 && financialTypes.includes("AFT"),
  );

  // ── 4. gRPC Protocol to HTTP Status Translation ──
  console.log("\n── 4. gRPC Protocol to HTTP Status Translation (grpcStatusToHttp) ──");
  const mappingExamples: Array<{ grpcCode: number; expectedHttp: number; name: string }> = [
    { grpcCode: 0, expectedHttp: 200, name: "OK" },
    { grpcCode: 3, expectedHttp: 400, name: "INVALID_ARGUMENT" },
    { grpcCode: 5, expectedHttp: 404, name: "NOT_FOUND" },
    { grpcCode: 7, expectedHttp: 403, name: "PERMISSION_DENIED" },
    { grpcCode: 16, expectedHttp: 401, name: "UNAUTHENTICATED" },
    { grpcCode: 14, expectedHttp: 503, name: "UNAVAILABLE" },
  ];

  for (const item of mappingExamples) {
    const res = grpcStatusToHttp({ code: item.grpcCode, details: `Simulated ${item.name}` });
    recordTest(
      `4.${item.grpcCode} Translates gRPC ${item.name} (${item.grpcCode}) to HTTP ${item.expectedHttp}`,
      { grpcCode: item.grpcCode, name: item.name },
      { httpStatus: res.status, message: res.message },
      res.status === item.expectedHttp,
    );
  }

  // Consolidated Summary
  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  console.log("\n================================================================================");
  if (failedTests === 0) {
    console.log(
      `>>> SUCCESS: ALL ${passedTests} GRPC INFRASTRUCTURE CAPABILITIES VALIDATED 100% CLEAN! <<<`,
    );
  } else {
    console.error(`>>> FAILURE: ${failedTests} TESTS FAILED! <<<`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runSuite().catch((err: unknown) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});

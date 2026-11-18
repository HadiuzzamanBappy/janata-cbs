/**
 * Automated Verification Suite for CBS Core Configuration (@/lib/core-config)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/core-config` with explicit Input and Output visualization:
 * 1. Runtime Environment Permutations (Offline static vs Production gRPC)
 * 2. Microservice Registry (serviceEnvSchema: SERVICE_<NAME>_URL, wire servicePath names)
 * 3. Client Storage & Cookie Keys Invariants (clientConfig)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-core-config.ts
 */

// Pre-empt server-only in require.cache for standalone Node / tsx execution
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
  const { clientConfig } = await import("@/lib/core-config");
  const { cbsWirePayloadSchema, envSchema, serviceEnvSchema } = await import("@/lib/data-schemas");

  console.log("================================================================================");
  console.log("       CBS CORE CONFIGURATION VERIFICATION (@/lib/core-config)                  ");
  console.log("================================================================================");

  // 1. Offline Permutation Validation
  const envOfflineRaw = {
    DATA_SOURCE: "static",
    CACHE_ENABLED: "false",
    NODE_ENV: "development",
  };
  const envOffline = envSchema.safeParse(envOfflineRaw);
  recordTest(
    "1. Offline Permutation: Parses static data source without external network services",
    envOfflineRaw,
    { success: envOffline.success, dataSource: envOffline.data?.DATA_SOURCE },
    envOffline.success === true && envOffline.data?.DATA_SOURCE === "static",
  );

  // 2. Production gRPC Permutation Validation
  const envGrpcRaw = {
    DATA_SOURCE: "grpc",
    GRPC_HOST: "localhost:9090",
    CACHE_ENABLED: "false",
    NODE_ENV: "production",
  };
  const envGrpc = envSchema.safeParse(envGrpcRaw);
  recordTest(
    "2. Production Permutation: Parses gRPC data source with configured host",
    envGrpcRaw,
    { success: envGrpc.success, host: envGrpc.data?.GRPC_HOST },
    envGrpc.success === true && envGrpc.data?.GRPC_HOST === "localhost:9090",
  );

  // 3. Microservice Registry (SERVICE_<NAME>_URL)
  const registry = serviceEnvSchema.safeParse({
    GRPC_HOST: "172.18.18.66:50055",
    SERVICE_FINXURM_URL: " http://localhost:8282/finxurm/inq ",
    SERVICE_FINXLOAN_URL: "localhost:8383",
  });
  recordTest(
    "3.1 Service Registry: collects SERVICE_<NAME>_URL as lowercase names, ignores other keys",
    {
      SERVICE_FINXURM_URL: "http://localhost:8282/finxurm/inq",
      SERVICE_FINXLOAN_URL: "localhost:8383",
    },
    registry.data,
    JSON.stringify(registry.data) ===
      JSON.stringify({ finxurm: "http://localhost:8282/finxurm/inq", finxloan: "localhost:8383" }),
  );

  const rejected = [
    { SERVICE_URM_BASE_URL: "http://localhost:8282" },
    { SERVICE_FINXURM_ULR: "localhost:8282" },
    { SERVICE_DEFAULT_URL: "localhost:9090" },
    { SERVICE_FINXURM_URL: "localhost" },
    { SERVICE_FINXURM_URL: "http://" },
  ].map((vars) => ({ vars, ok: serviceEnvSchema.safeParse(vars).success }));
  recordTest(
    "3.2 Service Registry: start-up fails on a retired or misspelled key, the reserved default, a bad address",
    rejected.map((r) => r.vars),
    rejected,
    rejected.every((r) => !r.ok),
  );

  const wire = (servicePath: string) =>
    cbsWirePayloadSchema.safeParse({ requestType: "INQ", servicePath }).success;
  recordTest(
    "3.3 Wire servicePath: a service name or empty; never an address",
    ["finxurm", "", "/api/v1/data", "localhost:8282"],
    {
      finxurm: wire("finxurm"),
      empty: wire(""),
      path: wire("/api/v1/data"),
      host: wire("localhost:8282"),
    },
    wire("finxurm") && wire("") && !wire("/api/v1/data") && !wire("localhost:8282"),
  );

  // 4. Client Storage Namespace Invariants
  const sampleTab = "TAB_101";
  const draftKey = clientConfig.storage.session.draft(sampleTab);
  const criteriaKey = clientConfig.storage.session.criteria(sampleTab);
  recordTest(
    "4. Client Config: Storage key namespaces for drafts and criteria",
    { tabId: sampleTab },
    { draftKey, criteriaKey },
    draftKey.includes("cbs:draft:TAB_101") && criteriaKey.includes("cbs:criteria:TAB_101"),
  );

  // Final Summary
  console.log("\n================================================================================");
  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  if (failedTests === 0) {
    console.log(
      `\x1b[32m✔ SUCCESS: ALL ${passedTests} CORE CONFIGURATION CAPABILITIES VALIDATED 100% CLEAN!\x1b[0m`,
    );
    console.log(
      "================================================================================\n",
    );
  } else {
    console.error(`\x1b[31m✖ FAILURE: ${failedTests} TESTS FAILED!\x1b[0m`);
    console.log(
      "================================================================================\n",
    );
    process.exit(1);
  }
}

runSuite().catch((err: unknown) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});

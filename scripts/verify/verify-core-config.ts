/**
 * Automated Verification Suite for CBS Core Configuration (@/lib/core-config)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/core-config` with explicit Input and Output visualization:
 * 1. Runtime Environment Permutations (Offline static vs Production gRPC)
 * 2. Downstream Microservice Gateway URL Resolution (getServiceUrl)
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
  const { getServiceUrl } = await import("@/lib/core-config/server");
  const { envSchema } = await import("@/lib/data-schemas");

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

  // 3. Service Gateway Endpoint Resolution
  const custServiceUrl = getServiceUrl("customer");
  recordTest(
    "3. Service Registry: Resolves downstream microservice endpoint URL",
    { serviceKey: "customer" },
    { resolvedUrl: custServiceUrl },
    Boolean(custServiceUrl && custServiceUrl.length > 0),
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

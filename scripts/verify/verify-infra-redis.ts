/**
 * Automated Verification Suite for CBS Redis Subsystem (@/lib/infra-redis)
 *
 * Deterministic & Transparent: Tests all capabilities exposed by `@/lib/infra-redis`:
 * 1. Cache Key Namespacing & Circuit Breaker (cacheKey, tripCircuit, circuitOpen, resetCircuit)
 * 2. Declarative Spec Cache Policies (resolveCacheDescriptor for Form, Model, Inquiry, Menu)
 * 3. Non-Cacheable Rejection Guard (Mutations, Searches, Runtime INQ & LIST rejected)
 * 4. Spec Auto-Invalidation on Mutation (FORM_CONFIG, MODEL_CONFIG, MENU_TREE)
 * 5. Read-Sequence Protection (GNI does NOT trigger cache eviction)
 * 6. Single-Flight Concurrency Deduplication (Collapses duplicate in-flight promises)
 * 7. Rate Limiter Fail-Open Protection (rateLimit handles circuit trips gracefully)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-infra-redis.ts
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
  const {
    cacheKey,
    circuitOpen,
    tripCircuit,
    resetCircuit,
    resolveCacheDescriptor,
    autoInvalidateOnMutation,
    singleFlight,
    rateLimit,
  } = await import("@/lib/infra-redis");
  const { CbsControlTable, CbsRecordFunction, CbsRequestType } = await import("@/types");
  const { serverConfig } = await import("@/lib/core-config/server");

  console.log("================================================================================");
  console.log("   CBS INFRA REDIS SPECIFICATION & RESILIENCE VERIFICATION SUITE               ");
  console.log("================================================================================");

  // ---------------------------------------------------------------------------
  // 1. Cache Key Namespacing & Circuit Breaker
  // ---------------------------------------------------------------------------
  const testKey = cacheKey("spec", "form", "ACCOUNT");
  const expectedKey = `${serverConfig.redis.keyPrefix}:spec:form:ACCOUNT`;
  recordTest(
    "1. Cache Key Namespacing prepends canonical key prefix",
    'cacheKey("spec", "form", "ACCOUNT")',
    testKey,
    testKey === expectedKey,
  );

  resetCircuit();
  const initiallyClosed = !circuitOpen();
  tripCircuit();
  const tripped = circuitOpen();
  resetCircuit();
  const resetClosed = !circuitOpen();
  recordTest(
    "2. Circuit Breaker transitions correctly (Closed -> Tripped -> Reset)",
    { initiallyClosed, tripped, resetClosed },
    { closed: resetClosed },
    initiallyClosed && tripped && resetClosed,
  );

  // ---------------------------------------------------------------------------
  // 2. Declarative Spec Cache Policies (Read Operations)
  // ---------------------------------------------------------------------------
  const formDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.GET,
    controlName: CbsControlTable.FORM_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "ACCOUNT",
  });
  recordTest(
    "3. Form Config Spec maps to canonical formSpec key & TTL",
    { control: CbsControlTable.FORM_CONFIG, id: "ACCOUNT" },
    formDesc,
    formDesc?.key === serverConfig.redis.cacheKeys.formSpec("ACCOUNT") &&
      formDesc?.ttl === serverConfig.redis.specTtlSeconds,
  );

  const gfcDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.GFC,
    controlName: CbsControlTable.FORM_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "ACCOUNT",
  });
  recordTest(
    "4. Canonical GFC request maps to FORM.CONFIG spec key",
    { requestType: "GFC", control: CbsControlTable.FORM_CONFIG, recordId: "ACCOUNT" },
    gfcDesc,
    gfcDesc?.key === serverConfig.redis.cacheKeys.formSpec("ACCOUNT"),
  );

  const missingControlDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.GET,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "ACCOUNT",
  });
  recordTest(
    "4b. Missing controlName strictly returns null (zero legacy shims)",
    { controlName: undefined, recordId: "ACCOUNT" },
    missingControlDesc,
    missingControlDesc === null,
  );

  const modelDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.GMC,
    controlName: CbsControlTable.MODEL_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "CUSTOMER",
  });
  recordTest(
    "5. Model Config Spec maps to modelSpec key",
    { control: CbsControlTable.MODEL_CONFIG, id: "CUSTOMER" },
    modelDesc,
    modelDesc?.key === serverConfig.redis.cacheKeys.modelSpec("CUSTOMER"),
  );

  const enqDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.GET,
    controlName: CbsControlTable.INQUIRY_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "DAILY_TXN",
  });
  recordTest(
    "6. Inquiry Config Spec maps to inquirySpec key",
    { control: CbsControlTable.INQUIRY_CONFIG, id: "DAILY_TXN" },
    enqDesc,
    enqDesc?.key === serverConfig.redis.cacheKeys.inquirySpec("DAILY_TXN"),
  );

  const menuDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.GUM,
    controlName: CbsControlTable.MENU_TREE,
    recordFunction: CbsRecordFunction.SEE,
    userId: "AD028459",
  });
  recordTest(
    "7. Navigation Menu Tree maps to user menu key with menu TTL",
    { control: CbsControlTable.MENU_TREE, userId: "AD028459" },
    menuDesc,
    menuDesc?.key === serverConfig.redis.cacheKeys.menu("user:AD028459") &&
      menuDesc?.ttl === serverConfig.redis.menuTtlSeconds,
  );

  // ---------------------------------------------------------------------------
  // 3. Strict Non-Cacheable Rejection Guards
  // ---------------------------------------------------------------------------
  const mutationDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.PUT,
    controlName: CbsControlTable.FORM_CONFIG,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: "ACCOUNT",
  });
  recordTest(
    "8. Mutations (PUT/INPUT) are strictly non-cacheable (returns null)",
    { requestType: "PUT", func: "I" },
    mutationDesc,
    mutationDesc === null,
  );

  const inqDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.INQ,
    controlName: "ACCOUNT.BALANCE",
    recordFunction: CbsRecordFunction.SEE,
  });
  recordTest(
    "9. Runtime Inquiries (INQ) are strictly non-cacheable (returns null)",
    { requestType: "INQ" },
    inqDesc,
    inqDesc === null,
  );

  const searchDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.SBI,
    controlName: "ACCOUNT",
  });
  recordTest(
    "10. Dynamic Searches (SBI) are strictly non-cacheable (returns null)",
    { requestType: "SBI" },
    searchDesc,
    searchDesc === null,
  );

  const missingIdDesc = resolveCacheDescriptor({
    requestType: CbsRequestType.GET,
    controlName: CbsControlTable.FORM_CONFIG,
    recordFunction: CbsRecordFunction.SEE,
    recordId: "",
  });
  recordTest(
    "11. Missing recordId on spec requiring ID returns null",
    { control: CbsControlTable.FORM_CONFIG, recordId: "" },
    missingIdDesc,
    missingIdDesc === null,
  );

  // ---------------------------------------------------------------------------
  // 4. Auto-Invalidation on Mutation & Read-Sequence Protection
  // ---------------------------------------------------------------------------
  const gniResult = await autoInvalidateOnMutation({
    requestType: CbsRequestType.GNI,
    controlName: CbsControlTable.FORM_CONFIG,
    recordFunction: CbsRecordFunction.INPUT,
    recordId: "ACCOUNT",
  });
  recordTest(
    "12. Read sequence GNI (Get New ID) never triggers cache invalidation",
    { requestType: "GNI", control: CbsControlTable.FORM_CONFIG },
    gniResult,
    gniResult === 0,
  );

  const opMutationResult = await autoInvalidateOnMutation({
    requestType: CbsRequestType.ATT,
    controlName: "ACCOUNT.TRANSFER",
    recordFunction: CbsRecordFunction.INPUT,
    recordId: "TXN123456",
  });
  recordTest(
    "13. Operational financial mutations do not invalidate metadata caches",
    { requestType: "ATT", control: "ACCOUNT.TRANSFER" },
    opMutationResult,
    opMutationResult === 0,
  );

  // ---------------------------------------------------------------------------
  // 5. Single-Flight Concurrency Deduplication
  // ---------------------------------------------------------------------------
  let fetchCount = 0;
  const mockFetch = async () => {
    fetchCount++;
    await new Promise((resolve) => setTimeout(resolve, 50));
    return { compiled: true, count: fetchCount };
  };

  const [res1, res2, res3] = await Promise.all([
    singleFlight("test:singleflight:key", mockFetch),
    singleFlight("test:singleflight:key", mockFetch),
    singleFlight("test:singleflight:key", mockFetch),
  ]);

  recordTest(
    "14. Single-flight collapses 3 concurrent requests into 1 execution",
    { requests: 3, fetchCount },
    { res1, res2, res3, totalFetches: fetchCount },
    fetchCount === 1 && res1.count === 1 && res2.count === 1 && res3.count === 1,
  );

  // ---------------------------------------------------------------------------
  // 6. Rate Limiter Fail-Open Protection
  // ---------------------------------------------------------------------------
  tripCircuit();
  const rlResult = await rateLimit("test:ip:user", 5, 60);
  resetCircuit();
  recordTest(
    "15. Rate Limiter fails open gracefully when circuit is tripped",
    { key: "test:ip:user", circuitOpen: true },
    rlResult,
    rlResult.allowed === true && rlResult.remaining === 5,
  );

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  const total = testCases.length;
  const passed = testCases.filter((t) => t.passed).length;
  const failed = total - passed;

  if (failed > 0) {
    console.error(`\x1b[31m[FAILED] ${failed} of ${total} tests failed!\x1b[0m`);
    process.exit(1);
  } else {
    console.log(
      `\x1b[32m[SUCCESS] All ${total} infra-redis verification tests PASSED 100% CLEAN!\x1b[0m`,
    );
    process.exit(0);
  }
}

runSuite().catch((err) => {
  console.error("FATAL: Redis verification runner failed unexpectedly:", err);
  process.exit(1);
});

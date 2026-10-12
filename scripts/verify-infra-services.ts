/**
 * Automated Verification Suite for Infrastructure Services (@/lib/infra-services)
 * Tests static/mock service fallbacks, catalog payloads, model lookups (GRL), and enquiry specs.
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

async function runSuite() {
  const {
    getMockBranchesPayload,
    getMockControlsPayload,
    getMockFormPayload,
    getMockInquiryPayload,
    getMockMenuPayload,
    getMockProxyResponse,
    getMockUserResponse,
  } = await import("@/lib/infra-services/mock-service");

  interface TestReport {
    name: string;
    passed: boolean;
    error?: string;
  }

  const reports: TestReport[] = [];

  function assert(name: string, condition: boolean, extraInfo?: string) {
    if (condition) {
      reports.push({ name, passed: true });
      console.log(`[PASS] ${name}`);
    } else {
      reports.push({ name, passed: false, error: extraInfo });
      console.error(`[FAIL] ${name}${extraInfo ? ` -> ${extraInfo}` : ""}`);
    }
  }

  console.log("\n========================================================");
  console.log("    INFRASTRUCTURE SERVICES (FALLBACK / MOCK) SUITE     ");
  console.log("========================================================\n");

  // 1. Mock Authentication
  const mockUser = getMockUserResponse("ZZ028459");
  assert(
    "Auth: getMockUserResponse('ZZ028459') returns valid user",
    Boolean(mockUser && mockUser.status === "SUCCESS"),
  );
  const userData = mockUser?.data as Record<string, unknown> | undefined;
  assert(
    "Auth: mock user has RIDASHL accessibility",
    Boolean(typeof userData?.accessibility === "string" && userData.accessibility.includes("L")),
  );

  const unknownUser = getMockUserResponse("NONEXISTENT_USER");
  assert("Auth: getMockUserResponse returns null for unknown user", unknownUser === null);

  // 2. Menu Navigation Wire Payload
  const menuPayload = getMockMenuPayload();
  assert(
    "Menu: getMockMenuPayload returns non-null data",
    menuPayload !== null && menuPayload !== undefined,
  );

  // 3. Form Model Wire Payload (GMC)
  const formPayload = getMockFormPayload("ACCOUNT");
  assert(
    "Form: getMockFormPayload('ACCOUNT') returns valid model",
    formPayload !== null && formPayload !== undefined,
  );

  const formVersionPayload = getMockFormPayload("USER.MGT,NEW1");
  assert(
    "Form: getMockFormPayload('USER.MGT,NEW1') returns model",
    formVersionPayload !== null && formVersionPayload !== undefined,
  );

  // 4. Inquiry Model Wire Payload
  const inqPayload = getMockInquiryPayload("GET.EMP.INFO");
  assert(
    "Inquiry: getMockInquiryPayload('GET.EMP.INFO') returns valid spec",
    inqPayload !== null && inqPayload !== undefined,
  );

  // 5. Branches & Controls Directory Payloads
  const branches = getMockBranchesPayload();
  assert(
    "Branches: getMockBranchesPayload returns non-null data",
    branches !== null && branches !== undefined,
  );

  const controls = getMockControlsPayload();
  assert(
    "Controls: getMockControlsPayload returns non-null data",
    controls !== null && controls !== undefined,
  );

  // 6. Record Lookup (GRL) & Proxy Dispatcher
  const grlLookup = getMockProxyResponse("GRL", "USER.MGT");
  assert(
    "GRL Lookup: getMockProxyResponse('GRL', 'USER.MGT') status is SUCCESS",
    grlLookup.status === "SUCCESS",
  );
  assert(
    "GRL Lookup: getMockProxyResponse returns list array",
    Array.isArray(grlLookup.data) && grlLookup.data.length > 0,
  );

  // 7. Unknown Model Graceful Handling (GRL fallback generates mock records)
  const unknownProxy = getMockProxyResponse("GRL", "UNKNOWN_NONEXISTENT_CONTROL");
  assert(
    "Proxy Dispatcher: handles unknown model safely with fallback items",
    unknownProxy.status === "SUCCESS" &&
      Array.isArray(unknownProxy.data) &&
      unknownProxy.data.length > 0,
  );

  // 8. Unknown Record Fetch Returns 404 (RECORD_NOT_FOUND)
  const notFoundRecord = getMockProxyResponse("GET", "USER.MGT", "NONEXISTENT_RECORD_9999");
  assert(
    "Proxy Dispatcher: returns 404 RECORD_NOT_FOUND for missing recordId",
    notFoundRecord.statusCode === 404 && notFoundRecord.status === "RECORD_NOT_FOUND",
  );

  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(`ALL ${reports.length} INFRA SERVICES TEST CASES PASSED WITH 100% SUCCESS!`);
  } else {
    console.error("SOME INFRA SERVICES TESTS FAILED!");
    process.exit(1);
  }
  console.log("========================================================\n");
}

runSuite().catch((err) => {
  console.error("Runner failed:", err);
  process.exit(1);
});

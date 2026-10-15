/**
 * Automated Verification Suite for Infrastructure Services (@/lib/infra-services)
 * Tests both Static Mock Mode and Live gRPC Mode behaviors, security contracts, and error translations.
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
  const { appConfig } = await import("@/lib/core-config/server");
  const { isStaticMode, getStaticData } = await import("@/lib/infra-services/cbs-gateway");
  const {
    parseAuthWirePayload,
    parseBranchesWirePayload,
    parseControlsWirePayload,
    parseGMC,
    parseMNU,
  } = await import("@/lib/data-parsers");
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
  console.log("   INFRASTRUCTURE SERVICES (STATIC & gRPC DUAL SUITE)   ");
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
    // SECTION 1: Architecture Gate & Mode Detection
    // =========================================================================
    console.log("── 1. Architecture Mode Gate & Active Setting ──────────");

    assert(
      `Active Mode: isStaticMode() matches .env.local (${
        originalDataSource === "static" ? "true [Static]" : "false [gRPC]"
      })`,
      isStaticMode() === (originalDataSource === "static"),
    );

    (appConfig as { dataSource: string }).dataSource = "static";
    assert(
      "Gate Switch: isStaticMode() returns true when DATA_SOURCE is 'static'",
      isStaticMode() === true,
    );

    (appConfig as { dataSource: string }).dataSource = "grpc";
    assert(
      "Gate Switch: isStaticMode() returns false when DATA_SOURCE is 'grpc'",
      isStaticMode() === false,
    );

    // =========================================================================
    // SECTION 2: Static Mode Service Dispatches (DATA_SOURCE=static)
    // =========================================================================
    console.log("\n── 2. Static Mode Domain Service Routing (getStaticData) ──");
    (appConfig as { dataSource: string }).dataSource = "static";

    // 2.1 Static Authentication
    const mockUser = getStaticData("AUTH", "ZZ028459") as {
      status: string;
      statusCode: number;
      data: Record<string, unknown>;
    } | null;
    assert(
      "Auth: getStaticData('AUTH', 'ZZ028459') returns valid user payload",
      Boolean(mockUser && mockUser.status === "SUCCESS" && mockUser.statusCode === 200),
    );
    assert(
      "Auth: mock user contains real gRPC keys (userId, token, accessibility)",
      Boolean(
        mockUser?.data &&
          mockUser.data.userId === "ZZ0284590" &&
          typeof mockUser.data.accessibility === "string" &&
          mockUser.data.accessibility.includes("L") &&
          typeof mockUser.data.token === "string",
      ),
    );

    const unknownUser = getStaticData("AUTH", "NONEXISTENT_USER");
    assert("Auth: getStaticData('AUTH', 'NONEXISTENT_USER') returns null", unknownUser === null);

    const authParse = parseAuthWirePayload(mockUser?.data, "ZZ028459");
    assert(
      "Auth: static user payload parses cleanly into CurrentUser session",
      authParse.currUser.userId === "ZZ0284590" &&
        authParse.currUser.accessibility === "RIDASHL" &&
        authParse.currUser.branchCode === "JB9999",
    );

    // 2.2 Navigation Menu
    const menuPayload = getStaticData("MENU");
    assert(
      "Menu: getStaticData('MENU') returns navigation tree data",
      menuPayload !== null && menuPayload !== undefined,
    );
    const menuParsed = parseMNU(menuPayload);
    assert(
      "Menu: static menu payload parses into valid MenuItem hierarchy",
      menuParsed.success && menuParsed.data.length > 0,
    );

    // 2.3 Branch Directory
    const branchPayload = getStaticData("BRANCH");
    assert(
      "Branches: getStaticData('BRANCH') returns records list",
      branchPayload !== null && branchPayload !== undefined,
    );
    const branchesParsed = parseBranchesWirePayload(branchPayload);
    assert(
      "Branches: static branches payload parses into BranchRecord array (JB0001)",
      branchesParsed.length >= 4 && branchesParsed[0].recordId === "JB0001",
    );

    // 2.4 System Controls
    const controlPayload = getStaticData("CONTROL");
    assert(
      "Controls: getStaticData('CONTROL') returns controls list",
      controlPayload !== null && controlPayload !== undefined,
    );
    const controlsParsed = parseControlsWirePayload(controlPayload);
    assert(
      "Controls: static controls payload parses into SystemCommandItem array",
      controlsParsed.length >= 6 && controlsParsed.some((c) => c.command === "ACCOUNT"),
    );

    // 2.5 Inquiries
    const inqPayload = getStaticData("INQUIRY", "GET.EMP.INFO", "INQ");
    assert(
      "Inquiry: getStaticData('INQUIRY', 'GET.EMP.INFO') returns valid spec",
      inqPayload !== null && inqPayload !== undefined,
    );

    // 2.6 Dynamic Form Schemas
    const formPayload = getStaticData("FORM", "ACCOUNT", "GMC");
    assert(
      "Form: getStaticData('FORM', 'ACCOUNT', 'GMC') returns valid schema",
      formPayload !== null && formPayload !== undefined,
    );
    const formParsed = parseGMC(formPayload, "ACCOUNT");
    assert(
      "Form: static form payload parses into FormSchema (ACCOUNT)",
      formParsed.success && formParsed.data.code === "ACCOUNT",
    );

    const versionFormPayload = getStaticData("FORM", "USER.MGT,NEW1", "GMC");
    assert(
      "Form: versioned form 'USER.MGT,NEW1' resolves to base model schema",
      versionFormPayload !== null && versionFormPayload !== undefined,
    );

    // 2.7 Proxy Dispatcher
    const grlLookup = getStaticData("USER.MGT", "", "GRL") as {
      status: string;
      data: unknown[];
    };
    assert(
      "Proxy Dispatcher: GRL record lookup returns SUCCESS with record array",
      grlLookup.status === "SUCCESS" && Array.isArray(grlLookup.data) && grlLookup.data.length > 0,
    );

    const notFoundRecord = getStaticData("USER.MGT", "NONEXISTENT_9999", "GET") as {
      statusCode: number;
      status: string;
    };
    assert(
      "Proxy Dispatcher: missing recordId returns 404 RECORD_NOT_FOUND",
      notFoundRecord.statusCode === 404 && notFoundRecord.status === "RECORD_NOT_FOUND",
    );

    // =========================================================================
    // SECTION 3: gRPC Mode Verification (DATA_SOURCE=grpc)
    // =========================================================================
    console.log("\n── 3. gRPC Mode Enforcement & Invariant Checks (Offline-Safe) ──");
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
    assert(
      "gRPC Contract: command normalization strips function codes and params",
      normalizeCommand("INQ AC.LIST,1") === "AC.LIST" &&
        normalizeCommand("ACCOUNT I") === "ACCOUNT",
    );

    // 3.3 gRPC Status Code to HTTP Banking Status Mapping
    assert(
      "gRPC Status Mapper: translates OK (0) to 200",
      grpcStatusToHttp({ code: 0 }).status === 200,
    );
    assert(
      "gRPC Status Mapper: translates INVALID_ARGUMENT (3) to 400",
      grpcStatusToHttp({ code: 3 }).status === 400,
    );
    assert(
      "gRPC Status Mapper: translates UNAUTHENTICATED (16) to 401",
      grpcStatusToHttp({ code: 16 }).status === 401,
    );
    assert(
      "gRPC Status Mapper: translates PERMISSION_DENIED (7) to 403",
      grpcStatusToHttp({ code: 7 }).status === 403,
    );
    assert(
      "gRPC Status Mapper: translates NOT_FOUND (5) to 404",
      grpcStatusToHttp({ code: 5 }).status === 404,
    );
    assert(
      "gRPC Status Mapper: translates ALREADY_EXISTS (6) to 409",
      grpcStatusToHttp({ code: 6 }).status === 409,
    );
    assert(
      "gRPC Status Mapper: translates UNAVAILABLE (14) to 503",
      grpcStatusToHttp({ code: 14 }).status === 503,
    );
    assert(
      "gRPC Status Mapper: translates DEADLINE_EXCEEDED (4) to 504",
      grpcStatusToHttp({ code: 4 }).status === 504,
    );
    assert(
      "gRPC Status Mapper: translates unhandled code to 500",
      grpcStatusToHttp({ code: 999 }).status === 500,
    );
  } finally {
    (appConfig as { dataSource: string }).dataSource = originalDataSource;
  }

  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(
      `ALL ${reports.length} INFRA SERVICES TEST CASES (STATIC & gRPC) PASSED WITH 100% SUCCESS!`,
    );
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

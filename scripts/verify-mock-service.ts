/**
 * Automated Verification Suite for CBS Mock Core Engine & Fixture Database
 * Tests In-Memory Database Fixtures, Mock Core Simulator, Universal Gateway in Static Mode,
 * and Offline Proxy Dispatcher Matrix.
 *
 * Usage:
 *   pnpm tsx scripts/verify-mock-service.ts
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
  const { isStaticMode, loginProcess } = await import("@/lib/infra-grpc");
  const { getMockProxyResponse, mockProcess, mockDispatch } = await import("@/lib/mock-services");
  const { getBranchesData } = await import("@/lib/infra-services/branch-service");
  const { getControlsData } = await import("@/lib/infra-services/control-service");
  const { getFormData } = await import("@/lib/infra-services/form-service");
  const { getEnquiryData } = await import("@/lib/infra-services/inquiry-service");
  const { getMenuData } = await import("@/lib/infra-services/menu-service");
  const { parseAuthWirePayload } = await import("@/lib/data-parsers");

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
  console.log("   CBS MOCK CORE ENGINE & FIXTURE DATABASE VERIFICATION   ");
  console.log("========================================================");
  console.log("  Target Environment : In-Memory Database & Mock Simulator");
  console.log("  Network Socket     : Completely Offline (0 Sockets)");
  console.log("========================================================\n");

  try {
    // Force static mode for this suite
    (appConfig as { dataSource: string }).dataSource = "static";

    // =========================================================================
    // SECTION 1: Gateway Mode Gate
    // =========================================================================
    console.log("── 1. Gateway Runtime Mode Switch ──");
    assert("Gateway Switch: isStaticMode() returns true", isStaticMode() === true);

    // =========================================================================
    // SECTION 2: Universal Gateway Static Mode (Zero Mock Code in Domain Services)
    // =========================================================================
    console.log("\n── 2. Universal Gateway Static Auth & Domain Dispatch ──");

    // 2.1 Auth via loginProcess (auto-intercepted in static mode)
    const validLogin = await loginProcess({
      clientId: "WEB-CLIENT",
      username: "ZZ028459",
      password: "password123",
    });
    assert(
      "Transport Auth: loginProcess('ZZ028459') succeeds in static mode",
      validLogin.statusCode === 200 && Boolean(validLogin.data),
    );
    const authParse = parseAuthWirePayload(validLogin.data, "ZZ028459");
    assert(
      "Transport Auth: user session parsed with branch and accessibility",
      authParse.currUser.userId === "ZZ0284590" &&
        authParse.currUser.accessibility === "RIDASHL" &&
        authParse.currUser.branchCode === "JB9999",
    );

    const invalidLogin = await loginProcess({
      clientId: "WEB-CLIENT",
      username: "NON_EXISTENT_USER",
      password: "wrong",
    });
    assert(
      "Transport Auth: invalid user fails with 401 status",
      invalidLogin.statusCode === 401 && invalidLogin.status === "FAILED",
    );

    // 2.2 Domain Services End-to-End via Gateway
    const branches = await getBranchesData();
    assert(
      "Gateway Domain: getBranchesData() returns active branch records",
      Array.isArray(branches) && branches.length >= 4 && branches[0]?.recordId === "JB0001",
    );

    const controls = await getControlsData();
    assert(
      "Gateway Domain: getControlsData() returns system commands list",
      Array.isArray(controls) &&
        controls.length >= 6 &&
        controls.some((c) => c.command === "ACCOUNT"),
    );

    const form = await getFormData("ACCOUNT");
    assert(
      "Gateway Domain: getFormData('ACCOUNT') returns structured ParsedFormData",
      form !== null && form.code === "ACCOUNT" && Array.isArray(form.fields),
    );

    const versionedForm = await getFormData("USER.MGT,NEW1");
    assert(
      "Gateway Domain: getFormData('USER.MGT,NEW1') resolves valid schema",
      versionedForm !== null && Boolean(versionedForm.code),
    );

    const inquiry = await getEnquiryData("GET.EMP.INFO");
    assert(
      "Gateway Domain: getEnquiryData('GET.EMP.INFO') returns EnquirySchema",
      inquiry !== null && Array.isArray(inquiry.columns) && inquiry.columns.length > 0,
    );

    const menu = await getMenuData();
    assert(
      "Gateway Domain: getMenuData() returns hierarchical MenuItem tree",
      Array.isArray(menu) && menu.length > 0 && typeof menu[0]?.menuId === "number",
    );

    // =========================================================================
    // SECTION 3: Direct Core Simulation Payloads (mockProcess & mockDispatch)
    // =========================================================================
    console.log("\n── 3. Mock Core Wire Envelope Simulator (mockProcess & mockDispatch) ──");

    const simBranch = await mockProcess({
      idempotencyKey: "",
      clientId: "TEST",
      requestType: "GRL",
      controlName: "BRANCH",
      recordFunction: "LIST",
      recordId: "",
      branchCode: "JB9999",
      authLevel: 1,
      userId: "TEST",
      data: {},
    });
    assert(
      "Simulator: mockProcess('BRANCH') returns 200 wire response",
      simBranch.statusCode === 200 && Boolean(simBranch.data),
    );

    const simEnvelope = await mockDispatch({
      servicePath: "default",
      clientId: "TEST",
      requestType: "GMC",
      controlName: "FORM",
      recordId: "ACCOUNT",
      branchCode: "JB9999",
      userId: "TEST",
      authLevel: 1,
      recordFunction: "SEE",
      data: {},
    });
    assert(
      "Simulator: mockDispatch(GMC ACCOUNT) returns 200 ApiResponse",
      simEnvelope.statusCode === 200 && Boolean(simEnvelope.data),
    );

    // =========================================================================
    // SECTION 4: Offline Mock Proxy Dispatcher Matrix (getMockProxyResponse)
    // =========================================================================
    console.log("\n── 4. Offline Mock Proxy Dispatcher Matrix (getMockProxyResponse) ──");

    // 4.1 Inquiries
    const inqCanonical = getMockProxyResponse("INQ", "GET.EMP.INFO");
    assert(
      "Proxy Dispatcher: INQ returns canonical inquiry records",
      inqCanonical.status === "SUCCESS" &&
        inqCanonical.statusCode === 200 &&
        Array.isArray(inqCanonical.data),
    );

    const inqAccount = getMockProxyResponse("INQ", "ACCOUNT");
    assert(
      "Proxy Dispatcher: INQ ACCOUNT returns account enquiry rows",
      inqAccount.status === "SUCCESS" &&
        Array.isArray(inqAccount.data) &&
        inqAccount.data.length > 0,
    );

    const inqUnknown = getMockProxyResponse("INQ", "UNKNOWN_QUERY_9999");
    assert(
      "Proxy Dispatcher: unknown INQ returns empty array",
      inqUnknown.status === "SUCCESS" &&
        Array.isArray(inqUnknown.data) &&
        inqUnknown.data.length === 0,
    );

    // 4.2 Metamodel Catalogs (Canonical Model Config Names)
    const modelConfigList = getMockProxyResponse("GRL", "MODEL.CONFIG");
    const firstModelItem = Array.isArray(modelConfigList.data)
      ? (modelConfigList.data[0] as Record<string, unknown>)
      : null;
    assert(
      "Proxy Dispatcher: MODEL.CONFIG list returns catalog records with valid ID",
      modelConfigList.status === "SUCCESS" &&
        Array.isArray(modelConfigList.data) &&
        modelConfigList.data.length > 0 &&
        typeof firstModelItem?.id === "string" &&
        firstModelItem.id.length > 0,
    );

    const modelConfigRecord = getMockProxyResponse("GET", "MODEL.CONFIG", "ACCOUNT");
    assert(
      "Proxy Dispatcher: MODEL.CONFIG single record returns model definition",
      modelConfigRecord.status === "SUCCESS" &&
        Boolean((modelConfigRecord.data as Record<string, unknown>)?.tableName),
    );

    const formConfigList = getMockProxyResponse("GRL", "FORM.CONFIG");
    assert(
      "Proxy Dispatcher: FORM.CONFIG list returns form configurations",
      formConfigList.status === "SUCCESS" &&
        Array.isArray(formConfigList.data) &&
        formConfigList.data.length > 0,
    );

    const inqConfigList = getMockProxyResponse("GRL", "INQUIRY.CONFIG");
    assert(
      "Proxy Dispatcher: INQUIRY.CONFIG list returns inquiry configurations",
      inqConfigList.status === "SUCCESS" &&
        Array.isArray(inqConfigList.data) &&
        inqConfigList.data.length > 0,
    );

    const userGroupList = getMockProxyResponse("GRL", "USER.GROUP");
    assert(
      "Proxy Dispatcher: USER.GROUP list returns user group records",
      userGroupList.status === "SUCCESS" &&
        Array.isArray(userGroupList.data) &&
        userGroupList.data.length > 0,
    );

    const menuCatalogList = getMockProxyResponse("GRL", "MENU");
    assert(
      "Proxy Dispatcher: MENU list returns menu item records",
      menuCatalogList.status === "SUCCESS" &&
        Array.isArray(menuCatalogList.data) &&
        menuCatalogList.data.length > 0,
    );

    const menuTreeList = getMockProxyResponse("GRL", "MENU.TREE");
    assert(
      "Proxy Dispatcher: MENU.TREE list returns menu trees",
      menuTreeList.status === "SUCCESS" &&
        Array.isArray(menuTreeList.data) &&
        menuTreeList.data.length > 0,
    );

    // 4.3 Core Banking Records CRUD Lifecycle
    const gniAccount = getMockProxyResponse("GNI", "ACCOUNT");
    assert(
      "Proxy Dispatcher: GNI ACCOUNT generates new account ID",
      gniAccount.status === "SUCCESS" &&
        Boolean((gniAccount.data as Record<string, unknown>)?.recordId),
    );

    const grlLookup = getMockProxyResponse("GRL", "ACCOUNT");
    assert(
      "Proxy Dispatcher: GRL ACCOUNT returns record array",
      grlLookup.status === "SUCCESS" && Array.isArray(grlLookup.data) && grlLookup.data.length > 0,
    );

    const getAccountValid = getMockProxyResponse("GET", "ACCOUNT", "AC1001");
    assert(
      "Proxy Dispatcher: GET ACCOUNT AC1001 returns account details",
      getAccountValid.status === "SUCCESS" && getAccountValid.statusCode === 200,
    );

    const notFoundRecord = getMockProxyResponse("GET", "ACCOUNT", "NONEXISTENT_9999");
    assert(
      "Proxy Dispatcher: GET non-existent recordId returns 404 RECORD_NOT_FOUND",
      notFoundRecord.statusCode === 404 && notFoundRecord.status === "RECORD_NOT_FOUND",
    );

    const putAccount = getMockProxyResponse("PUT", "ACCOUNT", "10001", { title: "Updated Title" });
    assert(
      "Proxy Dispatcher: PUT ACCOUNT returns 200 RECORD_SAVED",
      putAccount.status === "SUCCESS" && putAccount.statusCode === 200,
    );

    const autAccount = getMockProxyResponse("AUT", "ACCOUNT", "10001");
    assert(
      "Proxy Dispatcher: AUT ACCOUNT returns 200 RECORD_AUTHORIZED",
      autAccount.status === "SUCCESS" && autAccount.statusCode === 200,
    );

    const delAccount = getMockProxyResponse("DEL", "ACCOUNT", "10001");
    assert(
      "Proxy Dispatcher: DEL ACCOUNT returns 200 RECORD_DELETED",
      delAccount.status === "SUCCESS" && delAccount.statusCode === 200,
    );

    const hldAccount = getMockProxyResponse("HLD", "ACCOUNT", "10001");
    assert(
      "Proxy Dispatcher: HLD ACCOUNT returns 200 RECORD_HELD",
      hldAccount.status === "SUCCESS" && hldAccount.statusCode === 200,
    );

    const revAccount = getMockProxyResponse("REV", "ACCOUNT", "10001");
    assert(
      "Proxy Dispatcher: REV ACCOUNT returns 200 RECORD_REVERSED",
      revAccount.status === "SUCCESS" && revAccount.statusCode === 200,
    );

    const grlCustomer = getMockProxyResponse("GRL", "CUSTOMER");
    assert(
      "Proxy Dispatcher: GRL CUSTOMER returns customer array",
      grlCustomer.status === "SUCCESS" && Array.isArray(grlCustomer.data),
    );

    const grlUser = getMockProxyResponse("GRL", "USER");
    assert(
      "Proxy Dispatcher: GRL USER returns user list",
      grlUser.status === "SUCCESS" && Array.isArray(grlUser.data),
    );
  } finally {
    (appConfig as { dataSource: string }).dataSource = originalDataSource;
  }

  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(`ALL ${reports.length} MOCK ENGINE & FIXTURE TESTS PASSED WITH 100% SUCCESS!`);
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

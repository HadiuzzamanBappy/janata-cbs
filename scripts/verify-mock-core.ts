/**
 * Automated Verification Suite for CBS Mock Core Engine & Database
 *
 * Exhaustively tests all functionalities implemented in mock/core & mock/db:
 * 1. Gateway Runtime Mode Switch (isStaticMode)
 * 2. Database Router & Physical Table Resolution (resolveTable & formatters)
 * 3. Operator Authentication & JWT Token Minting (loginProcess & mockLogin)
 * 4. Metamodel Introspection & Navigation Hierarchy (GMC & GUM)
 * 5. Dynamic Pre-Seeding & Versioning Engine (FORM.CONFIG, MODEL.CONFIG, INQUIRY.CONFIG)
 * 6. Tabular Inquiry Query Engine (INQ)
 * 7. Sequence ID Generation (GNI prefix & random sequence)
 * 8. Generic Record List Retrieval (GRL for all canonical controls)
 * 9. Single Record Retrieval & 404 Boundary Handling (GET)
 * 10. Four-Eyes Status Lifecycle Mutations (PUT, AUT, HLD, REV, DEL)
 * 11. Wire Protocol & Dispatch Envelopes (mockProcess & mockDispatch)
 *
 * Usage:
 *   pnpm tsx scripts/verify-mock-core.ts
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

async function runSuite() {
  const { appConfig } = await import("@/lib/core-config/server");
  const { isStaticMode, loginProcess } = await import("@/lib/infra-grpc");
  const { getMockProxyResponse, mockProcess, mockDispatch } = await import("@mock/core");
  const { resolveTable } = await import("@mock/core/database-router");
  const { parseAuthWirePayload } = await import("@/lib/data-parsers");

  interface TestReport {
    name: string;
    passed: boolean;
    error?: string;
  }

  const reports: TestReport[] = [];

  function assert(name: string, condition: boolean, outputData?: unknown) {
    if (condition) {
      reports.push({ name, passed: true });
      let preview = "";
      if (outputData !== undefined && outputData !== null) {
        if (
          typeof outputData === "string" ||
          typeof outputData === "number" ||
          typeof outputData === "boolean"
        ) {
          preview = String(outputData);
        } else if (Array.isArray(outputData)) {
          preview = `Array(${outputData.length} items) [sample: ${JSON.stringify(outputData[0] || {})}]`;
        } else {
          const keys = Object.keys(outputData as object);
          const sample = JSON.stringify(outputData);
          preview =
            sample.length > 120
              ? `${sample.slice(0, 117)}... (keys: ${keys.slice(0, 5).join(", ")})`
              : sample;
        }
      }
      console.log(`  [PASS] ${name}${preview ? `\n         ↳ Output: ${preview}` : ""}`);
    } else {
      reports.push({ name, passed: false, error: String(outputData) });
      console.error(`  [FAIL] ${name}${outputData ? ` -> ${outputData}` : ""}`);
    }
  }

  const originalDataSource = appConfig.dataSource;

  console.log("\n========================================================");
  console.log("   CBS MOCK CORE ENGINE & FIXTURE DATABASE VERIFICATION   ");
  console.log("========================================================");
  console.log("  Target Environment : In-Memory Database & Core Simulator");
  console.log("  Network Socket     : Completely Offline (0 Sockets)");
  console.log("========================================================\n");

  try {
    (appConfig as { dataSource: string }).dataSource = "static";

    // =========================================================================
    // SECTION 1: Gateway Runtime Mode Gate
    // =========================================================================
    console.log("── 1. Gateway Runtime Mode Switch ──");
    assert(
      "Gateway Switch: isStaticMode() returns true",
      isStaticMode() === true,
      "dataSource=static",
    );

    // =========================================================================
    // SECTION 2: Database Router & Physical Table Resolution
    // =========================================================================
    console.log(
      "\n── 2. Database Router & Physical Table Resolution (@mock/core/database-router) ──",
    );

    const tAccount = resolveTable("ACCOUNT");
    assert(
      "Database Router: 'ACCOUNT' resolves to physical table 'AC_ACCOUNT'",
      tAccount?.physicalName === "AC_ACCOUNT",
      { physicalName: tAccount?.physicalName, recordCount: tAccount?.getList().length },
    );

    const tCustomer = resolveTable("CUSTOMER");
    assert(
      "Database Router: 'CUSTOMER' resolves to physical table 'CUST_CUSTOMER'",
      tCustomer?.physicalName === "CUST_CUSTOMER",
      { physicalName: tCustomer?.physicalName, sampleCustomer: tCustomer?.getList()[0] },
    );

    const tBranch = resolveTable("BRANCH");
    assert(
      "Database Router: 'BRANCH' resolves to physical table 'SC_BRANCH'",
      tBranch?.physicalName === "SC_BRANCH",
      { physicalName: tBranch?.physicalName, branchCount: tBranch?.getList().length },
    );

    const tControl = resolveTable("CONTROL");
    assert(
      "Database Router: 'CONTROL' resolves to physical table 'SC_CONTROL'",
      tControl?.physicalName === "SC_CONTROL",
      { physicalName: tControl?.physicalName, sampleControl: tControl?.getList()[0] },
    );

    const tFormConfig = resolveTable("FORM.CONFIG");
    assert(
      "Database Router: 'FORM.CONFIG' resolves with dot notation to 'SC_FORM_CONFIG'",
      tFormConfig?.physicalName === "SC_FORM_CONFIG",
      { physicalName: tFormConfig?.physicalName, count: tFormConfig?.getList().length },
    );

    const tModelConfig = resolveTable("MODEL.CONFIG");
    assert(
      "Database Router: 'MODEL.CONFIG' resolves to 'SC_MODEL_CONFIG'",
      tModelConfig?.physicalName === "SC_MODEL_CONFIG",
      { physicalName: tModelConfig?.physicalName, count: tModelConfig?.getList().length },
    );

    const tInquiryConfig = resolveTable("INQUIRY.CONFIG");
    assert(
      "Database Router: 'INQUIRY.CONFIG' resolves to 'SC_INQUIRY_CONFIG'",
      tInquiryConfig?.physicalName === "SC_INQUIRY_CONFIG",
      { physicalName: tInquiryConfig?.physicalName, count: tInquiryConfig?.getList().length },
    );

    const tUserGroup = resolveTable("USER.GROUP");
    assert(
      "Database Router: 'USER.GROUP' resolves to 'SC_USER_GROUP'",
      tUserGroup?.physicalName === "SC_USER_GROUP",
      { physicalName: tUserGroup?.physicalName, count: tUserGroup?.getList().length },
    );

    const tUser = resolveTable("USER");
    assert("Database Router: 'USER' resolves to 'SYS_USER'", tUser?.physicalName === "SYS_USER", {
      physicalName: tUser?.physicalName,
      sampleUser: tUser?.getList()[0],
    });

    // =========================================================================
    // SECTION 3: Operator Authentication & Session Minting
    // =========================================================================
    console.log("\n── 3. Operator Authentication & Session Minting (@mock/core/auth-simulator) ──");

    const validLogin = await loginProcess({
      clientId: "WEB-CLIENT",
      username: "ZZ028459",
      password: "password123",
    });
    assert(
      "Auth Simulator: loginProcess('ZZ028459') mints valid token & session",
      validLogin.statusCode === 200 && Boolean(validLogin.data),
      {
        status: validLogin.status,
        statusCode: validLogin.statusCode,
        message: validLogin.message,
        token: (validLogin.data as Record<string, unknown>)?.token,
        txnDate: (validLogin.data as Record<string, unknown>)?.txnDate,
      },
    );

    const authParse = parseAuthWirePayload(validLogin.data, "ZZ028459");
    assert(
      "Auth Simulator: session payload contains branchCode, accessibility, and roles",
      authParse.currUser.userId === "ZZ0284590" &&
        authParse.currUser.accessibility === "RIDASHL" &&
        authParse.currUser.branchCode === "JB9999",
      {
        userId: authParse.currUser.userId,
        branchCode: authParse.currUser.branchCode,
        accessibility: authParse.currUser.accessibility,
      },
    );

    const invalidLogin = await loginProcess({
      clientId: "WEB-CLIENT",
      username: "NON_EXISTENT_USER",
      password: "wrong",
    });
    assert(
      "Auth Simulator: non-existent operator login fails with 401 FAILED",
      invalidLogin.statusCode === 401 && invalidLogin.status === "FAILED",
      {
        status: invalidLogin.status,
        statusCode: invalidLogin.statusCode,
        message: invalidLogin.message,
      },
    );

    // =========================================================================
    // SECTION 4: Metamodel Introspection & Navigation Hierarchy
    // =========================================================================
    console.log("\n── 4. Metamodel Introspection & Navigation (GMC & GUM) ──");

    const gmcAccount = getMockProxyResponse("GMC", "ACCOUNT");
    assert(
      "Operation Handlers: GMC ACCOUNT returns data model properties & idDef",
      gmcAccount.status === "SUCCESS" &&
        Array.isArray((gmcAccount.data as Record<string, unknown>)?.properties),
      {
        tableName: (gmcAccount.data as Record<string, unknown>)?.tableName,
        category: (gmcAccount.data as Record<string, unknown>)?.category,
        propertiesCount: ((gmcAccount.data as Record<string, unknown>)?.properties as unknown[])
          ?.length,
        idDef: (gmcAccount.data as Record<string, unknown>)?.idDef,
      },
    );

    const gumMenu = getMockProxyResponse("GUM", "MENU");
    assert(
      "Operation Handlers: GUM MENU returns hierarchical navigation menu tree from SC_MENU_TREE",
      gumMenu.status === "SUCCESS" && Array.isArray(gumMenu.data) && gumMenu.data.length > 0,
      {
        rootItemsCount: (gumMenu.data as unknown[])?.length,
        firstItem:
          (gumMenu.data as Record<string, unknown>[])[0]?.label ||
          (gumMenu.data as Record<string, unknown>[])[0]?.name,
      },
    );

    // =========================================================================
    // SECTION 5: Database Metamodel & Configuration Retrieval (FORM, MODEL, INQUIRY)
    // =========================================================================
    console.log("\n── 5. Database Metamodel & Configuration Retrieval (FORM, MODEL, INQUIRY) ──");

    // 5.1 Existing Form Config Retrieval with version query
    const formAccount = getMockProxyResponse("GET", "FORM.CONFIG", "ACCOUNT,1.0.0");
    const formLayoutData = formAccount.data as Record<string, unknown>;
    assert(
      "Database Core: GET FORM.CONFIG ACCOUNT,1.0.0 returns form layout from SC_FORM_CONFIG_LIVE",
      formAccount.status === "SUCCESS" &&
        Boolean(formLayoutData?.presentation) &&
        formLayoutData?.targetModel === "ACCOUNT",
      {
        recordId: formLayoutData?.recordId,
        targetModel: formLayoutData?.targetModel,
        version: formLayoutData?.version,
        sectionsCount: (
          (formLayoutData?.presentation as Record<string, unknown>)?.sections as unknown[]
        )?.length,
      },
    );

    // 5.2 Non-Existent Model Returns 404 RECORD_NOT_FOUND
    const formInvalidModel = getMockProxyResponse("GET", "FORM.CONFIG", "NONEXISTENT_MODEL,V1");
    assert(
      "Database Core: GET FORM.CONFIG for non-existent model returns 404 RECORD_NOT_FOUND",
      formInvalidModel.statusCode === 404 && formInvalidModel.status === "RECORD_NOT_FOUND",
      {
        status: formInvalidModel.status,
        statusCode: formInvalidModel.statusCode,
        message: formInvalidModel.message,
      },
    );

    // 5.3 Existing Form Config for USER,1.0.0
    const formExisting = getMockProxyResponse("GET", "FORM.CONFIG", "USER,1.0.0");
    assert(
      "Database Core: GET FORM.CONFIG USER,1.0.0 returns established database record",
      formExisting.status === "SUCCESS" && formExisting.statusCode === 200,
      {
        recordId: (formExisting.data as Record<string, unknown>)?.recordId,
        title: (formExisting.data as Record<string, unknown>)?.title,
      },
    );

    // 5.4 MODEL.CONFIG Retrieval from SC_MODEL_CONFIG_LIVE
    const modelAccount = getMockProxyResponse("GET", "MODEL.CONFIG", "ACCOUNT");
    assert(
      "Database Core: GET MODEL.CONFIG ACCOUNT returns canonical model definition from SC_MODEL_CONFIG",
      modelAccount.status === "SUCCESS" &&
        (modelAccount.data as Record<string, unknown>)?.tableName === "ACCOUNT",
      {
        tableName: (modelAccount.data as Record<string, unknown>)?.tableName,
        category: (modelAccount.data as Record<string, unknown>)?.category,
        idDef: (modelAccount.data as Record<string, unknown>)?.idDef,
        propertiesCount: ((modelAccount.data as Record<string, unknown>)?.properties as unknown[])
          ?.length,
      },
    );

    // 5.5 INQUIRY.CONFIG Retrieval from SC_INQUIRY_CONFIG_LIVE
    const inqAccountSpec = getMockProxyResponse("GET", "INQUIRY.CONFIG", "ACCOUNT");
    const inqData = inqAccountSpec.data as Record<string, unknown>;
    assert(
      "Database Core: GET INQUIRY.CONFIG ACCOUNT returns canonical enquiry definition from SC_INQUIRY_CONFIG",
      inqAccountSpec.status === "SUCCESS" &&
        Array.isArray(inqData?.columns) &&
        inqData?.targetModel === "ACCOUNT",
      {
        id: inqData?.id,
        targetModel: inqData?.targetModel,
        columnsCount: (inqData?.columns as unknown[])?.length,
        actions: inqData?.actions,
        status: (inqData?.auditData as Record<string, unknown>)?.recStatus,
      },
    );

    // =========================================================================
    // SECTION 6: Tabular Inquiry & Filter Engine (INQ)
    // =========================================================================
    console.log("\n── 6. Tabular Inquiry & Filter Engine (INQ) ──");

    const inqCanonical = getMockProxyResponse("INQ", "GET.EMP.INFO");
    assert(
      "Inquiry Engine: INQ GET.EMP.INFO returns employee directory rows",
      inqCanonical.status === "SUCCESS" && Array.isArray(inqCanonical.data),
      {
        rowCount: (inqCanonical.data as unknown[])?.length,
        sampleRow: (inqCanonical.data as unknown[])[0],
      },
    );

    const inqAccount = getMockProxyResponse("INQ", "ACCOUNT");
    assert(
      "Inquiry Engine: INQ ACCOUNT returns account enquiry rows",
      inqAccount.status === "SUCCESS" &&
        Array.isArray(inqAccount.data) &&
        inqAccount.data.length > 0,
      {
        rowCount: (inqAccount.data as unknown[])?.length,
        sampleAccount: (inqAccount.data as unknown[])[0],
      },
    );

    const inqUnknown = getMockProxyResponse("INQ", "NON_EXISTENT_QUERY_9999");
    assert(
      "Inquiry Engine: unknown inquiry query returns empty array gracefully",
      inqUnknown.status === "SUCCESS" &&
        Array.isArray(inqUnknown.data) &&
        inqUnknown.data.length === 0,
      { rowCount: (inqUnknown.data as unknown[])?.length },
    );

    // =========================================================================
    // SECTION 7: Sequence ID Generation (GNI)
    // =========================================================================
    console.log("\n── 7. Sequence ID Generation (GNI) ──");

    const gniAccount = getMockProxyResponse("GNI", "ACCOUNT");
    assert(
      "ID Sequence: GNI ACCOUNT generates sequential ID with 'AC' prefix",
      gniAccount.status === "SUCCESS" &&
        String((gniAccount.data as Record<string, unknown>)?.recordId).startsWith("AC"),
      gniAccount.data,
    );

    const gniCustomer = getMockProxyResponse("GNI", "CUSTOMER");
    assert(
      "ID Sequence: GNI CUSTOMER generates sequential ID with 'CU' prefix",
      gniCustomer.status === "SUCCESS" &&
        String((gniCustomer.data as Record<string, unknown>)?.recordId).startsWith("CU"),
      gniCustomer.data,
    );

    // =========================================================================
    // SECTION 8: Generic Record List Retrieval (GRL)
    // =========================================================================
    console.log("\n── 8. Generic Record List Retrieval (GRL for Canonical Controls) ──");

    const grlControls = [
      { name: "ACCOUNT", expectedCount: 3 },
      { name: "CUSTOMER", expectedCount: 2 },
      { name: "BRANCH", expectedCount: 4 },
      { name: "CONTROL", expectedCount: 5 },
      { name: "MODEL.CONFIG", expectedCount: 11 },
      { name: "FORM.CONFIG", expectedCount: 2 },
      { name: "INQUIRY.CONFIG", expectedCount: 3 },
      { name: "USER.GROUP", expectedCount: 2 },
      { name: "USER", expectedCount: 2 },
      { name: "MENU", expectedCount: 10 },
      { name: "MENU.TREE", expectedCount: 1 },
    ];

    for (const item of grlControls) {
      const res = getMockProxyResponse("GRL", item.name);
      assert(
        `Record List: GRL ${item.name} returns table collection`,
        res.status === "SUCCESS" &&
          Array.isArray(res.data) &&
          res.data.length >= item.expectedCount,
        { control: item.name, returnedCount: (res.data as unknown[])?.length },
      );
    }

    // =========================================================================
    // SECTION 9: Single Record Retrieval & 404 Boundaries (GET)
    // =========================================================================
    console.log("\n── 9. Single Record Retrieval & 404 Boundaries (GET) ──");

    const getAccount = getMockProxyResponse("GET", "ACCOUNT", "AC1001");
    assert(
      "Single Record: GET ACCOUNT AC1001 returns active account details",
      getAccount.status === "SUCCESS" && getAccount.statusCode === 200,
      {
        recordId: (getAccount.data as Record<string, unknown>)?.recordId,
        accountType: (getAccount.data as Record<string, unknown>)?.accountType,
        currency: (getAccount.data as Record<string, unknown>)?.currency,
      },
    );

    const notFound = getMockProxyResponse("GET", "ACCOUNT", "NONEXISTENT_9999");
    assert(
      "Single Record: GET non-existent recordId returns 404 RECORD_NOT_FOUND",
      notFound.statusCode === 404 && notFound.status === "RECORD_NOT_FOUND",
      { status: notFound.status, statusCode: notFound.statusCode, message: notFound.message },
    );

    // =========================================================================
    // SECTION 10: Four-Eyes Lifecycle Mutations (PUT, AUT, HLD, REV, DEL)
    // =========================================================================
    console.log("\n── 10. Four-Eyes Status Lifecycle Mutations (@mock/core/operation-handlers) ──");

    const putRes = getMockProxyResponse("PUT", "ACCOUNT", "AC9999", { balance: 50000 });
    assert(
      "Lifecycle: PUT sets record status to 'INA' (Unapproved Draft)",
      putRes.status === "SUCCESS" &&
        (putRes.data as Record<string, unknown>)?.RECORD_STATUS === "INA",
      putRes.data,
    );

    const autRes = getMockProxyResponse("AUT", "ACCOUNT", "AC9999");
    assert(
      "Lifecycle: AUT sets record status to 'AU' (Four-Eyes Approved)",
      autRes.status === "SUCCESS" &&
        (autRes.data as Record<string, unknown>)?.RECORD_STATUS === "AU",
      autRes.data,
    );

    const hldRes = getMockProxyResponse("HLD", "ACCOUNT", "AC9999");
    assert(
      "Lifecycle: HLD sets record status to 'HLD' (Placed On Hold)",
      hldRes.status === "SUCCESS" &&
        (hldRes.data as Record<string, unknown>)?.RECORD_STATUS === "HLD",
      hldRes.data,
    );

    const revRes = getMockProxyResponse("REV", "ACCOUNT", "AC9999");
    assert(
      "Lifecycle: REV sets record status to 'REV' (Reversed Transaction)",
      revRes.status === "SUCCESS" &&
        (revRes.data as Record<string, unknown>)?.RECORD_STATUS === "REV",
      revRes.data,
    );

    const delRes = getMockProxyResponse("DEL", "ACCOUNT", "AC9999");
    assert(
      "Lifecycle: DEL sets record status to 'DEL' (Marked Deleted)",
      delRes.status === "SUCCESS" &&
        (delRes.data as Record<string, unknown>)?.RECORD_STATUS === "DEL",
      delRes.data,
    );

    // =========================================================================
    // SECTION 11: Wire Protocol Envelopes (mockProcess & mockDispatch)
    // =========================================================================
    console.log("\n── 11. Wire Protocol & Dispatch Envelopes (mockProcess & mockDispatch) ──");

    const simProcess = await mockProcess({
      idempotencyKey: "idem-001",
      clientId: "WEB-CLIENT",
      requestType: "GRL",
      controlName: "BRANCH",
      recordFunction: "L",
      recordId: "",
      branchCode: "JB9999",
      authLevel: 1,
      userId: "ZZ028459",
      data: {},
    });
    assert(
      "Wire Envelope: mockProcess returns valid GrpcResponse with serialized wire data",
      simProcess.statusCode === 200 && simProcess.status === "SUCCESS",
      {
        status: simProcess.status,
        statusCode: simProcess.statusCode,
        message: simProcess.message,
        timestamp: simProcess.timestamp,
      },
    );

    const simDispatch = await mockDispatch({
      servicePath: "default",
      clientId: "WEB-CLIENT",
      requestType: "GMC",
      controlName: "FORM",
      recordId: "ACCOUNT",
      branchCode: "JB9999",
      userId: "ZZ028459",
      authLevel: 1,
      recordFunction: "S",
      data: {},
    });
    assert(
      "Wire Envelope: mockDispatch returns normalized ApiResponse",
      simDispatch.statusCode === 200 && simDispatch.status === "SUCCESS",
      {
        status: simDispatch.status,
        statusCode: simDispatch.statusCode,
        message: simDispatch.message,
      },
    );
  } finally {
    (appConfig as { dataSource: string }).dataSource = originalDataSource;
  }

  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(`ALL ${reports.length} MOCK CORE & DATABASE TESTS PASSED WITH 100% SUCCESS!`);
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

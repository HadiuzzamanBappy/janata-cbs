/**
 * Automated Verification Suite for CBS Mock Core Engine & Database
 *
 * Clean, single-test per core concept with explicit Input and Output visualization:
 * 1. Gateway Runtime Mode Switch (isStaticMode)
 * 2. Database Router Table Resolution (resolveTable)
 * 3. Operator Authentication & Session Minting (loginProcess)
 * 4. Metamodel Form Schema Introspection (GMC)
 * 5. Navigation Menu Tree Hierarchy (GUM)
 * 6. Versioned Presentation Configuration (FORM.CONFIG)
 * 7. Tabular Inquiry Rows (INQ)
 * 8. Sequence ID Allocation (GNI)
 * 9. Key ID List & Wildcard Search (SBI)
 * 10. Single Record Read in View Mode (S / SEE)
 * 11. Maker-Checker Lifecycle Status Mutation (PUT -> INA)
 * 12. Full Unary gRPC Wire Envelope Dispatch (mockProcess)
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
  const { getMockProxyResponse, mockProcess } = await import("@mock/core");
  const { resolveTable } = await import("@mock/core/database-router");

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
    const statusTag = condition ? "[PASS]" : "[FAIL]";
    console.log(`\n${statusTag} ${title}`);
    console.log(`       Input  : ${typeof input === "string" ? input : JSON.stringify(input)}`);
    console.log(`       Output : ${typeof output === "string" ? output : JSON.stringify(output)}`);
    if (!condition && error) {
      console.error(`       Error  : ${error}`);
    }
  }

  const originalDataSource = appConfig.dataSource;

  console.log("\n================================================================================");
  console.log("             CBS MOCK CORE ENGINE & FIXTURE DATABASE VERIFICATION               ");
  console.log("================================================================================");
  console.log(" Target Environment : In-Memory Database & Core Simulator (0 Sockets)");
  console.log(" Pattern            : Single Unique Test per Core Banking Lifecycle Function");
  console.log("================================================================================");

  try {
    (appConfig as { dataSource: string }).dataSource = "static";

    // 1. Gateway Runtime Mode Switch
    const staticCheck = isStaticMode();
    recordTest(
      "1. Gateway Runtime Mode Switch",
      { dataSource: appConfig.dataSource },
      { isStaticMode: staticCheck },
      staticCheck === true,
    );

    // 2. Database Router Table Resolution
    const inputTable = "ACCOUNT";
    const resolvedTable = resolveTable(inputTable);
    const tableOut = {
      physicalName: resolvedTable?.physicalName,
      prefix: resolvedTable?.prefix,
      totalRecords: resolvedTable?.getList().length,
    };
    recordTest(
      "2. Database Router Table Resolution",
      { controlName: inputTable },
      tableOut,
      resolvedTable?.physicalName === "AC_ACCOUNT",
    );

    // 3. Operator Authentication & Session Minting (Strict username + password)
    const loginInput = { clientId: "WEB-CLIENT", username: "ZZ028459", password: "password123" };
    const authRes = await loginProcess(loginInput);
    const authData = authRes.data as Record<string, unknown> | undefined;

    // Negative tests: wrong password and missing password must fail with 401
    const wrongPassRes = await loginProcess({ clientId: "WEB-CLIENT", username: "ZZ028459", password: "wrong_password" });
    const noPassRes = await loginProcess({ clientId: "WEB-CLIENT", username: "ZZ028459", password: "" });

    const authOut = {
      status: authRes.status,
      statusCode: authRes.statusCode,
      fullName: authData?.fullName,
      accessibility: authData?.accessibility,
      branchCode: authData?.branchCode,
      hasToken: Boolean(authData?.token),
      rejectsWrongPass: wrongPassRes.statusCode === 401,
      rejectsEmptyPass: noPassRes.statusCode === 401,
    };
    recordTest(
      "3. Operator Authentication & Session Minting",
      { username: loginInput.username, password: "***" },
      authOut,
      authRes.statusCode === 200 &&
        authData?.accessibility === "RIDASHL" &&
        wrongPassRes.statusCode === 401 &&
        noPassRes.statusCode === 401,
    );

    // 4. Metamodel Form Schema Introspection (GMC)
    // 4a. Pure Model Schema (when base model name passed)
    const gmcModelInput = { requestType: "GMC", controlName: "ACCOUNT" };
    const gmcModelRes = getMockProxyResponse("GMC", "ACCOUNT");
    const gmcModelData = gmcModelRes.data as Record<string, unknown> | undefined;
    recordTest(
      "4a. Metamodel Model Schema Introspection (GMC -> MODEL.CONFIG)",
      gmcModelInput,
      {
        tableName: gmcModelData?.tableName,
        propertiesCount: (gmcModelData?.properties as unknown[])?.length,
      },
      gmcModelRes.status === "SUCCESS" && Boolean((gmcModelData?.properties as unknown[])?.length),
    );

    // 4b. Form Configuration (when form layout version passed)
    const gmcFormInput = { requestType: "GMC", controlName: "ACCOUNT,1.0.0" };
    const gmcFormRes = getMockProxyResponse("GMC", "ACCOUNT,1.0.0");
    const gmcFormData = gmcFormRes.data as Record<string, unknown> | undefined;
    recordTest(
      "4b. Metamodel Form Config Introspection (GMC -> FORM.CONFIG)",
      gmcFormInput,
      {
        title: gmcFormData?.title,
        hasPresentation: Boolean(gmcFormData?.presentation),
        sectionsCount: (
          (gmcFormData?.presentation as Record<string, unknown>)?.sections as unknown[]
        )?.length,
      },
      gmcFormRes.status === "SUCCESS" && Boolean(gmcFormData?.presentation),
    );

    // 5. Navigation Menu Tree Hierarchy (GUM)
    const gumInput = { requestType: "GUM" };
    const gumRes = getMockProxyResponse("GUM");
    const gumData = gumRes.data as Array<Record<string, unknown>> | undefined;
    const gumOut = {
      status: gumRes.status,
      rootNodesCount: gumData?.length,
      sampleRootNode: gumData?.[0]?.label || gumData?.[0]?.name,
    };
    recordTest(
      "5. Navigation Menu Tree Hierarchy (GUM)",
      gumInput,
      gumOut,
      gumRes.status === "SUCCESS" && Boolean(gumData && gumData.length > 0),
    );

    // 6. Versioned Presentation Configuration (FORM.CONFIG S Mode)
    const formInput = { requestType: "S", controlName: "FORM.CONFIG", recordId: "ACCOUNT,1.0.0" };
    const formRes = getMockProxyResponse("S", "FORM.CONFIG", "ACCOUNT,1.0.0");
    const formData = formRes.data as Record<string, unknown> | undefined;
    const formOut = {
      recordId: formData?.recordId,
      title: formData?.title,
      targetModel: formData?.targetModel,
      sectionsCount: ((formData?.presentation as Record<string, unknown>)?.sections as unknown[])
        ?.length,
    };
    recordTest(
      "6. Versioned Presentation Configuration (FORM.CONFIG in S mode)",
      formInput,
      formOut,
      formRes.status === "SUCCESS" && formOut.targetModel === "ACCOUNT",
    );

    // 7a. Tabular Inquiry Rows (INQ)
    const inqInput = { requestType: "INQ", controlName: "GET.EMP.INFO" };
    const inqRes = getMockProxyResponse("INQ", "GET.EMP.INFO");
    const inqData = inqRes.data as Array<Record<string, unknown>> | undefined;
    const inqOut = {
      status: inqRes.status,
      rowsCount: inqData?.length,
      firstRowSample: inqData?.[0] ? { id: inqData[0].userId, name: inqData[0].fullName } : null,
    };
    recordTest(
      "7a. Tabular Inquiry Rows (INQ)",
      inqInput,
      inqOut,
      inqRes.status === "SUCCESS" && Boolean(inqData && inqData.length > 0),
    );

    // 7b. Dynamic Raw Model Inquiry Synthesis (INQUIRY.CONFIG -> Fallback to MODEL.CONFIG)
    const rawInqInput = {
      requestType: "S",
      controlName: "INQUIRY.CONFIG",
      recordId: "MODEL.CONFIG",
    };
    const rawInqRes = getMockProxyResponse("S", "INQUIRY.CONFIG", "MODEL.CONFIG");
    const rawInqData = rawInqRes.data as Record<string, unknown> | undefined;
    const rawInqOut = {
      status: rawInqRes.status,
      id: rawInqData?.id,
      title: rawInqData?.title,
      columnsCount: (rawInqData?.columns as unknown[])?.length,
      filtersCount: (rawInqData?.filters as unknown[])?.length,
    };
    recordTest(
      "7b. Dynamic Raw Model Inquiry Synthesis (INQ MODEL.CONFIG)",
      rawInqInput,
      rawInqOut,
      rawInqRes.status === "SUCCESS" &&
        rawInqOut.id === "MODEL.CONFIG" &&
        Number(rawInqOut.columnsCount) > 0,
    );

    // 8. Sequence ID Allocation (GNI)
    const gniInput = { requestType: "GNI", controlName: "ACCOUNT" };
    const gniRes = getMockProxyResponse("GNI", "ACCOUNT");
    const gniData = gniRes.data as Record<string, unknown> | undefined;
    recordTest(
      "8. Sequence ID Allocation (GNI)",
      gniInput,
      gniData,
      gniRes.status === "SUCCESS" && String(gniData?.recordId).startsWith("AC"),
    );

    // 9. Key ID List & Wildcard Search (SBI - returns list of keys/IDs only)
    const sbiInput = { requestType: "SBI", controlName: "MODEL.CONFIG", recordId: "...AC..." };
    const sbiRes = getMockProxyResponse("SBI", "MODEL.CONFIG", "...AC...");
    const sbiKeys = sbiRes.data as string[] | undefined;
    recordTest(
      "9. Key ID List & Wildcard Search (SBI - returns keys only)",
      sbiInput,
      { matchesFound: sbiKeys?.length, keys: sbiKeys },
      sbiRes.status === "SUCCESS" && Array.isArray(sbiKeys) && sbiKeys.includes("ACCOUNT"),
    );

    // 10. Single Record Read in View Mode (S / SEE)
    const seeInput = { requestType: "S", controlName: "ACCOUNT", recordId: "AC1001" };
    const seeRes = getMockProxyResponse("S", "ACCOUNT", "AC1001");
    const seeData = seeRes.data as Record<string, unknown> | undefined;
    const seeOut = {
      recordId: seeData?.recordId,
      accountType: seeData?.accountType,
      currency: seeData?.currency,
      status: seeRes.status,
    };
    recordTest(
      "10. Single Record Read in View Mode (S / SEE)",
      seeInput,
      seeOut,
      seeRes.status === "SUCCESS" && seeOut.recordId === "AC1001",
    );

    // 11. Maker-Checker Lifecycle Status Mutation (PUT -> INA)
    const putInput = {
      requestType: "PUT",
      controlName: "ACCOUNT",
      recordId: "AC9999",
      data: { balance: 50000 },
    };
    const putRes = getMockProxyResponse("PUT", "ACCOUNT", "AC9999", { balance: 50000 });
    const putData = putRes.data as Record<string, unknown> | undefined;
    const putOut = {
      recordId: putData?.recordId,
      RECORD_STATUS: putData?.RECORD_STATUS,
      balance: putData?.balance,
    };
    recordTest(
      "11. Maker-Checker Lifecycle Status Mutation (PUT -> INA)",
      putInput,
      putOut,
      putRes.status === "SUCCESS" && putOut.RECORD_STATUS === "INA",
    );

    // 12. Full Unary gRPC Wire Envelope Dispatch (mockProcess)
    const rpcInput = {
      clientId: "WEB-CLIENT",
      requestType: "SBI",
      controlName: "BRANCH",
      recordFunction: "L",
      recordId: "",
      branchCode: "JB9999",
      userId: "ZZ028459",
    };
    const rpcRes = await mockProcess({
      ...rpcInput,
      idempotencyKey: "idem-001",
      authLevel: 1,
      data: {},
    });
    const rpcOut = {
      status: rpcRes.status,
      statusCode: rpcRes.statusCode,
      message: rpcRes.message,
      timestamp: rpcRes.timestamp,
    };
    recordTest(
      "12. Full Unary gRPC Wire Envelope Dispatch (mockProcess)",
      rpcInput,
      rpcOut,
      rpcRes.status === "SUCCESS" && rpcRes.statusCode === 200,
    );
  } finally {
    (appConfig as { dataSource: string }).dataSource = originalDataSource;
  }

  console.log("\n================================================================================");
  const allPassed = testCases.every((t) => t.passed);
  if (allPassed) {
    console.log(`>>> ALL ${testCases.length} UNIQUE CORE TESTS PASSED WITH 100% SUCCESS! <<<`);
    console.log(
      "================================================================================\n",
    );
    process.exit(0);
  } else {
    const failedCount = testCases.filter((t) => !t.passed).length;
    console.error(`>>> FAILED: ${failedCount} OF ${testCases.length} TESTS FAILED! <<<`);
    console.log(
      "================================================================================\n",
    );
    process.exit(1);
  }
}

runSuite().catch((err: unknown) => {
  console.error("Runner failed:", err);
  process.exit(1);
});

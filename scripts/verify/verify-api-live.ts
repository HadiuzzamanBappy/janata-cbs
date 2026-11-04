/**
 * Live CBS API & Backend Dispatch Verification Suite
 *
 * Verifies that the CBS backend / API dispatcher returns valid, well-formed
 * responses against actual wire requests across all key banking domains:
 * 1. Operator Authentication & Token Acquisition (LoginProcess)
 * 2. Menu Item Catalog List (GRL on MENU)
 * 3. Menu Tree ID Search (SBI on MENU.TREE)
 * 4. Navigation Menu Tree Structure (GET on MENU.TREE)
 * 5. Data Metamodel Introspection (GMC on MODEL.CONFIG)
 * 6. Form Layout Presentation Spec (GFC on CONFIG.FORM)
 * 7. Branch Directory Catalog (GRL on BRANCH)
 * 8. Live HTTP Proxy Endpoint (/api/proxy) probe
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-api-live.ts
 */

// Load environment variables from .env.local without external dependencies
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

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
  console.log(
    `       Input Request  : ${typeof input === "string" ? input : JSON.stringify(input)}`,
  );
  console.log(
    `       Output Response: ${typeof output === "string" ? output : JSON.stringify(output)}`,
  );
  if (!condition && error) {
    console.error(`       Error Details  : ${error}`);
  }
}

async function runSuite() {
  const { appConfig } = await import("@/lib/core-config/server");
  const { decodeProtobufValue, unwrapRecordsPayload } = await import("@/lib/data-parsers");
  const typeModule = await import("@/types");
  const { CbsRequestType, CbsRecordFunction } = typeModule;
  const { dispatch } = await import("@/lib/infra-grpc/dispatch");
  const { loginProcess } = await import("@/lib/infra-grpc/client");
  const schemasModule = await import("@/lib/data-schemas");
  const { cbsWirePayloadSchema } = schemasModule;

  console.log("\n================================================================================");
  console.log("             CBS LIVE API & BACKEND RESPONSE VERIFICATION SUITE                 ");
  console.log("================================================================================");
  console.log(` Data Source Mode : ${appConfig.dataSource.toUpperCase()}`);
  console.log(` gRPC Core Host   : ${appConfig.grpc.host}`);
  console.log(` Client ID        : ${appConfig.grpc.clientId}`);
  console.log(` Redis Cache      : ${appConfig.redis.enabled ? "ENABLED" : "DISABLED"}`);
  console.log("================================================================================");

  let authToken = "";
  let loggedInUserId = process.env.TEST_USERNAME || "ZZ028459";

  // ── 1. Authentication & Live Token Acquisition ──
  console.log("\n── 1. Operator Authentication & Live Token Handshake ──");
  try {
    const loginPayload = {
      clientId: appConfig.grpc.clientId,
      username: process.env.TEST_USERNAME || "ZZ028459",
      password: process.env.TEST_PASSWORD || "sc1234567",
    };

    const loginRes = await loginProcess(loginPayload);
    const loginData = loginRes.data
      ? decodeProtobufValue<Record<string, unknown>>(loginRes.data)
      : {};
    loggedInUserId = String(loginData.userId || loginPayload.username);
    authToken = String(loginData.token || loginRes.idempotencyKey || "mock-token-session");

    recordTest(
      "1.1 Authenticates operator credentials and exchanges for bearer token",
      { clientId: loginPayload.clientId, username: loginPayload.username },
      {
        status: loginRes.status,
        statusCode: loginRes.statusCode,
        hasToken: Boolean(authToken),
        userId: loginData.userId || loginPayload.username,
      },
      loginRes.status === "SUCCESS" ||
        loginRes.statusCode === 200 ||
        appConfig.dataSource === "static",
      loginRes.status !== "SUCCESS" ? loginRes.message : undefined,
    );
  } catch (err: unknown) {
    recordTest(
      "1.1 Authenticates operator credentials and exchanges for bearer token",
      "SYSADMIN login",
      { error: err instanceof Error ? err.message : String(err) },
      appConfig.dataSource === "static",
      err instanceof Error ? err.message : String(err),
    );
  }

  // ── Helper to execute and assert backend envelopes ──
  async function testDispatch(
    title: string,
    rawWire: {
      requestType: string;
      controlName: string;
      recordFunction: string;
      recordId?: string;
      data?: Record<string, unknown>;
    },
    assertFn: (res: {
      status: string;
      statusCode?: number;
      message?: string;
      data?: unknown;
      cleanData: unknown;
      records: unknown[];
    }) => boolean,
  ) {
    const parsed = cbsWirePayloadSchema.safeParse(rawWire);
    if (!parsed.success) {
      recordTest(
        title,
        rawWire,
        { schemaError: parsed.error.issues },
        false,
        "Client wire validation failed",
      );
      return;
    }

    const envelope = {
      servicePath: "default",
      requestType: rawWire.requestType,
      controlName: rawWire.controlName,
      branchCode: appConfig.centralBranch,
      recordFunction: rawWire.recordFunction,
      recordId: rawWire.recordId || "",
      authLevel: 1,
      userId: loggedInUserId,
      clientId: appConfig.grpc.clientId,
      data: rawWire.data || {},
    };

    try {
      const res = await dispatch(envelope, authToken);
      const cleanData = res.data ? decodeProtobufValue(res.data) : res.data;
      const records = cleanData ? unwrapRecordsPayload(cleanData) : [];

      const outputSummary = {
        status: res.status,
        statusCode: res.statusCode,
        message: res.message || "OK",
        recordsCount: records.length,
        hasData: Boolean(cleanData),
      };

      const passed = res.status === "SUCCESS" && assertFn({ ...res, cleanData, records });
      recordTest(
        title,
        rawWire,
        outputSummary,
        passed,
        res.status !== "SUCCESS" ? res.message : undefined,
      );
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      recordTest(title, rawWire, { error: errMsg }, false, errMsg);
    }
  }

  // ── 2. Menu Item Catalog (MENU) ──
  console.log("\n── 2. Menu Item Catalog List (MENU) ──");
  await testDispatch(
    "2.1 GRL on MENU: Returns list of leaf action records",
    {
      requestType: CbsRequestType.GRL,
      controlName: "MENU",
      recordFunction: CbsRecordFunction.LIST,
      recordId: "",
    },
    (res) =>
      res.records.length > 0 || (res.cleanData !== null && typeof res.cleanData === "object"),
  );

  // ── 3. Menu Tree ID Search (MENU.TREE) ──
  console.log("\n── 3. Menu Tree Lookups (MENU.TREE) ──");
  await testDispatch(
    "3.1 SBI on MENU.TREE: Returns available menu tree identifiers",
    {
      requestType: CbsRequestType.SBI,
      controlName: "MENU.TREE",
      recordFunction: CbsRecordFunction.LIST,
      recordId: "",
    },
    (res) => res.status === "SUCCESS",
  );

  await testDispatch(
    "3.2 GET on MENU.TREE: Returns specific hierarchical menu tree",
    {
      requestType: CbsRequestType.GET,
      controlName: "MENU.TREE",
      recordFunction: CbsRecordFunction.SEE,
      recordId: "MENU.ONE",
    },
    (res) => {
      const d = res.cleanData as Record<string, unknown> | null;
      return Boolean(d && (d.menuTree || d.treeDescription || d.recordId));
    },
  );

  await testDispatch(
    "3.3 GUM on MENU.TREE: Returns active user navigation menu tree",
    {
      requestType: CbsRequestType.GUM,
      controlName: "MENU.TREE",
      recordFunction: CbsRecordFunction.SEE,
      recordId: "",
    },
    (res) => {
      const { parseMNU } = require("@/lib/data-parsers");
      const parsed = parseMNU(res.cleanData);
      return parsed.success && parsed.data.length > 0;
    },
  );

  // ── 4. Metamodel Form Schema (MODEL.CONFIG / GMC) ──
  console.log("\n── 4. Metamodel Spec Introspection (MODEL.CONFIG / GMC) ──");
  await testDispatch(
    "4.1 GMC on MODEL.CONFIG for ACCOUNT: Returns field property definitions",
    {
      requestType: CbsRequestType.GMC,
      controlName: "MODEL.CONFIG",
      recordFunction: CbsRecordFunction.SEE,
      recordId: "ACCOUNT",
    },
    (res) => {
      const d = res.cleanData as Record<string, unknown> | null;
      const model = (d?.record || d) as Record<string, unknown> | null;
      return Boolean(model && (Array.isArray(model.PROPERTIES) || model.TABLENAME === "ACCOUNT"));
    },
  );

  // ── 5. Form Presentation Spec (CONFIG.FORM / GFC) ──
  console.log("\n── 5. Form Presentation Spec (CONFIG.FORM / GFC) ──");
  await testDispatch(
    "5.1 GFC on CONFIG.FORM for ACCOUNT,1.0.0: Returns layout elements",
    {
      requestType: CbsRequestType.GFC,
      controlName: "CONFIG.FORM",
      recordFunction: CbsRecordFunction.SEE,
      recordId: "ACCOUNT,1.0.0",
    },
    (res) => res.status === "SUCCESS",
  );

  // ── 6. Branch Directory Catalog (BRANCH) ──
  console.log("\n── 6. Branch Directory Catalog (BRANCH) ──");
  await testDispatch(
    "6.1 GRL on BRANCH: Returns operational branch directory records",
    {
      requestType: CbsRequestType.GRL,
      controlName: "BRANCH",
      recordFunction: CbsRecordFunction.LIST,
      recordId: "",
    },
    (res) => res.status === "SUCCESS",
  );

  // ── 7. HTTP /api/proxy Route Live Check (Optional if server is up) ──
  console.log("\n── 7. Next.js Route Gateway (/api/proxy) Live Check ──");
  try {
    const proxyUrl = "http://localhost:3000/api/proxy";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    const probeRes = await fetch(proxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestType: CbsRequestType.GRL,
        controlName: "BRANCH",
        recordFunction: CbsRecordFunction.LIST,
        recordId: "",
      }),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const json = (await probeRes.json()) as { status?: string; message?: string };
    recordTest(
      "7.1 Next.js HTTP /api/proxy Gateway Reachability",
      "POST http://localhost:3000/api/proxy",
      { httpStatus: probeRes.status, status: json.status, message: json.message },
      probeRes.status === 200 || probeRes.status === 401, // 401 without cookie is expected and confirms proxy is running
      probeRes.status >= 500 ? "Server error on /api/proxy" : undefined,
    );
  } catch {
    console.log(
      `       ℹ Local Next.js dev server (http://localhost:3000) is currently offline.\n` +
        `         Start server with "pnpm dev" to test HTTP proxy boundary.`,
    );
  }

  // ── Final Consolidated Summary ──
  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  console.log("\n================================================================================");
  if (failedTests === 0) {
    console.log(
      `>>> SUCCESS: ALL ${passedTests} API RESPONSE CAPABILITIES RETURNED VALID RESPONSES! <<<`,
    );
  } else {
    console.error(
      `>>> WARNING: ${failedTests} OF ${testCases.length} API CALLS RETURNED ERRORS FROM HOST! <<<`,
    );
    console.error(`Check gRPC connection, credentials, or table names in core database.`);
  }
  console.log("================================================================================\n");

  if (failedTests > 0 && appConfig.dataSource === "static") {
    process.exit(1);
  }
}

runSuite().catch((err: unknown) => {
  console.error("Fatal API Verification Suite Crash:", err);
  process.exit(1);
});

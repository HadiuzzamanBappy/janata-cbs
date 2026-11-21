/**
 * Automated Verification Suite for Core gRPC Infrastructure & Gateway Protocol (@/lib/infra-grpc)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/infra-grpc` with explicit Input and Output visualization:
 * 1. Runtime Mode Check (isStaticMode: validates dataSource configuration)
 * 2. Service Routing (SERVICE_<NAME>_URL registry, REST round-trip, unknown / bad / down services)
 * 3. Financial Transaction Classification (financial vs non-financial pipeline)
 * 4. gRPC Protocol to HTTP Status Error Translation (standard mapping matrix)
 * 5. Inquiry Branch Pinning (pinInquiryBranch: branch criteria forced to EQ the session branch)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-infra-grpc.ts
 */

import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

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

/** Local REST microservice: records what dispatch() sends; /finxurm/inq answers a CBS envelope. */
async function startRestService(): Promise<{
  base: string;
  received: Array<{ url: string; auth: string; body: Record<string, unknown> }>;
  close: () => void;
}> {
  const received: Array<{ url: string; auth: string; body: Record<string, unknown> }> = [];
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
    });
    req.on("end", () => {
      received.push({
        url: req.url ?? "",
        auth: req.headers.authorization ?? "",
        body: JSON.parse(raw || "{}"),
      });
      if (req.url === "/finxurm/inq") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            status: "SUCCESS",
            statusCode: 200,
            message: "ok",
            errors: null,
            idempotencyKey: null,
            data: { records: [{ recordId: "UM1" }] },
          }),
        );
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return { base: `http://127.0.0.1:${port}`, received, close: () => server.close() };
}

async function runSuite() {
  // Service env must exist before core-config loads (it is read once, at start-up)
  const rest = await startRestService();
  process.env.DATA_SOURCE = "grpc";
  process.env.SERVICE_FINXURM_URL = `${rest.base}/finxurm/inq`;
  process.env.SERVICE_FINXLOAN_URL = "localhost:8383";
  process.env.SERVICE_FINXBAD_URL = `${rest.base}/bad`;
  process.env.SERVICE_FINXDOWN_URL = "http://127.0.0.1:1/finxdown/inq";

  const { resolveService, serverConfig } = await import("@/lib/core-config/server");
  const { dispatch, grpcStatusToHttp, isFinancialRequest, isStaticMode } = await import(
    "@/lib/infra-grpc"
  );

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
    { dataSource: serverConfig.dataSource },
    { isStaticMode: isStatic },
    isStatic === (serverConfig.dataSource === "static"),
  );

  // ── 2. Service Routing ──
  console.log("\n── 2. Service Routing (resolveService, dispatch) ──");
  const core = resolveService("");
  recordTest(
    "2.1 Empty or default servicePath routes to the core over gRPC at GRPC_HOST",
    { servicePath: "" },
    core,
    core?.name === "default" && core.protocol === "grpc" && core.address === serverConfig.grpc.host,
  );

  const urm = resolveService("FinXURM");
  const loan = resolveService("finxloan");
  recordTest(
    "2.2 SERVICE_<NAME>_URL registers NAME (any case); the address picks the protocol",
    { FinXURM: process.env.SERVICE_FINXURM_URL, finxloan: process.env.SERVICE_FINXLOAN_URL },
    { urm, loan },
    urm?.name === "finxurm" && urm.protocol === "rest" && loan?.protocol === "grpc",
  );

  const baseEnvelope = {
    requestType: "INQ",
    controlName: "USER.MGT",
    recordFunction: "S",
    recordId: "",
    branchCode: "JB9999",
    authLevel: 1,
    userId: "U1",
    clientId: "WEB-CLIENT",
    data: { queryString: [], curPage: 1, perPage: 30 },
  };
  const unknown = await dispatch({ ...baseEnvelope, servicePath: "finxnone" }, "tok");
  recordTest(
    "2.3 An unregistered service fails with 503 and is never sent to the core",
    { servicePath: "finxnone" },
    { status: unknown.status, statusCode: unknown.statusCode, message: unknown.message },
    resolveService("finxnone") === undefined &&
      unknown.status === "FAIL" &&
      unknown.statusCode === 503,
  );

  const viaRest = await dispatch({ ...baseEnvelope, servicePath: "finxurm" }, "tok");
  const sent = rest.received.find((r) => r.url === "/finxurm/inq");
  recordTest(
    "2.4 REST service gets the same flat request + servicePath, Bearer token, at its exact URL",
    { servicePath: "finxurm" },
    { sent, reply: { status: viaRest.status, errors: viaRest.errors, data: viaRest.data } },
    sent?.auth === "Bearer tok" &&
      sent.body.servicePath === "finxurm" &&
      sent.body.requestType === "INQ" &&
      sent.body.userId === "U1" &&
      viaRest.status === "SUCCESS" &&
      Array.isArray(viaRest.errors) &&
      viaRest.errors.length === 0,
  );

  const bad = await dispatch({ ...baseEnvelope, servicePath: "finxbad" }, "tok");
  const down = await dispatch({ ...baseEnvelope, servicePath: "finxdown" }, "tok");
  rest.close();
  recordTest(
    "2.5 A non-CBS reply fails with 502; an unreachable service fails with 503",
    { finxbad: "HTTP 500 text", finxdown: "nothing listening" },
    { bad: [bad.status, bad.statusCode], down: [down.status, down.statusCode] },
    bad.status === "FAIL" &&
      bad.statusCode === 502 &&
      down.status === "FAIL" &&
      down.statusCode === 503,
  );

  // ── 3. Financial Transaction Classification ──
  console.log("\n── 3. Financial Transaction Classification ──");
  const financialTypes = serverConfig.grpc.financialTransactionTypes;
  const requiredFinancialTypes = ["ATT", "CTT", "AFT"];
  recordTest(
    "3.1 Validates financial transaction types configured for dual-phase processing",
    { configuredTypes: financialTypes, required: requiredFinancialTypes },
    { isConfigured: financialTypes.length > 0, typesCount: financialTypes.length },
    requiredFinancialTypes.every((t) => financialTypes.includes(t)),
  );

  const classifiedFinancial = requiredFinancialTypes.map((t) => ({
    type: t,
    isFinancial: isFinancialRequest(t),
  }));
  const classifiedNonFinancial = ["GET", "PUT", "INQ"].map((t) => ({
    type: t,
    isFinancial: isFinancialRequest(t),
  }));
  recordTest(
    "3.2 Routes configured financial types to FinancialProcess and others to NonFinancialProcess",
    { financial: requiredFinancialTypes, nonFinancial: ["GET", "PUT", "INQ"] },
    { financial: classifiedFinancial, nonFinancial: classifiedNonFinancial },
    classifiedFinancial.every((c) => c.isFinancial) &&
      classifiedNonFinancial.every((c) => !c.isFinancial),
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

  // ── 5. Inquiry Resolution (resolveInquiryEnvelope: the INQ envelope sent to the core) ──
  console.log("\n── 5. Inquiry Resolution (resolveInquiryEnvelope) ──");
  const { resolveInquiryEnvelope } = await import("../../src/app/api/_lib/inquiry");
  const definition = {
    INQInfo: {
      controllerName: "users",
      description: "Branch users",
      showBranchWise: true,
      fixedSelection: 'recStatus EQ "AU"',
      inqServicePath: "finxurm",
      inqType: "DFT",
    },
    INQSelectField: [
      {
        selectFieldName: "userType",
        selectFieldDisplay: "Type",
        selectFieldOperator: "EQ",
        selectFieldOperatorFixed: "EQ",
      },
      { selectFieldName: "fullName", selectFieldDisplay: "Name", selectFieldOperator: "CT" },
    ],
    INQDef: [{ fieldName: "userId", fieldDisplay: "User" }],
  };
  const loaded: Array<Record<string, unknown>> = [];
  const loader = async (target: Record<string, unknown>) => {
    loaded.push(target);
    return { status: "SUCCESS" as const, statusCode: 200, data: definition, timestamp: "" };
  };
  const inqRequest = (data: Record<string, unknown>, recordId = "get.users") => ({
    servicePath: "default",
    requestType: "INQ",
    controlName: "ACCOUNT",
    branchCode: "JB0001",
    recordFunction: "S",
    recordId,
    authLevel: 1,
    userId: "U1",
    clientId: "WEB",
    data,
  });

  const resolved = await resolveInquiryEnvelope(
    inqRequest({
      queryString: [
        { selectFieldName: "fullName", selectFieldOperator: "CT", selectFieldValue: " ali " },
      ],
    }),
    loader,
  );
  const sentQuery = resolved.ok
    ? (resolved.envelope.data.queryString as Array<Record<string, string>>)
    : [];
  recordTest(
    "5.1 The envelope comes from the saved inquiry: controller, service, branch pin, fixed selection, operator filter, row cap",
    { browser: "recordId get.users, controlName ACCOUNT (ignored), fullName CT ' ali '" },
    resolved,
    resolved.ok &&
      loaded[0]?.requestType === "GET" &&
      loaded[0]?.controlName === "INQUIRY" &&
      loaded[0]?.recordId === "GET.USERS" &&
      loaded[0]?.servicePath === "default" &&
      resolved.envelope.controlName === "USERS" &&
      resolved.envelope.servicePath === "finxurm" &&
      resolved.envelope.recordId === "" &&
      resolved.envelope.data.perPage === 5000 &&
      resolved.envelope.data.curPage === 1 &&
      sentQuery
        .map((c) => `${c.selectFieldName} ${c.selectFieldOperator} ${c.selectFieldValue}`)
        .join("; ") === "branchCode EQ JB0001; recStatus EQ AU; fullName CT ali",
  );

  const refusals = await Promise.all(
    [
      {
        queryString: [
          { selectFieldName: "branchCode", selectFieldOperator: "NE", selectFieldValue: "JB0001" },
        ],
      },
      {
        queryString: [
          { selectFieldName: "recStatus", selectFieldOperator: "EQ", selectFieldValue: "INAU" },
        ],
      },
      {
        queryString: [
          { selectFieldName: "userType", selectFieldOperator: "NE", selectFieldValue: "A" },
        ],
      },
      {
        queryString: [
          { selectFieldName: "salary", selectFieldOperator: "GT", selectFieldValue: "0" },
        ],
      },
      { queryString: [], perPage: 1000000 },
      { queryString: "branchCode EQ JB0002" },
    ].map((data) => resolveInquiryEnvelope(inqRequest(data), loader)),
  );
  recordTest(
    "5.2 Tampering is refused with 400, never forwarded: branch filter, fixed field, locked operator, unknown field, own paging, non-array query",
    [
      "branchCode NE",
      "recStatus EQ INAU",
      "userType NE (locked EQ)",
      "salary GT",
      "perPage 1e6",
      "queryString string",
    ],
    refusals.map((r) => (r.ok ? "FORWARDED" : `${r.status} ${r.message}`)),
    refusals.every((r) => !r.ok && r.status === 400),
  );

  const noId = await resolveInquiryEnvelope(inqRequest({ queryString: [] }, " "), loader);
  const missing = await resolveInquiryEnvelope(inqRequest({ queryString: [] }), async () => ({
    status: "RECORD_NOT_FOUND" as const,
    statusCode: 404,
    message: "No inquiry GET.USERS",
    timestamp: "",
  }));
  recordTest(
    "5.3 No inquiry ID is a 400; an inquiry the core doesn't have is refused with the core's status",
    { noId: "recordId ' '", missing: "RECORD_NOT_FOUND 404" },
    { noId, missing },
    !noId.ok && noId.status === 400 && !missing.ok && missing.status === 404,
  );

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

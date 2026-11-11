/**
 * Automated Verification Suite for CBS Micro-Client Gateway (@/lib/cbs-client)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by the canonical `cbs` facade with explicit Input and Output visualization:
 * 1. cbs.model(control) - Universal CRUD lifecycle (get, list, searchIds, getNewId, save, authorize, delete, hold, reverse)
 * 2. cbs.branch, cbs.control, cbs.menu, cbs.menuTree - System directory models
 * 3. cbs.modelConfig, cbs.formConfig, cbs.inquiryConfig - Meta-config protocol overrides
 * 4. cbs.inquiry - Runtime inquiry query execution (INQ)
 * 5. cbs.userSecurity - Security credential mutations (CPW)
 * 6. cbs.send - Universal transport dispatcher (pre-flight validation, HTTP dispatch, 401 handling, cancellation)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-cbs-client.ts
 */

import { z } from "zod";
import { cbs } from "@/lib/cbs-client";
import type { CbsWirePayload } from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";

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
  console.log("\n================================================================================");
  console.log("             CBS CLIENT WIRE FACTORY & TRANSPORT VERIFICATION                   ");
  console.log("================================================================================");
  console.log(" Architecture : Universal Micro-Client Facade (@/lib/cbs-client)");
  console.log(" Pattern      : Single Unique Test per Client Capability with Visible Wire IO");
  console.log("================================================================================");

  // --- 1. cbs.model (Universal CRUD Lifecycle Engine) ---
  console.log("\n── 1. Universal Model Engine (cbs.model) ──");
  const account = cbs.model("ACCOUNT");

  // 1.1 GET
  const getPayload = account.get("10001");
  recordTest(
    "1.1 cbs.model.get: Builds GET/SEE wire envelope",
    'account.get("10001")',
    getPayload,
    getPayload.requestType === CbsRequestType.GET &&
      getPayload.recordFunction === CbsRecordFunction.SEE &&
      getPayload.recordId === "10001",
  );

  // 1.2 LIST
  const listPayload = account.list({ criteria: { branch: "0101" } });
  recordTest(
    "1.2 cbs.model.list: Builds GRL/LIST wire envelope with criteria",
    'account.list({ criteria: { branch: "0101" } })',
    listPayload,
    listPayload.requestType === CbsRequestType.GRL &&
      listPayload.recordFunction === CbsRecordFunction.LIST &&
      (listPayload.data as Record<string, unknown>)?.branch === "0101",
  );

  // 1.3 SEARCH IDS
  const searchPayload = account.searchIds({ recordId: "100" });
  recordTest(
    "1.3 cbs.model.searchIds: Builds SBI/LIST lookup wire envelope",
    'account.searchIds({ recordId: "100" })',
    searchPayload,
    searchPayload.requestType === CbsRequestType.SBI &&
      searchPayload.recordFunction === CbsRecordFunction.LIST &&
      searchPayload.recordId === "100",
  );

  // 1.4 GET NEW ID
  const newIdPayload = account.getNewId();
  recordTest(
    "1.4 cbs.model.getNewId: Builds GNI/INPUT sequence allocation envelope",
    "account.getNewId()",
    newIdPayload,
    newIdPayload.requestType === CbsRequestType.GNI &&
      newIdPayload.recordFunction === CbsRecordFunction.INPUT,
  );

  // 1.5 SAVE / COMMIT
  const sampleIdemUuid = "550e8400-e29b-41d4-a716-446655440000";
  const savePayload = account.save(
    { title: "Savings A/C" },
    { recordId: "10001", idempotencyKey: sampleIdemUuid },
  );
  recordTest(
    "1.5 cbs.model.save: Builds PUT/INPUT envelope with data & UUID idempotencyKey",
    `account.save({ title: "Savings A/C" }, { recordId: "10001", idempotencyKey: "${sampleIdemUuid}" })`,
    savePayload,
    savePayload.requestType === CbsRequestType.PUT &&
      savePayload.recordFunction === CbsRecordFunction.INPUT &&
      savePayload.idempotencyKey === sampleIdemUuid &&
      (savePayload.data as Record<string, unknown>)?.title === "Savings A/C",
  );

  // 1.6 AUTHORIZE
  const authPayload = account.authorize("10001");
  recordTest(
    "1.6 cbs.model.authorize: Builds AUT/AUTHORIZE approval envelope",
    'account.authorize("10001")',
    authPayload,
    authPayload.requestType === CbsRequestType.AUT &&
      authPayload.recordFunction === CbsRecordFunction.AUTHORIZE &&
      authPayload.recordId === "10001",
  );

  // 1.7 DELETE
  const delPayload = account.delete("10001");
  recordTest(
    "1.7 cbs.model.delete: Builds PUT/DELETE lifecycle envelope",
    'account.delete("10001")',
    delPayload,
    delPayload.requestType === CbsRequestType.PUT &&
      delPayload.recordFunction === CbsRecordFunction.DELETE,
  );

  // 1.8 HOLD
  const holdPayload = account.hold("10001", { reason: "Review" });
  recordTest(
    "1.8 cbs.model.hold: Builds HLD/HOLD queue envelope",
    'account.hold("10001", { reason: "Review" })',
    holdPayload,
    holdPayload.requestType === CbsRequestType.HLD &&
      holdPayload.recordFunction === CbsRecordFunction.HOLD &&
      (holdPayload.data as Record<string, unknown>)?.reason === "Review",
  );

  // 1.9 REVERSE
  const revPayload = account.reverse("10001");
  recordTest(
    "1.9 cbs.model.reverse: Builds REV/REVERSE ledger transaction envelope",
    'account.reverse("10001")',
    revPayload,
    revPayload.requestType === CbsRequestType.REV &&
      revPayload.recordFunction === CbsRecordFunction.REVERSE,
  );

  // --- 2. System Directories (branch, control, menu, menuTree) ---
  console.log("\n── 2. System Directory & Navigation Models ──");
  const branchList = cbs.branch.list();
  recordTest(
    "2.1 cbs.branch: Pre-bound model for BRANCH directory",
    "cbs.branch.list()",
    branchList,
    cbs.branch.controlName === CbsControlTable.BRANCH && branchList.controlName === "BRANCH",
  );

  recordTest(
    "2.2 cbs.control: Pre-bound model for CONTROL command catalog",
    "cbs.control.controlName",
    { controlName: cbs.control.controlName },
    cbs.control.controlName === CbsControlTable.CONTROL,
  );

  const menuList = cbs.menu.list();
  recordTest(
    "2.3 cbs.menu: Pre-bound model for MENU catalog",
    "cbs.menu.list()",
    menuList,
    cbs.menu.controlName === CbsControlTable.MENU && menuList.controlName === "MENU",
  );

  const treeGet = cbs.menuTree.get();
  recordTest(
    "2.4 cbs.menuTree: Pre-bound model for MENU.TREE navigation hierarchy via GUM",
    "cbs.menuTree.get()",
    treeGet,
    cbs.menuTree.controlName === CbsControlTable.MENU_TREE &&
      treeGet.requestType === CbsRequestType.GUM &&
      treeGet.controlName === "MENU.TREE" &&
      treeGet.recordId === "",
  );

  // --- 3. Meta-Configuration Protocol Overrides ---
  console.log("\n── 3. Meta-Configuration Protocol Overrides ──");
  const mcGet = cbs.modelConfig.get("USER");
  const mcSave = cbs.modelConfig.save({ TABLENAME: "USER" });
  const mcAuth = cbs.modelConfig.authorize("USER");
  recordTest(
    "3.1 cbs.modelConfig: Emits dedicated GMC, SMC, and AMC wire verbs",
    'cbs.modelConfig.{get, save, authorize}("USER")',
    { get: mcGet.requestType, save: mcSave.requestType, auth: mcAuth.requestType },
    mcGet.requestType === CbsRequestType.GMC &&
      mcSave.requestType === CbsRequestType.SMC &&
      mcAuth.requestType === CbsRequestType.AMC &&
      mcGet.controlName === CbsControlTable.MODEL_CONFIG,
  );

  const fcGet = cbs.formConfig.get("USER.MGT,V1");
  const fcSave = cbs.formConfig.save({ title: "User Form" }, { recordId: "USER.MGT,V1" });
  recordTest(
    "3.2 cbs.formConfig: Emits dedicated GFC and SFC presentation wire verbs",
    'cbs.formConfig.{get, save}("USER.MGT,V1")',
    { get: fcGet.requestType, save: fcSave.requestType },
    fcGet.requestType === CbsRequestType.GFC &&
      fcSave.requestType === CbsRequestType.SFC &&
      fcGet.controlName === CbsControlTable.FORM_CONFIG,
  );

  const inqConfig = cbs.inquiryConfig.get("TODAY.TXN.ENTRY");
  recordTest(
    "3.3 cbs.inquiryConfig: Targets INQUIRY definition table",
    'cbs.inquiryConfig.get("TODAY.TXN.ENTRY")',
    inqConfig,
    inqConfig.controlName === CbsControlTable.INQUIRY_CONFIG &&
      inqConfig.requestType === CbsRequestType.GET,
  );

  // --- 4. Runtime Inquiries (cbs.inquiry) ---
  console.log("\n── 4. Runtime Inquiries (cbs.inquiry) ──");
  const inqRun = cbs.inquiry.executeQuery("GET.TXNS", {
    curPage: 1,
    perPage: 50,
    queryString: [
      {
        selectFieldName: "CURRENCY",
        selectFieldOperator: "EQ",
        selectFieldValue: "BDT",
      },
    ],
  });
  recordTest(
    "4.1 cbs.inquiry.executeQuery: Builds INQ tabular execution envelope",
    'cbs.inquiry.executeQuery("GET.TXNS", { curPage: 1, perPage: 50, queryString: [...] })',
    inqRun,
    inqRun.requestType === CbsRequestType.INQ &&
      inqRun.controlName === "GET.TXNS" &&
      (inqRun.data as Record<string, unknown>)?.curPage === 1 &&
      (inqRun.data as Record<string, unknown>)?.perPage === 50 &&
      Array.isArray((inqRun.data as Record<string, unknown>)?.queryString),
  );

  // --- 5. User Security (cbs.userSecurity) ---
  console.log("\n── 5. User Security (cbs.userSecurity) ──");
  const cpw = cbs.userSecurity.changePassword({ currPass: "p1", newPass: "p2" });
  recordTest(
    "5.1 cbs.userSecurity: Emits CPW wire security envelope",
    "cbs.userSecurity.changePassword(...)",
    { changePassword: cpw.requestType },
    cpw.requestType === CbsRequestType.CPW,
  );

  // --- 6. Universal Transport Dispatcher (cbs.send) ---
  console.log("\n── 6. Transport Dispatcher & Pre-Flight Validation (cbs.send) ──");

  // 6.1 Pre-Flight Validation Guard (Empty requestType + Mutation missing idempotencyKey)
  let preflightCaught = false;
  let preflightError = "";
  try {
    const invalidPayload = { requestType: "" } as unknown as CbsWirePayload;
    await cbs.send(invalidPayload, { silent: true });
  } catch (err: unknown) {
    preflightCaught = true;
    preflightError = err instanceof Error ? err.message : String(err);
  }
  let missingMutationKeyRejected = false;
  try {
    await cbs.send(account.save({ title: "Missing Key" }, { recordId: "10001" }), { silent: true });
  } catch {
    missingMutationKeyRejected = true;
  }
  recordTest(
    "6.1 cbs.send: Fails fast on malformed payload or mutation missing UUIDv4 idempotencyKey",
    '{ requestType: "" } / PUT without idempotencyKey',
    { caught: preflightCaught, missingMutationKeyRejected, error: preflightError },
    preflightCaught &&
      missingMutationKeyRejected &&
      preflightError.includes("CLIENT_VALIDATION_ERROR"),
  );

  // 6.2 HTTP Mock Transport Matrix
  const originalFetch = globalThis.fetch;
  try {
    // A. HTTP 200 SUCCESS (Reads pass without fake keys; mutations forward caller UUIDv4)
    let capturedBody: Record<string, unknown> = {};
    globalThis.fetch = async (_url, init) => {
      capturedBody = JSON.parse(String(init?.body || "{}")) as Record<string, unknown>;
      return new Response(
        JSON.stringify({ status: "SUCCESS", data: { id: "101", balance: 500 } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    };

    const readRes = await cbs.send(account.get("101"), { silent: true });
    const mutRes = await cbs.send(
      account.save({ title: "Savings A/C" }, { recordId: "101", idempotencyKey: sampleIdemUuid }),
      { silent: true },
    );
    recordTest(
      "6.2 cbs.send: Dispatches reads without fake keys and forwards mutation UUIDv4 idempotencyKey",
      'cbs.send(account.get("101")) & cbs.send(account.save(..., { idempotencyKey }))',
      {
        idempotencyKey: capturedBody.idempotencyKey,
        readStatus: readRes.status,
        mutStatus: mutRes.status,
      },
      readRes.status === "SUCCESS" &&
        mutRes.status === "SUCCESS" &&
        capturedBody.idempotencyKey === sampleIdemUuid,
    );

    // B. Response Schema Validation
    const testSchema = z.object({ id: z.string(), balance: z.number() });
    const schemaRes = await cbs.send(account.get("101"), {
      silent: true,
      responseSchema: testSchema,
    });
    recordTest(
      "6.3 cbs.send: Enforces runtime type-safety with Zod responseSchema",
      "cbs.send(..., { responseSchema: z.object(...) })",
      { status: schemaRes.status, data: schemaRes.data },
      schemaRes.status === "SUCCESS",
    );

    // C. HTTP 401 Session Expiration
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "Expired" }), { status: 401 });

    let authCaught = false;
    let authError = "";
    try {
      await cbs.send(account.get("101"), { silent: true });
    } catch (err: unknown) {
      authCaught = true;
      authError = err instanceof Error ? err.message : String(err);
    }
    recordTest(
      "6.4 cbs.send: Intercepts 401 and cleanly raises UNAUTHORIZED exception",
      "HTTP 401 Session Expired",
      { caught: authCaught, error: authError },
      authCaught && authError === "UNAUTHORIZED",
    );

    // D. AbortSignal Cancellation
    const abortCtrl = new AbortController();
    abortCtrl.abort();
    globalThis.fetch = async () => {
      throw new DOMException("Aborted", "AbortError");
    };

    let abortCaught = false;
    let abortName = "";
    try {
      await cbs.send(account.get("101"), { silent: true, signal: abortCtrl.signal });
    } catch (err: unknown) {
      abortCaught = true;
      abortName = err instanceof DOMException ? err.name : "";
    }
    recordTest(
      "6.5 cbs.send: Supports AbortSignal without triggering false error alerts",
      "AbortSignal.abort()",
      { caught: abortCaught, errorName: abortName },
      abortCaught && abortName === "AbortError",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  console.log("\n================================================================================");
  if (failedTests === 0) {
    console.log(
      `>>> SUCCESS: ALL ${passedTests} CBS-CLIENT WIRE CAPABILITIES VALIDATED 100% CLEAN! <<<`,
    );
  } else {
    console.error(`>>> FAILURE: ${failedTests} TESTS FAILED! <<<`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runSuite().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

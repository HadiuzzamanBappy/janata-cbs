/**
 * Automated Verification Suite for CBS Micro-Client Gateway (@/lib/cbs-client)
 * Tests all domain payload factories, wire protocol schemas, and request types.
 *
 * Usage:
 *   pnpm tsx scripts/verify-cbs-client.ts
 */

import { z } from "zod";
import { cbs, createModelPayloads, sendCbsRequest } from "@/lib/cbs-client";
import type { CbsWirePayload } from "@/lib/data-schemas";
import { CbsControlTable, CbsRecordFunction, CbsRequestType, DEFAULT_SERVICE_PATH } from "@/types";

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

async function runSuite() {
  console.log("\n========================================================");
  console.log("       CBS CLIENT WIRE FACTORY & TRANSPORT SUITE        ");
  console.log("========================================================\n");

  // --- 1. Universal Model Factory (createModelPayloads / cbs.model) ---
  console.log("--- 1. Universal Model Factory (BaseModel) ---");
  const loanModel = createModelPayloads("LOAN.PRODUCT");

  // 1.1 Read single record (GET, SEE)
  const getPayload = loanModel.get("loan-1001");
  assert(
    "BaseModel: get (GET, SEE)",
    getPayload.requestType === CbsRequestType.GET &&
      getPayload.recordFunction === CbsRecordFunction.SEE,
  );
  assert("BaseModel: recordId trimmed and uppercased", getPayload.recordId === "LOAN-1001");
  assert("BaseModel: default servicePath", getPayload.servicePath === DEFAULT_SERVICE_PATH);

  // 1.2 List records (GRL, LIST)
  const listPayload = loanModel.list({ criteria: { branch: "JB9999" } });
  assert(
    "BaseModel: list (GRL, LIST)",
    listPayload.requestType === CbsRequestType.GRL &&
      listPayload.recordFunction === CbsRecordFunction.LIST,
  );
  assert(
    "BaseModel: list criteria preserved",
    (listPayload.data as Record<string, unknown>)?.branch === "JB9999",
  );

  // 1.3 Allocate new record ID (GNI, INPUT)
  const newIdPayload = loanModel.getNewId();
  assert(
    "BaseModel: getNewId (GNI, INPUT)",
    newIdPayload.requestType === CbsRequestType.GNI &&
      newIdPayload.recordFunction === CbsRecordFunction.INPUT,
  );

  // 1.4 Commit record (PUT, INPUT with idempotency)
  const savePayload = loanModel.save(
    { amount: 50000 },
    { recordId: "loan-1001", idempotencyKey: "idem-abc-123" },
  );
  assert(
    "BaseModel: save (PUT, INPUT)",
    savePayload.requestType === CbsRequestType.PUT &&
      savePayload.recordFunction === CbsRecordFunction.INPUT,
  );
  assert("BaseModel: save idempotencyKey preserved", savePayload.idempotencyKey === "idem-abc-123");
  assert(
    "BaseModel: save data payload preserved",
    (savePayload.data as Record<string, unknown>)?.amount === 50000,
  );

  // 1.5 Authorize record (AUT, AUTHORIZE)
  const authPayload = loanModel.authorize("loan-1001");
  assert(
    "BaseModel: authorize (AUT, AUTHORIZE)",
    authPayload.requestType === CbsRequestType.AUT &&
      authPayload.recordFunction === CbsRecordFunction.AUTHORIZE,
  );
  assert("BaseModel: authorize recordId", authPayload.recordId === "LOAN-1001");

  // 1.6 Delete record (PUT, DELETE)
  const delPayload = loanModel.delete("loan-1001");
  assert(
    "BaseModel: delete (PUT, DELETE)",
    delPayload.requestType === CbsRequestType.PUT &&
      delPayload.recordFunction === CbsRecordFunction.DELETE,
  );

  // 1.7 Hold draft record (HLD, HOLD)
  const holdPayload = loanModel.hold("loan-1001", { draftStep: 2 });
  assert(
    "BaseModel: hold (HLD, HOLD)",
    holdPayload.requestType === CbsRequestType.HLD &&
      holdPayload.recordFunction === CbsRecordFunction.HOLD,
  );
  assert(
    "BaseModel: hold data preserved",
    (holdPayload.data as Record<string, unknown>)?.draftStep === 2,
  );

  // 1.8 Reverse live record (REV, REVERSE)
  const revPayload = loanModel.reverse("loan-1001");
  assert(
    "BaseModel: reverse (REV, REVERSE)",
    revPayload.requestType === CbsRequestType.REV &&
      revPayload.recordFunction === CbsRecordFunction.REVERSE,
  );

  // 1.9 Custom Service Path & Whitespace Trimming
  const customModel = createModelPayloads("  teller.vault  ", {
    servicePath: "/api/vault-service",
  });
  assert(
    "BaseModel: controlName trimmed and uppercased",
    customModel.controlName === "TELLER.VAULT",
  );
  assert("BaseModel: custom servicePath set", customModel.servicePath === "/api/vault-service");
  assert(
    "BaseModel: get uses custom servicePath",
    customModel.get("v1").servicePath === "/api/vault-service",
  );

  // --- 2. Canonical Control Tables ---
  console.log("\n--- 2. Canonical Control Tables ---");
  // 2.1 Form Config (FORM.CONFIG)
  const formCfg = cbs.formConfig.get("CUSTOMER.FORM");
  assert(
    "ControlTable: formConfig (FORM.CONFIG)",
    formCfg.controlName === CbsControlTable.FORM_CONFIG && formCfg.recordId === "CUSTOMER.FORM",
  );

  // 2.2 Model Config (MODEL.CONFIG)
  const modelCfg = cbs.modelConfig.get("ACCOUNT.MODEL");
  assert(
    "ControlTable: modelConfig (MODEL.CONFIG)",
    modelCfg.controlName === CbsControlTable.MODEL_CONFIG && modelCfg.recordId === "ACCOUNT.MODEL",
  );

  // 2.3 Inquiry Config (INQUIRY.CONFIG)
  const inqCfg = cbs.inquiryConfig.get("INQ.CUST.LIST");
  assert(
    "ControlTable: inquiryConfig (INQUIRY.CONFIG)",
    inqCfg.controlName === CbsControlTable.INQUIRY_CONFIG && inqCfg.recordId === "INQ.CUST.LIST",
  );

  // 2.4 User Group (USER.GROUP)
  const userGrp = cbs.userGroup.get("OFFICER_ROLE");
  assert(
    "ControlTable: userGroup (USER.GROUP)",
    userGrp.controlName === CbsControlTable.USER_GROUP && userGrp.recordId === "OFFICER_ROLE",
  );

  // --- 3. Domain Form Payloads (cbs.form) ---
  console.log("\n--- 3. Domain Form Payloads (cbs.form) ---");
  const formSearch = cbs.form.searchRecordIds("ACCOUNT");
  assert(
    "Form: searchRecordIds (SBI, LIST, no data)",
    formSearch.requestType === CbsRequestType.SBI &&
      formSearch.recordFunction === CbsRecordFunction.LIST &&
      formSearch.recordId === "" &&
      formSearch.data === undefined,
  );

  const formGni = cbs.form.getNewRecordId("ACCOUNT");
  assert(
    "Form: getNewRecordId (GNI, INPUT)",
    formGni.requestType === CbsRequestType.GNI &&
      formGni.recordFunction === CbsRecordFunction.INPUT,
  );

  const formFetch = cbs.form.fetchRecord("ACCOUNT", "1000001");
  assert(
    "Form: fetchRecord (GET, SEE)",
    formFetch.requestType === CbsRequestType.GET &&
      formFetch.recordFunction === CbsRecordFunction.SEE,
  );

  const formCommit = cbs.form.commitRecord(
    "CUSTOMER",
    { name: "Rahim" },
    { recordId: "9001", idempotencyKey: "idem-cust-1" },
  );
  assert(
    "Form: commitRecord (PUT, INPUT)",
    formCommit.requestType === CbsRequestType.PUT && formCommit.idempotencyKey === "idem-cust-1",
  );

  const formAuth = cbs.form.authorizeRecord("ACCOUNT", "1000001");
  assert(
    "Form: authorizeRecord (AUT, AUTHORIZE)",
    formAuth.requestType === CbsRequestType.AUT &&
      formAuth.recordFunction === CbsRecordFunction.AUTHORIZE,
  );

  const formDel = cbs.form.deleteRecord("ACCOUNT", "1000001");
  assert(
    "Form: deleteRecord (PUT, DELETE)",
    formDel.requestType === CbsRequestType.PUT &&
      formDel.recordFunction === CbsRecordFunction.DELETE,
  );

  const formHold = cbs.form.holdRecord("ACCOUNT", "1000001", { pendingReview: true });
  assert(
    "Form: holdRecord (HLD, HOLD)",
    formHold.requestType === CbsRequestType.HLD &&
      formHold.recordFunction === CbsRecordFunction.HOLD,
  );

  const formRev = cbs.form.reverseRecord("ACCOUNT", "1000001");
  assert(
    "Form: reverseRecord (REV, REVERSE)",
    formRev.requestType === CbsRequestType.REV &&
      formRev.recordFunction === CbsRecordFunction.REVERSE,
  );

  // --- 4. Inquiry Payloads & Queries (cbs.inquiry) ---
  console.log("\n--- 4. Inquiry Payloads & Runtime Queries ---");
  // 4.1 Custom Pagination & Query String
  const inqCustom = cbs.inquiry.executeQuery("GET.CUSTOMER", {
    curPage: 3,
    perPage: 25,
    queryString: [
      { selectFieldName: "BRANCH", selectFieldOperator: "EQ", selectFieldValue: "1001" },
    ],
  });
  assert(
    "Inquiry: executeQuery custom pagination",
    inqCustom.requestType === CbsRequestType.INQ &&
      (inqCustom.data as Record<string, unknown>)?.curPage === 3 &&
      (inqCustom.data as Record<string, unknown>)?.perPage === 25,
  );
  assert(
    "Inquiry: executeQuery queryString filters",
    Array.isArray((inqCustom.data as Record<string, unknown>)?.queryString),
  );

  // 4.2 Default Pagination
  const inqDefault = cbs.inquiry.executeQuery("GET.ALL.LOANS");
  assert(
    "Inquiry: executeQuery default curPage = 1",
    (inqDefault.data as Record<string, unknown>)?.curPage === 1,
  );
  assert(
    "Inquiry: executeQuery default perPage = 1000",
    (inqDefault.data as Record<string, unknown>)?.perPage === 1000,
  );

  // 4.3 Fetch Single Record
  const inqSingle = cbs.inquiry.fetchSingleRecord("ACCOUNT.STATEMENT", "REC-888");
  assert(
    "Inquiry: fetchSingleRecord (INQ, SEE)",
    inqSingle.requestType === CbsRequestType.INQ && inqSingle.recordId === "REC-888",
  );

  // 4.4 Inherited Base Model CRUD on INQUIRY.CONFIG table
  const inqBaseGet = cbs.inquiry.get("INQ.CUST.LIST");
  assert(
    "Inquiry: Inherited base get (GET, SEE, INQUIRY.CONFIG)",
    inqBaseGet.requestType === CbsRequestType.GET &&
      inqBaseGet.controlName === CbsControlTable.INQUIRY_CONFIG,
  );

  const inqBaseList = cbs.inquiry.list();
  assert(
    "Inquiry: Inherited base list (GRL, LIST, INQUIRY.CONFIG)",
    inqBaseList.requestType === CbsRequestType.GRL &&
      inqBaseList.controlName === CbsControlTable.INQUIRY_CONFIG,
  );

  // --- 5. Menu & Visual Tree Payloads (cbs.menu) ---
  console.log("\n--- 5. Menu & Visual Tree Payloads (cbs.menu) ---");
  // 5.1 Menu Catalog Items (SC.MENU)
  assert(
    "Menu: getCatalogList (GRL, LIST, SC.MENU)",
    cbs.menu.getCatalogList().requestType === CbsRequestType.GRL &&
      cbs.menu.getCatalogList().controlName === CbsControlTable.MENU,
  );
  assert(
    "Menu: getMenuItem (GET, SEE, SC.MENU)",
    cbs.menu.getMenuItem("M1").recordId === "M1" &&
      cbs.menu.getMenuItem("M1").controlName === CbsControlTable.MENU,
  );
  assert(
    "Menu: saveMenuItem (PUT, INPUT, SC.MENU)",
    cbs.menu.saveMenuItem("M1", { title: "Deposit" }).requestType === CbsRequestType.PUT,
  );
  assert(
    "Menu: authorizeMenuItem (AUT, AUTHORIZE, SC.MENU)",
    cbs.menu.authorizeMenuItem("M1").requestType === CbsRequestType.AUT,
  );
  assert(
    "Menu: deleteMenuItem (PUT, DELETE, SC.MENU)",
    cbs.menu.deleteMenuItem("M1").requestType === CbsRequestType.PUT &&
      cbs.menu.deleteMenuItem("M1").recordFunction === CbsRecordFunction.DELETE,
  );

  // 5.2 Hierarchical Menu Tree (SC.MENU.TREE)
  assert(
    "MenuTree: getTreeList (GRL, LIST, SC.MENU.TREE)",
    cbs.menu.getTreeList().requestType === CbsRequestType.GRL &&
      cbs.menu.getTreeList().controlName === CbsControlTable.MENU_TREE,
  );
  assert(
    "MenuTree: getMenuTree defaults to MAIN_MENU",
    cbs.menu.getMenuTree().recordId === "MAIN_MENU",
  );
  assert(
    "MenuTree: getMenuTree with custom treeId",
    cbs.menu.getMenuTree("SIDE_NAV").recordId === "SIDE_NAV",
  );
  assert(
    "MenuTree: saveMenuTree (PUT, INPUT, SC.MENU.TREE)",
    cbs.menu.saveMenuTree("MAIN_MENU", [{ id: "1" }]).requestType === CbsRequestType.PUT,
  );
  assert(
    "MenuTree: authorizeMenuTree (AUT, AUTHORIZE)",
    cbs.menu.authorizeMenuTree("MAIN_MENU").requestType === CbsRequestType.AUT,
  );
  assert(
    "MenuTree: deleteMenuTree (PUT, DELETE)",
    cbs.menu.deleteMenuTree("MAIN_MENU").requestType === CbsRequestType.PUT &&
      cbs.menu.deleteMenuTree("MAIN_MENU").recordFunction === CbsRecordFunction.DELETE,
  );

  // --- 6. User Security Payloads (cbs.userSecurity) ---
  console.log("\n--- 6. User Security Payloads (cbs.userSecurity) ---");

  const changePass = cbs.userSecurity.changePassword({ currPass: "old123", newPass: "new123" });
  assert(
    "UserSecurity: changePassword (CPW)",
    changePass.requestType === CbsRequestType.CPW &&
      (changePass.data as Record<string, unknown>)?.newPass === "new123",
  );

  const changeSignOn = cbs.userSecurity.changeSignOnName({
    oldUserName: "teller1",
    newUserName: "senior_teller1",
    password: "pwd",
  });
  assert(
    "UserSecurity: changeSignOnName (CUN)",
    changeSignOn.requestType === CbsRequestType.CUN &&
      (changeSignOn.data as Record<string, unknown>)?.newUserName === "senior_teller1",
  );

  // --- 7. Transport Dispatcher & Pre-Flight Validation (cbs.send) ---
  console.log("\n--- 7. Transport Dispatcher & Pre-Flight Validation ---");

  // 7.1 Client-Side Pre-Flight Validation Failure (Fail-Fast)
  try {
    const malformedPayload: CbsWirePayload = { requestType: "" };
    await sendCbsRequest(malformedPayload, { silent: true });
    assert("Pre-Flight: Throws on invalid payload", false);
  } catch (err: unknown) {
    const isValidationError =
      err instanceof Error && err.message.includes("CLIENT_VALIDATION_ERROR");
    assert("Pre-Flight: Rejects malformed payload before network dispatch", isValidationError);
  }

  // 7.2 Mock Network Dispatch Matrix
  const originalFetch = globalThis.fetch;
  try {
    // 7.2.1 HTTP 200 SUCCESS
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ status: "SUCCESS", data: { accountNo: "10001", balance: 50000 } }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );

    const successRes = await cbs.send(cbs.form.fetchRecord("ACCOUNT", "10001"), { silent: true });
    assert(
      "Transport: HTTP 200 SUCCESS returns parsed response envelope",
      successRes.status === "SUCCESS" &&
        (successRes.data as Record<string, unknown>)?.accountNo === "10001",
    );

    // 7.2.2 Runtime Zod responseSchema Validation (Passing)
    const validAccountSchema = z.object({ accountNo: z.string(), balance: z.number() });
    const validatedRes = await cbs.send(cbs.form.fetchRecord("ACCOUNT", "10001"), {
      silent: true,
      responseSchema: validAccountSchema,
    });
    assert(
      "Transport: Valid response conforms to responseSchema",
      validatedRes.status === "SUCCESS",
    );

    // 7.2.3 Runtime Zod responseSchema Validation (Failing)
    try {
      const invalidAccountSchema = z.object({ accountNo: z.number(), balance: z.string() }); // mismatch types
      await cbs.send(cbs.form.fetchRecord("ACCOUNT", "10001"), {
        silent: true,
        responseSchema: invalidAccountSchema,
      });
      assert("Transport: Schema mismatch should reject", false);
    } catch (err: unknown) {
      const isSchemaError = err instanceof Error && err.message.includes("RESPONSE_SCHEMA_ERROR");
      assert("Transport: Response schema mismatch throws RESPONSE_SCHEMA_ERROR", isSchemaError);
    }

    // 7.2.4 HTTP 401 Session Expired
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ message: "Session expired" }), { status: 401 });

    try {
      await cbs.send(cbs.form.fetchRecord("ACCOUNT", "10001"), { silent: true });
      assert("Transport: 401 must throw UNAUTHORIZED", false);
    } catch (err: unknown) {
      assert(
        "Transport: 401 translates cleanly to UNAUTHORIZED exception",
        err instanceof Error && err.message === "UNAUTHORIZED",
      );
    }

    // 7.2.5 RECORD_NOT_FOUND Status Envelope
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({ status: "RECORD_NOT_FOUND", message: "Account 999 not found" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );

    const notFoundRes = await cbs.send(cbs.form.fetchRecord("ACCOUNT", "999"), { silent: true });
    assert(
      "Transport: RECORD_NOT_FOUND status envelope parsed gracefully",
      notFoundRes.status === "RECORD_NOT_FOUND",
    );

    // 7.2.6 AbortSignal Cancellation
    const abortController = new AbortController();
    abortController.abort();
    globalThis.fetch = async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    };

    try {
      await cbs.send(cbs.form.fetchRecord("ACCOUNT", "10001"), {
        silent: true,
        signal: abortController.signal,
      });
      assert("Transport: Aborted signal should throw AbortError", false);
    } catch (err: unknown) {
      assert(
        "Transport: Aborted request surfaces AbortError without error toast",
        err instanceof DOMException && err.name === "AbortError",
      );
    }
  } finally {
    globalThis.fetch = originalFetch;
  }

  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(
      `ALL ${reports.length} WIRE FACTORY & TRANSPORT TEST CASES PASSED WITH 100% SUCCESS!`,
    );
  } else {
    console.error("SOME WIRE FACTORY TESTS FAILED!");
    process.exit(1);
  }
  console.log("========================================================\n");
}

runSuite().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});

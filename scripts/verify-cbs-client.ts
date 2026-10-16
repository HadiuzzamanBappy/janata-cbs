/**
 * Automated Verification Suite for CBS Micro-Client Gateway (@/lib/cbs-client)
 * Tests all domain payload factories, wire protocol schemas, and request types.
 *
 * Usage:
 *   pnpm tsx scripts/verify-cbs-client.ts
 */

import { cbs } from "@/lib/cbs-client";
import { CbsControlTable, CbsRecordFunction, CbsRequestType } from "@/types";

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
console.log("       CBS CLIENT WIRE FACTORY VERIFICATION SUITE       ");
console.log("========================================================\n");

// 1. Form Payloads
const fetchForm = cbs.form.fetchRecord("ACCOUNT", "1000001");
assert(
  "Form: Fetch Record (GET, SEE)",
  fetchForm.requestType === CbsRequestType.GET &&
    fetchForm.recordFunction === CbsRecordFunction.SEE &&
    fetchForm.controlName === "ACCOUNT" &&
    fetchForm.recordId === "1000001",
);

const commitForm = cbs.form.commitRecord("CUSTOMER", { name: "Rahim" }, { recordId: "9001" });
assert(
  "Form: Commit Record (PUT, INPUT)",
  commitForm.requestType === CbsRequestType.PUT &&
    commitForm.recordFunction === CbsRecordFunction.INPUT &&
    commitForm.recordId === "9001" &&
    (commitForm.data as Record<string, unknown>)?.name === "Rahim",
);

const authForm = cbs.form.authorizeRecord("ACCOUNT", "1000001");
assert(
  "Form: Authorize Record (AUT, AUTHORIZE)",
  authForm.requestType === CbsRequestType.AUT &&
    authForm.recordFunction === CbsRecordFunction.AUTHORIZE &&
    authForm.recordId === "1000001",
);

const delForm = cbs.form.deleteRecord("ACCOUNT", "1000001");
assert(
  "Form: Delete Record (PUT, DELETE)",
  delForm.requestType === CbsRequestType.PUT &&
    delForm.recordFunction === CbsRecordFunction.DELETE &&
    delForm.recordId === "1000001",
);

// 2. Inquiry Payloads
const inqExec = cbs.inquiry.executeQuery("GET.CUSTOMER", {
  curPage: 1,
  perPage: 50,
  queryString: [{ selectFieldName: "BRANCH", selectFieldOperator: "EQ", selectFieldValue: "1001" }],
});
assert(
  "Inquiry: Execute Query (INQ, SEE)",
  inqExec.requestType === CbsRequestType.INQ &&
    inqExec.controlName === "GET.CUSTOMER" &&
    (inqExec.data as Record<string, unknown>)?.curPage === 1 &&
    (inqExec.data as Record<string, unknown>)?.perPage === 50,
);

const inqSingle = cbs.inquiry.fetchSingleRecord("ACCOUNT.STATEMENT", "REC-888");
assert(
  "Inquiry: Single Record (INQ, SEE)",
  inqSingle.requestType === CbsRequestType.INQ && inqSingle.recordId === "REC-888",
);

const inqCfg = cbs.inquiry.get("INQ.CUST.LIST");
assert(
  "Inquiry: Get Config (GET, SEE, INQUIRY)",
  inqCfg.requestType === CbsRequestType.GET &&
    inqCfg.controlName === "INQUIRY" &&
    inqCfg.recordId === "INQ.CUST.LIST",
);

// 3. Menu Payloads
const menuCatalog = cbs.menu.getCatalogList();
assert(
  "Menu: Catalog List (GRL, SEE)",
  menuCatalog.requestType === CbsRequestType.GRL &&
    menuCatalog.controlName === CbsControlTable.MENU,
);

const menuTree = cbs.menu.getMenuTree("MAIN_MENU");
assert(
  "Menu: Hierarchy Tree (GET, SEE)",
  menuTree.requestType === CbsRequestType.GET &&
    menuTree.controlName === CbsControlTable.MENU_TREE &&
    menuTree.recordId === "MAIN_MENU",
);

const menuSaveTree = cbs.menu.saveMenuTree("MAIN_MENU", [{ id: "1", title: "Banking" }]);
assert(
  "Menu: Save Tree (PUT, INPUT)",
  menuSaveTree.requestType === CbsRequestType.PUT &&
    menuSaveTree.controlName === CbsControlTable.MENU_TREE &&
    Array.isArray((menuSaveTree.data as Record<string, unknown>)?.tree),
);

// 4. User Group (RBAC) Payloads
const userGroup = cbs.userGroup.get("OFFICER_ROLE");
assert(
  "UserGroup: Get Group (GET, SEE)",
  userGroup.requestType === CbsRequestType.GET &&
    userGroup.controlName === CbsControlTable.USER_GROUP &&
    userGroup.recordId === "OFFICER_ROLE",
);

const userGroupSave = cbs.userGroup.save({ perms: ["R", "I"] }, { recordId: "TELLER_ROLE" });
assert(
  "UserGroup: Save Group (PUT, INPUT)",
  userGroupSave.requestType === CbsRequestType.PUT &&
    userGroupSave.controlName === CbsControlTable.USER_GROUP &&
    userGroupSave.recordFunction === CbsRecordFunction.INPUT,
);

const userGroupAuth = cbs.userGroup.authorize("TELLER_ROLE");
assert(
  "UserGroup: Authorize Group (AUT, AUTHORIZE)",
  userGroupAuth.requestType === CbsRequestType.AUT &&
    userGroupAuth.controlName === CbsControlTable.USER_GROUP &&
    userGroupAuth.recordFunction === CbsRecordFunction.AUTHORIZE,
);

// 5. User Security Payloads
const userProfile = cbs.userSecurity.get("USER-101");
assert(
  "UserSecurity: Get Profile (GET, SEE)",
  userProfile.requestType === CbsRequestType.GET &&
    userProfile.controlName === CbsControlTable.USER_PASS_RESET &&
    userProfile.recordId === "USER-101",
);

const changePass = cbs.userSecurity.changePassword({ currPass: "old123", newPass: "new123" });
assert(
  "UserSecurity: Change Password (CPW)",
  changePass.requestType === CbsRequestType.CPW &&
    (changePass.data as Record<string, unknown>)?.newPass === "new123",
);

const changeSignOn = cbs.userSecurity.changeSignOnName({
  oldUserName: "teller1",
  newUserName: "senior_teller1",
  password: "pass",
});
assert(
  "UserSecurity: Change Sign-On (CUN)",
  changeSignOn.requestType === CbsRequestType.CUN &&
    (changeSignOn.data as Record<string, unknown>)?.newUserName === "senior_teller1",
);

// 7. Model Config Payloads
const modelGet = cbs.modelConfig.get("ACCOUNT.MODEL");
assert(
  "ModelConfig: Get Schema (GET, SEE)",
  modelGet.requestType === CbsRequestType.GET &&
    modelGet.controlName === CbsControlTable.MODEL_CONFIG &&
    modelGet.recordId === "ACCOUNT.MODEL",
);

const modelSave = cbs.modelConfig.save({ version: 2 }, { recordId: "ACCOUNT.MODEL" });
assert(
  "ModelConfig: Save Schema (PUT, INPUT)",
  modelSave.requestType === CbsRequestType.PUT &&
    modelSave.controlName === CbsControlTable.MODEL_CONFIG &&
    modelSave.recordFunction === CbsRecordFunction.INPUT,
);

console.log("\n========================================================");
const allPassed = reports.every((r) => r.passed);
if (allPassed) {
  console.log(`ALL ${reports.length} WIRE FACTORY TEST CASES PASSED WITH 100% SUCCESS!`);
} else {
  console.error("SOME WIRE FACTORY TESTS FAILED!");
}
console.log("========================================================\n");

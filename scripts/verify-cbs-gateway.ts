/**
 * CBS Command Gateway Automated Verification Suite
 * Validates all grammar rules, RIDASH security enforcement, and alias resolution.
 */

import { cbsCommand } from "../src/lib/cbs-command";

interface TestReport {
  name: string;
  passed: boolean;
  details?: string;
}

const reports: TestReport[] = [];

function assert(name: string, condition: boolean, details?: string) {
  reports.push({ name, passed: condition, details });
  const status = condition ? "PASS" : "FAIL";
  console.log(`[${status}] ${name}${details ? ` -> ${details}` : ""}`);
}

console.log("\n========================================================");
console.log("       CBS COMMAND GATEWAY VERIFICATION SUITE           ");
console.log("========================================================\n");

// 1. Base Application
const base = cbsCommand.parse("USER");
assert("Base Application (USER)", base.type === "FORM" && base.application === "USER" && base.screenMode === "IDLE" && base.authLevel === 1);

// 2. Comma Auto-Auth (Admin Direct Entry)
const comma = cbsCommand.parse("USER,");
assert("Comma Auto-Auth (USER,)", comma.isCommaVersion === true && comma.authLevel === 0 && comma.screenMode === "CREATE" && comma.functionCode === "I");

// 3. Named Version
const version = cbsCommand.parse("USER,1001");
assert("Named Version (USER,1001)", version.application === "USER" && version.version === "1001" && version.screenMode === "IDLE");

// 4. Record Lookup
const lookup = cbsCommand.parse("USER 1001");
assert("Record Lookup (USER 1001)", lookup.application === "USER" && lookup.recordId === "1001" && lookup.screenMode === "EDIT");

// 5. Explicit Function Code (RIDASH Input)
const fnInput = cbsCommand.parse("USER I 1001");
assert("Explicit Function Input (USER I 1001)", fnInput.functionCode === "I" && fnInput.screenMode === "CREATE" && fnInput.recordId === "1001");

// 6. Explicit Function Code (RIDASH See)
const fnSee = cbsCommand.parse("USER S 1001");
assert("Explicit Function See (USER S 1001)", fnSee.functionCode === "S" && fnSee.screenMode === "VIEW" && fnSee.recordId === "1001");

// 7. Composite Record ID (Accounting history stamp)
const composite = cbsCommand.parse("ACCOUNT S 1000001;2");
assert("Composite Record ID (ACCOUNT S 1000001;2)", composite.functionCode === "S" && composite.recordId === "1000001;2");

// 8. Inquiry (Standard)
const inq = cbsCommand.parse("INQ GET.EMP.INFO");
assert("Inquiry (INQ GET.EMP.INFO)", inq.type === "INQUIRY" && inq.application === "GET.EMP.INFO" && inq.screenMode === "VIEW");

// 9. Inquiry with Explicit Function Code
const inqFn = cbsCommand.parse("INQ S GET.CUSTOMER");
assert("Inquiry with Function (INQ S GET.CUSTOMER)", inqFn.type === "INQUIRY" && inqFn.functionCode === "S" && inqFn.application === "GET.CUSTOMER");

// 10. Shorthand 1:1 Aliases
assert("Alias MD -> SC.MENU.DESIGN", cbsCommand.resolveAlias("MD") === "SC.MENU.DESIGN");
assert("Alias UG -> SC.USER.GROUP", cbsCommand.resolveAlias("UG") === "SC.USER.GROUP");
assert("Alias COB -> SC.COB.REGISTRY", cbsCommand.resolveAlias("COB") === "SC.COB.REGISTRY");
assert("Alias PR -> SC.USER.PASS.RESET", cbsCommand.resolveAlias("PR") === "SC.USER.PASS.RESET");
assert("Alias ID -> SC.INQUIRY", cbsCommand.resolveAlias("ID") === "SC.INQUIRY");
assert("Alias RS -> SC.REPORT.DESIGN", cbsCommand.resolveAlias("RS") === "SC.REPORT.DESIGN");
assert("Alias PWD -> USER.CHANGE.PASS", cbsCommand.resolveAlias("PWD") === "USER.CHANGE.PASS");

// 11. Settings Dialog
const settings = cbsCommand.parse("SETTINGS:PROFILE");
assert("Settings Dialog (SETTINGS:PROFILE)", settings.type === "SETTINGS" && settings.settingsTabId === "profile");

// 12. Quick Action (Theme & Logout)
const dark = cbsCommand.parse("DARK");
assert("Quick Action (DARK)", dark.type === "ACTION" && dark.actionId === "toggle_theme");
const logout = cbsCommand.parse("LOGOUT");
assert("Quick Action (LOGOUT)", logout.type === "ACTION" && logout.actionId === "logout");

// 13. Security Validation: Allowed User
const userWithRights = {
  userId: "OFFICER1",
  commandLine: true,
  accessibility: "RIDASH",
};
const secAllowed = cbsCommand.validate(fnInput, userWithRights);
assert("Security RBAC: Clearance Allowed", secAllowed.allowed === true);

// 14. Security Validation: Denied User (User lacks Delete 'D' rights)
const userReadSeeOnly = {
  userId: "TELLER1",
  commandLine: true,
  accessibility: "RS",
};
const deleteCmd = cbsCommand.parse("USER D 1001");
const secDenied = cbsCommand.validate(deleteCmd, userReadSeeOnly);
assert("Security RBAC: Clearance Denied", secDenied.allowed === false && secDenied.requiredRight === "D");

// 15. Security Validation: Terminal Disabled User
const userNoTerminal = {
  userId: "GUEST",
  commandLine: false,
  accessibility: "RIDASH",
};
const secNoTerminal = cbsCommand.validate(base, userNoTerminal);
assert("Security RBAC: Terminal Blocked", secNoTerminal.allowed === false);

console.log("\n========================================================");
const allPassed = reports.every((r) => r.passed);
if (allPassed) {
  console.log(`ALL ${reports.length} TEST CASES PASSED WITH 100% SUCCESS!`);
} else {
  console.error("SOME TESTS FAILED!");
}
console.log("========================================================\n");

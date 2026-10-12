/**
 * Automated Verification Suite for CBS Access Control & Capabilities (@/lib/cbs-access)
 * Tests RIDASHL capabilities, record guard rules, and individual permission flags.
 *
 * Usage:
 *   pnpm tsx scripts/verify-cbs-access.ts
 */

import {
  evaluateCbsAccess,
  hasAccessibilityRight,
  parseAccessibilityRights,
} from "@/lib/cbs-access";
import { CBS_RECORD_FUNCTIONS } from "@/types/cbs";

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
console.log("       CBS ACCESS CONTROL & RIDASHL SUITE               ");
console.log("========================================================\n");

// 1. Full Administrator Access Profile (RIDASHL) - Base Capability Checks
const fullRights = parseAccessibilityRights("RIDASHL");
const fullAccess = evaluateCbsAccess({ grantedRights: fullRights });
assert("Full Access: canSee", fullAccess.canSee === true);
assert("Full Access: canInput", fullAccess.canInput === true);
assert("Full Access: hasFunctionRight('D')", fullAccess.hasFunctionRight("D") === true);
assert("Full Access: hasFunctionRight('A')", fullAccess.hasFunctionRight("A") === true);
assert("Full Access: hasFunctionRight('R')", fullAccess.hasFunctionRight("R") === true);
assert("Full Access: hasFunctionRight('H')", fullAccess.hasFunctionRight("H") === true);
assert("Full Access: canList (New Function 'L')", fullAccess.canList === true);
assert("Full Access: hasFunctionRight('L')", fullAccess.hasFunctionRight("L") === true);

// 2. Lifecycle Context: Active Pending Record (INA) with Delete and Authorize permitted
const pendingRecordAccess = evaluateCbsAccess({
  userId: "AD028459",
  recordInputter: "ZZ028459", // Different user (Passes Four-Eyes)
  recordStatus: "INA",
  mode: "I",
  grantedRights: fullRights,
});
assert(
  "Pending Record: canAuthorize (Passes Four-Eyes & INA status)",
  pendingRecordAccess.canAuthorize === true,
);
assert("Pending Record: canDelete", pendingRecordAccess.canDelete === true);
assert("Pending Record: canHold", pendingRecordAccess.canHold === true);

// 3. Lifecycle Context: Live Authorized Record (AU) with Reverse permitted
const liveRecordAccess = evaluateCbsAccess({
  userId: "AD028459",
  recordStatus: "AU",
  mode: "S",
  grantedRights: fullRights,
});
assert("Live Record: canReverse (AU status)", liveRecordAccess.canReverse === true);
assert(
  "Live Record: canDelete is false (Cannot delete live AU record)",
  liveRecordAccess.canDelete === false,
);
assert(
  "Live Record: canAuthorize is false (Already authorized)",
  liveRecordAccess.canAuthorize === false,
);

// 4. Legacy Profile (RIDASH without 'L')
const legacyRights = parseAccessibilityRights("RIDASH");
const legacyAccess = evaluateCbsAccess({ grantedRights: legacyRights });
assert("Legacy Access: canSee", legacyAccess.canSee === true);
assert("Legacy Access: canInput", legacyAccess.canInput === true);
assert("Legacy Access: canList is false", legacyAccess.canList === false);

// 5. Read-Only / Inquiry Profile (R---S-L)
const lookupRights = parseAccessibilityRights("R---S-L");
const lookupOnly = evaluateCbsAccess({ grantedRights: lookupRights });
assert("Lookup Profile: canSee", lookupOnly.canSee === true);
assert("Lookup Profile: canList", lookupOnly.canList === true);
assert("Lookup Profile: canInput is false", lookupOnly.canInput === false);
assert("Lookup Profile: isReadOnly", lookupOnly.isReadOnly === true);

// 4. Maker-Checker Four-Eyes Compliance Check
const makerCheckerViolation = evaluateCbsAccess({
  userId: "ZZ028459",
  recordInputter: "ZZ028459",
  recordStatus: "INA",
  grantedRights: fullRights,
});
assert(
  "Four-Eyes Violation Detected (Inputter === Maker)",
  makerCheckerViolation.isFourEyesViolation === true,
);
assert("Four-Eyes Blocks Authorization", makerCheckerViolation.canAuthorize === false);
assert(
  "Four-Eyes Provides Tooltip Explanation",
  Boolean(makerCheckerViolation.getDisableReason("A")?.includes("Maker/Inputter cannot authorize")),
);

// 5. hasAccessibilityRight Predicate Helper
assert(
  "hasAccessibilityRight(S) in RIDASHL",
  hasAccessibilityRight(fullRights, CBS_RECORD_FUNCTIONS.SEE) === true,
);
assert(
  "hasAccessibilityRight(L) in RIDASHL",
  hasAccessibilityRight(fullRights, CBS_RECORD_FUNCTIONS.LIST) === true,
);
assert(
  "hasAccessibilityRight(L) in RIDASH is false",
  hasAccessibilityRight(legacyRights, CBS_RECORD_FUNCTIONS.LIST) === false,
);
assert(
  "hasAccessibilityRight(D) in lookup profile is false",
  hasAccessibilityRight(lookupRights, CBS_RECORD_FUNCTIONS.DELETE) === false,
);

console.log("\n========================================================");
const allPassed = reports.every((r) => r.passed);
if (allPassed) {
  console.log(`ALL ${reports.length} ACCESS CONTROL TEST CASES PASSED WITH 100% SUCCESS!`);
} else {
  console.error("SOME ACCESS TESTS FAILED!");
  process.exit(1);
}
console.log("========================================================\n");

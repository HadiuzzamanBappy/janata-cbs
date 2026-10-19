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
import { CbsRecordFunction } from "@/types/cbs";

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

// 1. Accessibility Profile Parser Matrix
console.log("--- 1. Accessibility Profile Parser Matrix ---");
// 1.1 Empty / Null / Undefined
assert("Parser: null input returns empty array", parseAccessibilityRights(null).length === 0);
assert(
  "Parser: undefined input returns empty array",
  parseAccessibilityRights(undefined).length === 0,
);
assert("Parser: empty string returns empty array", parseAccessibilityRights("").length === 0);

// 1.2 Keyword Expansions ("FULL", "ALL")
assert(
  "Parser: 'FULL' expands to all 7 canonical codes",
  parseAccessibilityRights("FULL").length === 7 &&
    parseAccessibilityRights("FULL").includes(CbsRecordFunction.LIST),
);
assert(
  "Parser: 'ALL' expands to all 7 canonical codes",
  parseAccessibilityRights("ALL").length === 7 &&
    parseAccessibilityRights("ALL").includes(CbsRecordFunction.LIST),
);

// 1.3 Case Insensitivity & Whitespace Trimming
const trimmedRights = parseAccessibilityRights("  ridashl  ");
assert("Parser: trimmed lowercase '  ridashl  ' parses all 7 rights", trimmedRights.length === 7);

// 1.4 Deduplication of repeat codes
const dedupedRights = parseAccessibilityRights("RRIIIDDD");
assert(
  "Parser: repeated 'RRIIIDDD' is deduplicated to 3 unique rights",
  dedupedRights.length === 3,
);

// 1.5 Array Input & Filtering
const arrayRights = parseAccessibilityRights(["r", "i", "invalid", "s", "d"]);
assert(
  "Parser: array input correctly normalizes, filters invalid items, and retains valid rights",
  arrayRights.length === 4 && !arrayRights.includes("INVALID" as CbsRecordFunction),
);

// 2. Full Administrator Access Profile (RIDASHL) - Base Capability Checks
console.log("\n--- 2. Full Access Capability Checks ---");
const fullRights = parseAccessibilityRights("RIDASHL");
const fullAccess = evaluateCbsAccess({ grantedRights: fullRights });
assert("Full Access: canSee", fullAccess.canSee === true);
assert("Full Access: canInput", fullAccess.canInput === true);
assert(
  "Full Access: hasFunctionRight('D')",
  fullAccess.hasFunctionRight(CbsRecordFunction.DELETE) === true,
);
assert(
  "Full Access: hasFunctionRight('A')",
  fullAccess.hasFunctionRight(CbsRecordFunction.AUTHORIZE) === true,
);
assert(
  "Full Access: hasFunctionRight('R')",
  fullAccess.hasFunctionRight(CbsRecordFunction.REVERSE) === true,
);
assert(
  "Full Access: hasFunctionRight('H')",
  fullAccess.hasFunctionRight(CbsRecordFunction.HISTORY) === true,
);
assert("Full Access: canList (Function 'L')", fullAccess.canList === true);
assert(
  "Full Access: hasFunctionRight('L')",
  fullAccess.hasFunctionRight(CbsRecordFunction.LIST) === true,
);

// 3. IDLE Mode Operational Inactivity Guards
console.log("\n--- 3. IDLE Mode Operational Guards ---");
assert("IDLE Mode: canDelete is false (requires active mode)", fullAccess.canDelete === false);
assert("IDLE Mode: canHold is false (requires active mode)", fullAccess.canHold === false);
assert(
  "IDLE Mode: canAuthorize is false (requires active mode)",
  fullAccess.canAuthorize === false,
);
assert("IDLE Mode: canReverse is false (requires active mode)", fullAccess.canReverse === false);

// 4. Lifecycle Context: Active Pending Record (INA)
console.log("\n--- 4. Active Pending Record (INA) ---");
const pendingRecordAccess = evaluateCbsAccess({
  userId: "AD028459",
  recordInputter: "ZZ028459", // Different user (Passes Four-Eyes)
  recordStatus: "INA",
  mode: "I",
  grantedRights: fullRights,
});
assert("Pending Record (INA): canAuthorize is true", pendingRecordAccess.canAuthorize === true);
assert("Pending Record (INA): canDelete is true", pendingRecordAccess.canDelete === true);
assert("Pending Record (INA): canHold is true", pendingRecordAccess.canHold === true);
assert(
  "Pending Record (INA): canReverse is false (not AU)",
  pendingRecordAccess.canReverse === false,
);

// 5. Lifecycle Context: Live Authorized Record (AU)
console.log("\n--- 5. Live Authorized Record (AU) ---");
const liveRecordAccess = evaluateCbsAccess({
  userId: "AD028459",
  recordStatus: "AU",
  mode: "S",
  grantedRights: fullRights,
});
assert("Live Record (AU): canReverse is true", liveRecordAccess.canReverse === true);
assert(
  "Live Record (AU): canDelete is false (cannot delete live record)",
  liveRecordAccess.canDelete === false,
);
assert(
  "Live Record (AU): canAuthorize is false (already authorized)",
  liveRecordAccess.canAuthorize === false,
);
assert(
  "Live Record (AU): canHold is false (cannot hold AU record)",
  liveRecordAccess.canHold === false,
);

// 6. Legacy Profile (RIDASH without 'L')
console.log("\n--- 6. Legacy Profile (RIDASH without 'L') ---");
const legacyRights = parseAccessibilityRights("RIDASH");
const legacyAccess = evaluateCbsAccess({ grantedRights: legacyRights });
assert("Legacy Access: canSee is true", legacyAccess.canSee === true);
assert("Legacy Access: canInput is true", legacyAccess.canInput === true);
assert("Legacy Access: canList is false", legacyAccess.canList === false);

// 7. Read-Only / Inquiry Profile (R---S-L)
console.log("\n--- 7. Read-Only / Lookup Profile (R---S-L) ---");
const lookupRights = parseAccessibilityRights("R---S-L");
const lookupOnly = evaluateCbsAccess({ grantedRights: lookupRights });
assert("Lookup Profile: canSee is true", lookupOnly.canSee === true);
assert("Lookup Profile: canList is true", lookupOnly.canList === true);
assert("Lookup Profile: canInput is false", lookupOnly.canInput === false);
assert("Lookup Profile: isReadOnly is true (lacks 'I')", lookupOnly.isReadOnly === true);

// 8. Screen Mode Read-Only Matrix
console.log("\n--- 8. Screen Mode Read-Only Matrix ---");
assert(
  "Screen Mode 'S' is Read-Only",
  evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.SEE }).isReadOnly === true,
);
assert(
  "Screen Mode 'H' is Read-Only",
  evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.HISTORY }).isReadOnly ===
    true,
);
assert(
  "Screen Mode 'A' is Read-Only",
  evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.AUTHORIZE }).isReadOnly ===
    true,
);
assert(
  "Screen Mode 'D' is Read-Only",
  evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.DELETE }).isReadOnly ===
    true,
);
assert(
  "Screen Mode 'R' is Read-Only",
  evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.REVERSE }).isReadOnly ===
    true,
);
assert(
  "Screen Mode 'I' with 'I' right is NOT Read-Only",
  evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.INPUT }).isReadOnly ===
    false,
);

// 9. Maker-Checker Four-Eyes Compliance & Normalization
console.log("\n--- 9. Maker-Checker Four-Eyes Compliance ---");
const makerCheckerViolation = evaluateCbsAccess({
  userId: " zz028459 ",
  recordInputter: "ZZ028459", // Normalized case & whitespace
  recordStatus: "INA",
  mode: "A",
  grantedRights: fullRights,
});
assert(
  "Four-Eyes: Case & whitespace insensitive match detected",
  makerCheckerViolation.isFourEyesViolation === true,
);
assert("Four-Eyes: Blocks Authorization", makerCheckerViolation.canAuthorize === false);
assert(
  "Four-Eyes: Provides Tooltip Explanation",
  Boolean(
    makerCheckerViolation
      .getDisableReason(CbsRecordFunction.AUTHORIZE)
      ?.includes("Maker/Inputter cannot authorize"),
  ),
);

// 10. getDisableReason Comprehensive Diagnostic Explanations
console.log("\n--- 10. getDisableReason Tooltip Explanations ---");
// 10.1 Missing Capability Right
const lackingUser = evaluateCbsAccess({ grantedRights: [CbsRecordFunction.SEE] });
assert(
  "getDisableReason: Missing right gives access denied explanation",
  Boolean(
    lackingUser
      .getDisableReason(CbsRecordFunction.AUTHORIZE)
      ?.includes("Access Denied: Missing 'A' capability"),
  ),
);

// 10.2 Authorize on Non-INA record
const nonInaAuth = evaluateCbsAccess({
  userId: "AD028459",
  recordInputter: "ZZ028459",
  recordStatus: "AU",
  mode: "A",
  grantedRights: fullRights,
});
assert(
  "getDisableReason: Authorize on AU record explains status must be INA",
  Boolean(
    nonInaAuth.getDisableReason(CbsRecordFunction.AUTHORIZE)?.includes("must be pending 'INA'"),
  ),
);

// 10.3 Delete on Live AU record
const liveDelete = evaluateCbsAccess({
  userId: "AD028459",
  recordStatus: "AU",
  mode: "D",
  grantedRights: fullRights,
});
assert(
  "getDisableReason: Delete on AU record directs to Reverse ('R')",
  Boolean(
    liveDelete.getDisableReason(CbsRecordFunction.DELETE)?.includes("Use Reverse ('R') instead"),
  ),
);

// 10.4 Reverse on Non-AU record
const inaReverse = evaluateCbsAccess({
  userId: "AD028459",
  recordStatus: "INA",
  mode: "R",
  grantedRights: fullRights,
});
assert(
  "getDisableReason: Reverse on INA record explains status must be live 'AU'",
  Boolean(inaReverse.getDisableReason(CbsRecordFunction.REVERSE)?.includes("must be live 'AU'")),
);

// 10.5 Input in Read-Only mode
const roInput = evaluateCbsAccess({
  userId: "AD028459",
  mode: CbsRecordFunction.SEE,
  grantedRights: fullRights,
});
assert(
  "getDisableReason: Input on View mode explains screen is Read-Only",
  Boolean(
    roInput.getDisableReason(CbsRecordFunction.INPUT)?.includes("Screen is in Read-Only mode"),
  ),
);

// 10.6 Permitted action returns null
assert(
  "getDisableReason: Valid permitted action returns null",
  pendingRecordAccess.getDisableReason(CbsRecordFunction.AUTHORIZE) === null,
);

// 11. hasAccessibilityRight Predicate Helper
console.log("\n--- 11. hasAccessibilityRight Predicate Helper ---");
assert(
  "hasAccessibilityRight(S) in RIDASHL",
  hasAccessibilityRight(fullRights, CbsRecordFunction.SEE) === true,
);
assert(
  "hasAccessibilityRight(L) in RIDASHL",
  hasAccessibilityRight(fullRights, CbsRecordFunction.LIST) === true,
);
assert(
  "hasAccessibilityRight(L) in RIDASH is false",
  hasAccessibilityRight(legacyRights, CbsRecordFunction.LIST) === false,
);
assert(
  "hasAccessibilityRight(D) in lookup profile is false",
  hasAccessibilityRight(lookupRights, CbsRecordFunction.DELETE) === false,
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

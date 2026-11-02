/**
 * Automated Verification Suite for CBS Access Control & Capabilities (@/lib/cbs-access)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * security rule exposed by `@/lib/cbs-access` with explicit Input and Output visualization:
 * 1. Accessibility Profile Parser (normalization, trimming, deduplication, filtering)
 * 2. Full Access Profile Capability Grants (RIDASHL)
 * 3. IDLE Mode Operational Action Guards
 * 4. Active Pending Record (INA) Lifecycle Actions
 * 5. Live Authorized Record (AU) Lifecycle Actions
 * 6. Read-Only / Lookup Profile Enforcement (R---S-L)
 * 7. Screen Mode Read-Only Lock Matrix (SEE, HOLD, AUTH, DEL, REV vs INPUT)
 * 8. Four-Eyes Maker-Checker Anti-Fraud Guard (userId === recordInputter)
 * 9. getDisableReason Diagnostic Tooltip Explanations
 * 10. hasAccessibilityRight Predicate Helper
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-cbs-access.ts
 */

import {
  evaluateCbsAccess,
  hasAccessibilityRight,
  parseAccessibilityRights,
} from "@/lib/cbs-access";
import { CbsRecordFunction } from "@/types";

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

console.log("\n================================================================================");
console.log("             CBS ACCESS CONTROL & RIDASHL VERIFICATION                          ");
console.log("================================================================================");
console.log(" Architecture : Banking Security & Entitlement Engine (@/lib/cbs-access)");
console.log(" Pattern      : Single Unique Test per Access Rule with Visible Security IO");
console.log("================================================================================");

// --- 1. Accessibility Profile Parser ---
console.log("\n── 1. Accessibility Profile Parser ──");
const emptyCheck = parseAccessibilityRights(null);
recordTest(
  "1.1 Parser: Null/empty input safely falls back to empty rights array",
  "null",
  emptyCheck,
  emptyCheck.length === 0,
);

const normalizedRights = parseAccessibilityRights(["  r  ", "i", "invalid", "s", "d", "r"]);
recordTest(
  "1.2 Parser: Normalizes whitespace, deduplicates, and filters invalid function codes",
  '["  r  ", "i", "invalid", "s", "d", "r"]',
  normalizedRights,
  normalizedRights.length === 4 &&
    normalizedRights.includes(CbsRecordFunction.REVERSE) &&
    normalizedRights.includes(CbsRecordFunction.INPUT) &&
    normalizedRights.includes(CbsRecordFunction.SEE) &&
    normalizedRights.includes(CbsRecordFunction.DELETE),
);

// --- 2. Full Access Profile Capability Grants ---
console.log("\n── 2. Full Access Capability Grants ──");
const fullRights = parseAccessibilityRights("RIDASHL");
const fullAccess = evaluateCbsAccess({ grantedRights: fullRights });
recordTest(
  "2.1 Full Access (RIDASHL): Grants all core capability permissions",
  "parseAccessibilityRights('RIDASHL')",
  {
    canSee: fullAccess.canSee,
    canInput: fullAccess.canInput,
    canList: fullAccess.canList,
    grantedRights: fullAccess.grantedRights,
  },
  fullAccess.canSee &&
    fullAccess.canInput &&
    fullAccess.canList &&
    fullAccess.hasFunctionRight(CbsRecordFunction.AUTHORIZE) &&
    fullAccess.hasFunctionRight(CbsRecordFunction.REVERSE) &&
    fullAccess.hasFunctionRight(CbsRecordFunction.DELETE) &&
    fullAccess.hasFunctionRight(CbsRecordFunction.HOLD),
);

// --- 3. IDLE Mode Operational Action Guards ---
console.log("\n── 3. IDLE Mode Operational Action Guards ──");
recordTest(
  "3.1 IDLE Mode Guard: Action buttons are locked until an active record is loaded",
  '{ mode: "IDLE" }',
  {
    canDelete: fullAccess.canDelete,
    canHold: fullAccess.canHold,
    canAuthorize: fullAccess.canAuthorize,
    canReverse: fullAccess.canReverse,
  },
  !fullAccess.canDelete &&
    !fullAccess.canHold &&
    !fullAccess.canAuthorize &&
    !fullAccess.canReverse,
);

// --- 4. Active Pending Record (INA) Lifecycle Actions ---
console.log("\n── 4. Active Pending Record (INA) Lifecycle ──");
const pendingAccess = evaluateCbsAccess({
  userId: "TELLER02",
  recordInputter: "TELLER01",
  recordStatus: "INA",
  mode: "I",
  grantedRights: fullRights,
});
recordTest(
  "4.1 Pending Record (INA): Permits Authorize, Hold, and Delete; Blocks Reverse",
  '{ recordStatus: "INA", recordInputter: "TELLER01", userId: "TELLER02", mode: "I" }',
  {
    canAuthorize: pendingAccess.canAuthorize,
    canHold: pendingAccess.canHold,
    canDelete: pendingAccess.canDelete,
    canReverse: pendingAccess.canReverse,
  },
  pendingAccess.canAuthorize &&
    pendingAccess.canHold &&
    pendingAccess.canDelete &&
    !pendingAccess.canReverse,
);

// --- 5. Live Authorized Record (AU) Lifecycle Actions ---
console.log("\n── 5. Live Authorized Record (AU) Lifecycle ──");
const liveAccess = evaluateCbsAccess({
  userId: "TELLER02",
  recordStatus: "AU",
  mode: "S",
  grantedRights: fullRights,
});
recordTest(
  "5.1 Live Record (AU): Permits Reversal; Blocks Authorize, Delete, and Hold",
  '{ recordStatus: "AU", mode: "S" }',
  {
    canReverse: liveAccess.canReverse,
    canAuthorize: liveAccess.canAuthorize,
    canDelete: liveAccess.canDelete,
    canHold: liveAccess.canHold,
  },
  liveAccess.canReverse && !liveAccess.canAuthorize && !liveAccess.canDelete && !liveAccess.canHold,
);

// --- 6. Read-Only / Lookup Profile (R---S-L) ---
console.log("\n── 6. Read-Only / Lookup Profile Enforcement ──");
const lookupRights = parseAccessibilityRights("R---S-L");
const lookupAccess = evaluateCbsAccess({ grantedRights: lookupRights });
recordTest(
  "6.1 Read-Only Profile (R---S-L): Forces isReadOnly when 'I' (Input) right is missing",
  "parseAccessibilityRights('R---S-L')",
  {
    canSee: lookupAccess.canSee,
    canList: lookupAccess.canList,
    canInput: lookupAccess.canInput,
    isReadOnly: lookupAccess.isReadOnly,
  },
  lookupAccess.canSee && lookupAccess.canList && !lookupAccess.canInput && lookupAccess.isReadOnly,
);

// --- 7. Screen Mode Read-Only Lock Matrix ---
console.log("\n── 7. Screen Mode Read-Only Lock Matrix ──");
const seeLock = evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.SEE });
const holdLock = evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.HOLD });
const inputEdit = evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.INPUT });
recordTest(
  "7.1 Screen Mode Matrix: Non-input modes (S, H, A, D, R) lock form; 'I' mode unlocks",
  '{ modes: ["S", "H", "I"] }',
  {
    seeIsReadOnly: seeLock.isReadOnly,
    holdIsReadOnly: holdLock.isReadOnly,
    inputIsReadOnly: inputEdit.isReadOnly,
  },
  seeLock.isReadOnly && holdLock.isReadOnly && !inputEdit.isReadOnly,
);

// --- 8. Four-Eyes Maker-Checker Anti-Fraud Guard ---
console.log("\n── 8. Four-Eyes Maker-Checker Compliance ──");
const fourEyesViolation = evaluateCbsAccess({
  userId: " teller01 ",
  recordInputter: "TELLER01", // Case & whitespace insensitive match
  recordStatus: "INA",
  mode: "A",
  grantedRights: fullRights,
});
recordTest(
  "8.1 Four-Eyes Guard: Blocks authorization when Maker (Inputter) attempts to authorize own record",
  '{ userId: " teller01 ", recordInputter: "TELLER01", recordStatus: "INA", mode: "A" }',
  {
    isFourEyesViolation: fourEyesViolation.isFourEyesViolation,
    canAuthorize: fourEyesViolation.canAuthorize,
    disableReason: fourEyesViolation.getDisableReason(CbsRecordFunction.AUTHORIZE),
  },
  fourEyesViolation.isFourEyesViolation &&
    !fourEyesViolation.canAuthorize &&
    Boolean(
      fourEyesViolation
        .getDisableReason(CbsRecordFunction.AUTHORIZE)
        ?.includes("Maker/Inputter cannot authorize"),
    ),
);

// --- 9. getDisableReason Diagnostic Tooltip Explanations ---
console.log("\n── 9. Diagnostic Tooltip Explanations (getDisableReason) ──");
const lackingUser = evaluateCbsAccess({ grantedRights: [CbsRecordFunction.SEE] });
const deleteOnAu = evaluateCbsAccess({
  userId: "TELLER02",
  recordStatus: "AU",
  mode: "D",
  grantedRights: fullRights,
});
const validAuth = pendingAccess.getDisableReason(CbsRecordFunction.AUTHORIZE);
recordTest(
  "9.1 Tooltip Diagnostics: Explains missing rights, directs live delete to reverse, and returns null when permitted",
  "getDisableReason for missing rights, AU delete, and valid pending auth",
  {
    missingRightReason: lackingUser.getDisableReason(CbsRecordFunction.AUTHORIZE),
    deleteOnAuReason: deleteOnAu.getDisableReason(CbsRecordFunction.DELETE),
    validAuthReason: validAuth,
  },
  Boolean(
    lackingUser
      .getDisableReason(CbsRecordFunction.AUTHORIZE)
      ?.includes("Access Denied: Missing 'A' capability"),
  ) &&
    Boolean(
      deleteOnAu.getDisableReason(CbsRecordFunction.DELETE)?.includes("Use Reverse ('R') instead"),
    ) &&
    validAuth === null,
);

// --- 10. hasAccessibilityRight Predicate Helper ---
console.log("\n── 10. hasAccessibilityRight Predicate Helper ──");
const hasSee = hasAccessibilityRight(fullRights, CbsRecordFunction.SEE);
const lacksList = hasAccessibilityRight(parseAccessibilityRights("RIDASH"), CbsRecordFunction.LIST);
recordTest(
  "10.1 hasAccessibilityRight: Accurately checks presence or absence of specific function codes",
  'hasAccessibilityRight("RIDASHL", "S") vs hasAccessibilityRight("RIDASH", "L")',
  { hasSee, lacksList },
  hasSee === true && lacksList === false,
);

const passedTests = testCases.filter((t) => t.passed).length;
const failedTests = testCases.filter((t) => !t.passed).length;

console.log("\n================================================================================");
if (failedTests === 0) {
  console.log(
    `>>> SUCCESS: ALL ${passedTests} CBS-ACCESS SECURITY CAPABILITIES VALIDATED 100% CLEAN! <<<`,
  );
} else {
  console.error(`>>> FAILURE: ${failedTests} TESTS FAILED! <<<`);
  process.exit(1);
}
console.log("================================================================================\n");

/**
 * CBS ACCESS CONTROL & RIDASHL DOMAIN VERIFICATION
 *
 * Validates domain security, Four-Eyes Maker-Checker compliance,
 * and record lifecycle action gating:
 *
 * 1. Full Access Profile Capability Grants
 * 2. IDLE Mode Operational Action Guards
 * 3. Active Pending Record (UA) Lifecycle Actions
 * 4. Live Authorized Record (AU) Lifecycle Actions
 * 5. Read-Only / Lookup Profile Enforcement
 * 6. Screen Mode Read-Only Lock Matrix
 * 7. Four-Eyes Maker-Checker Anti-Fraud Guard (userId === recordInputter)
 * 8. Diagnostic Tooltip Explanations (getDisableReason)
 * 9. hasAccessibilityRight Predicate Helper
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-cbs-access.ts
 */

import {
  evaluateCbsAccess,
  hasAccessibilityRight,
  isRecordEditable,
  verifyUserRecordAccess,
} from "@/lib/cbs-access";
import { CBS_IDLE_MODE, CbsRecordFunction } from "@/types";

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

console.log("================================================================================");
console.log("             CBS ACCESS CONTROL & RIDASHL VERIFICATION                          ");
console.log("================================================================================");
console.log(" Architecture : Banking Security & Entitlement Engine (@/lib/cbs-access)");
console.log(" Pattern      : Single Unique Test per Access Rule with Visible Security IO");
console.log("================================================================================");

// --- 1. Full Access Profile Capability Grants ---
console.log("\n── 1. Full Access Capability Grants ──");
const fullRights: readonly CbsRecordFunction[] = ["R", "I", "D", "A", "S", "H", "L"];
const fullAccess = evaluateCbsAccess({ grantedRights: fullRights });
recordTest(
  "1.1 Full Access (RIDASHL): Grants all core capability permissions",
  'grantedRights: ["R", "I", "D", "A", "S", "H", "L"]',
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
    !fullAccess.isReadOnly &&
    fullAccess.grantedRights.length === 7,
);

// --- 2. IDLE Mode Operational Action Guards ---
console.log("\n── 2. IDLE Mode Operational Action Guards ──");
const idleAccess = evaluateCbsAccess({
  grantedRights: fullRights,
  mode: "IDLE",
});
recordTest(
  "2.1 IDLE Mode Guard: Action buttons are locked until an active record is loaded",
  '{ mode: "IDLE" }',
  {
    canDelete: idleAccess.canDelete,
    canHold: idleAccess.canHold,
    canAuthorize: idleAccess.canAuthorize,
    canReverse: idleAccess.canReverse,
  },
  !idleAccess.canDelete &&
    !idleAccess.canHold &&
    !idleAccess.canAuthorize &&
    !idleAccess.canReverse,
);

// --- 3. Active Pending Record (UA) Lifecycle Actions ---
console.log("\n── 3. Active Pending Record (UA) Lifecycle ──");
const pendingAccess = evaluateCbsAccess({
  userId: "TELLER02",
  recordInputter: "TELLER01",
  recordStatus: "UA",
  mode: "I",
  grantedRights: fullRights,
});
recordTest(
  "3.1 Pending Record (UA): Permits Authorize, Hold, and Delete; Blocks Reverse",
  '{ recordStatus: "UA", recordInputter: "TELLER01", userId: "TELLER02", mode: "I" }',
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

// --- 4. Live Authorized Record (AU) Lifecycle Actions ---
console.log("\n── 4. Live Authorized Record (AU) Lifecycle ──");
const liveAccess = evaluateCbsAccess({
  userId: "TELLER02",
  recordStatus: "AU",
  mode: "S",
  grantedRights: fullRights,
});
recordTest(
  "4.1 Live Record (AU): Permits Reversal; Blocks Authorize, Delete, and Hold",
  '{ recordStatus: "AU", mode: "S" }',
  {
    canReverse: liveAccess.canReverse,
    canAuthorize: liveAccess.canAuthorize,
    canDelete: liveAccess.canDelete,
    canHold: liveAccess.canHold,
  },
  liveAccess.canReverse && !liveAccess.canAuthorize && !liveAccess.canDelete && !liveAccess.canHold,
);

// --- 4.2 Reversed / Terminated Record (RNA) Lifecycle ---
const reversedAccess = evaluateCbsAccess({
  recordStatus: "RNA",
  mode: "S",
  grantedRights: fullRights,
});
recordTest(
  "4.2 Reversed Record (RNA): All operational actions locked on reversed/deleted records",
  '{ recordStatus: "RNA", mode: "S" }',
  {
    canAuthorize: reversedAccess.canAuthorize,
    canReverse: reversedAccess.canReverse,
    canDelete: reversedAccess.canDelete,
    isReadOnly: reversedAccess.isReadOnly,
  },
  !reversedAccess.canAuthorize &&
    !reversedAccess.canReverse &&
    !reversedAccess.canDelete &&
    reversedAccess.isReadOnly,
);

// --- 5. Read-Only / Lookup Profile (R, S, L) ---
console.log("\n── 5. Read-Only / Lookup Profile Enforcement ──");
const lookupRights: readonly CbsRecordFunction[] = ["R", "S", "L"];
const lookupAccess = evaluateCbsAccess({ grantedRights: lookupRights });
recordTest(
  "5.1 Read-Only Profile (R, S, L): Forces isReadOnly when 'I' (Input) right is missing",
  'grantedRights: ["R", "S", "L"]',
  {
    canSee: lookupAccess.canSee,
    canList: lookupAccess.canList,
    canInput: lookupAccess.canInput,
    isReadOnly: lookupAccess.isReadOnly,
  },
  lookupAccess.canSee && lookupAccess.canList && !lookupAccess.canInput && lookupAccess.isReadOnly,
);

// --- 6. Screen Mode Read-Only Lock Matrix ---
console.log("\n── 6. Screen Mode Read-Only Lock Matrix ──");
const seeLock = evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.SEE });
const holdLock = evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.HOLD });
const inputEdit = evaluateCbsAccess({ grantedRights: fullRights, mode: CbsRecordFunction.INPUT });
recordTest(
  "6.1 Screen Mode Matrix: Non-input modes (S, H, A, D, R) lock form; 'I' mode unlocks",
  '{ modes: ["S", "H", "I"] }',
  {
    seeIsReadOnly: seeLock.isReadOnly,
    holdIsReadOnly: holdLock.isReadOnly,
    inputIsReadOnly: inputEdit.isReadOnly,
  },
  seeLock.isReadOnly && holdLock.isReadOnly && !inputEdit.isReadOnly,
);

// --- 7. Four-Eyes Maker-Checker Anti-Fraud Guard ---
console.log("\n── 7. Four-Eyes Maker-Checker Compliance ──");
const fourEyesViolation = evaluateCbsAccess({
  userId: " teller01 ",
  recordInputter: "TELLER01", // Case & whitespace insensitive match
  recordStatus: "UA",
  mode: "A",
  grantedRights: fullRights,
});
recordTest(
  "7.1 Four-Eyes Guard: Blocks authorization when Maker (Inputter) attempts to authorize own record",
  '{ userId: " teller01 ", recordInputter: "TELLER01", recordStatus: "UA", mode: "A" }',
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

// --- 8. getDisableReason Diagnostic Tooltip Explanations ---
console.log("\n── 8. Diagnostic Tooltip Explanations (getDisableReason) ──");
const lackingUser = evaluateCbsAccess({ grantedRights: [CbsRecordFunction.SEE] });
const deleteOnAu = evaluateCbsAccess({
  userId: "TELLER02",
  recordStatus: "AU",
  mode: "D",
  grantedRights: fullRights,
});
const validAuth = pendingAccess.getDisableReason(CbsRecordFunction.AUTHORIZE);
recordTest(
  "8.1 Tooltip Diagnostics: Explains missing rights, directs live delete to reverse, and returns null when permitted",
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

// --- 9. hasAccessibilityRight Predicate Helper ---
console.log("\n── 9. hasAccessibilityRight Predicate Helper ──");
const hasSee = hasAccessibilityRight(fullRights, CbsRecordFunction.SEE);
const lacksList = hasAccessibilityRight(["R", "I", "D", "A", "S", "H"], CbsRecordFunction.LIST);
recordTest(
  "9.1 hasAccessibilityRight: Accurately checks presence or absence of specific function codes",
  'hasAccessibilityRight(fullRights, "S") vs lacksList',
  { hasSee, lacksList },
  hasSee === true && lacksList === false,
);

// --- 10. isRecordEditable: designer field lock (fields are editable only in Input) ---
console.log("\n── 10. isRecordEditable Designer Field Lock ──");
const editableModes = [CBS_IDLE_MODE, ...Object.values(CbsRecordFunction)].filter(isRecordEditable);
recordTest(
  "10.1 isRecordEditable: Only Input ('I') mode unlocks designer fields",
  "every CbsScreenMode",
  { editableModes },
  editableModes.length === 1 && editableModes[0] === CbsRecordFunction.INPUT,
);

const viewOnlyModes = [CBS_IDLE_MODE, ...Object.values(CbsRecordFunction)].filter(
  (mode) => evaluateCbsAccess({ grantedRights: fullRights, mode }).isViewOnly,
);
recordTest(
  "10.2 isViewOnly: Only See ('S') and Authorize ('A') lock the action bar's Commit/Validate/Hold",
  "every CbsScreenMode",
  { viewOnlyModes },
  viewOnlyModes.length === 2 &&
    viewOnlyModes.includes(CbsRecordFunction.SEE) &&
    viewOnlyModes.includes(CbsRecordFunction.AUTHORIZE),
);

// --- 11. verifyUserRecordAccess: the proxy's server-side rights gate ---
console.log("\n── 11. verifyUserRecordAccess Server Rights Gate ──");
const inputter = { userId: "MAKER", accessibility: ["S", "I", "L"] };
const gate = (requestType: string, recordFunction?: string) =>
  verifyUserRecordAccess(inputter, requestType, recordFunction)?.funcCode ?? "allowed";
const gateCases = {
  "PUT I": gate("PUT", "I"),
  "PUT (no function)": gate("PUT"),
  "PUT S": gate("PUT", "S"),
  "AUT A": gate("AUT", "A"),
  "AUT I": gate("AUT", "I"),
  "HLD (no function)": gate("HLD"),
  "PUT d": gate("PUT", " d "),
  "INQ S": gate("INQ", "S"),
  "GET S": gate("GET", "S"),
};
recordTest(
  "11.1 A mutation always needs a right: a missing or non-controlled function needs 'I', and a verb's own right ('A' for AUT) can't be bypassed by the function sent",
  { user: inputter, requests: Object.keys(gateCases) },
  gateCases,
  JSON.stringify(gateCases) ===
    JSON.stringify({
      "PUT I": "allowed",
      "PUT (no function)": "allowed",
      "PUT S": "allowed",
      "AUT A": "A",
      "AUT I": "A",
      "HLD (no function)": "H",
      "PUT d": "D",
      "INQ S": "allowed",
      "GET S": "allowed",
    }),
);

const viewer = { userId: "VIEWER", accessibility: ["S", "L"] };
const viewerPut = verifyUserRecordAccess(viewer, "PUT");
recordTest(
  "11.2 A see-only user can't mutate by leaving recordFunction out",
  { user: viewer, request: "PUT without recordFunction" },
  viewerPut,
  viewerPut?.funcCode === CbsRecordFunction.INPUT,
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

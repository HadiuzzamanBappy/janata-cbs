/**
 * Automated Verification Suite for Form Delta Engine (@/lib/cbs-record)
 * Tests dirty checking, field mutations, ignore lists, and patch generation.
 *
 * Usage:
 *   pnpm tsx scripts/verify-cbs-record.ts
 */

import { computeDelta } from "@/lib/cbs-record";

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
console.log("       CBS RECORD DELTA ENGINE SUITE                    ");
console.log("========================================================\n");

// 1. Pristine / Unmodified State
const baseline = {
  accountNo: "AC10000001",
  accountTitle: "Janata Bank General A/C",
  balance: 50000,
  branchCode: "JB0001",
  status: "ACTIVE",
};

const identicalCopy = { ...baseline };
const deltaPristine = computeDelta(baseline, identicalCopy);
assert("Pristine record: isDirty is false", deltaPristine.isDirty === false);
assert("Pristine record: dirtyKeys is empty", deltaPristine.dirtyKeys.length === 0);
assert("Pristine record: modifiedFields is empty", Object.keys(deltaPristine.modifiedFields).length === 0);

// 2. Single Field Mutation
const modifiedSingle = {
  ...baseline,
  accountTitle: "Janata Bank Main Corporate A/C",
};
const deltaSingle = computeDelta(baseline, modifiedSingle);
assert("Single edit: isDirty is true", deltaSingle.isDirty === true);
assert("Single edit: dirtyKeys contains 'accountTitle'", deltaSingle.dirtyKeys.includes("accountTitle"));
assert("Single edit: dirtyKeys length is 1", deltaSingle.dirtyKeys.length === 1);
assert("Single edit: originalFields has baseline value", deltaSingle.originalFields.accountTitle === "Janata Bank General A/C");
assert("Single edit: modifiedFields has new value", deltaSingle.modifiedFields.accountTitle === "Janata Bank Main Corporate A/C");

// 3. Multi-field and Nested Array Mutation
const baselineWithArray = {
  ...baseline,
  signatories: ["EMP001", "EMP002"],
};
const modifiedWithArray = {
  ...baseline,
  accountTitle: "Janata Bank VIP A/C",
  signatories: ["EMP001", "EMP002", "EMP003"],
};
const deltaMulti = computeDelta(baselineWithArray, modifiedWithArray);
assert("Multi-field: dirtyKeys length is 2", deltaMulti.dirtyKeys.length === 2);
assert("Multi-field: captures array modifications", deltaMulti.dirtyKeys.includes("signatories"));

// 4. Ignored Keys (Audit fields should not mark form dirty)
const modifiedWithAudit = {
  ...baseline,
  lastUpdatedBy: "SYS_CRON",
  timestamp: "2026-10-12T14:00:00Z",
};
const deltaIgnored = computeDelta(baseline, modifiedWithAudit, ["lastUpdatedBy", "timestamp"]);
assert("Ignored fields: isDirty is false", deltaIgnored.isDirty === false);
assert("Ignored fields: dirtyKeys is empty", deltaIgnored.dirtyKeys.length === 0);

// 5. Handling of Null and Undefined records
const deltaNull = computeDelta(null, { name: "New Record" });
assert("Null baseline: isDirty is true", deltaNull.isDirty === true);
assert("Null baseline: captures new field", deltaNull.modifiedFields.name === "New Record");

console.log("\n========================================================");
const allPassed = reports.every((r) => r.passed);
if (allPassed) {
  console.log(`ALL ${reports.length} RECORD DELTA TEST CASES PASSED WITH 100% SUCCESS!`);
} else {
  console.error("SOME RECORD TESTS FAILED!");
  process.exit(1);
}
console.log("========================================================\n");

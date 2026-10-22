/**
 * Automated Verification Suite for Form Delta Mutation Engine (@/lib/cbs-record)
 * Tests deep equality comparisons, primitive and nested mutations, array updates,
 * ignore key filtering, boundary conditions, and CbsDeltaPatch contract compliance.
 *
 * Usage:
 *   pnpm tsx scripts/verify-cbs-record.ts
 */

import {
  type CbsDeltaPatch,
  computeDelta,
  createBaseline,
  evaluateDirty,
  rebaseline,
} from "@/lib/cbs-record";

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
  console.log("       CBS RECORD DELTA MUTATION ENGINE SUITE           ");
  console.log("========================================================\n");

  // Standard CBS banking account fixture
  const baselineAccount = {
    accountNo: "AC10000001",
    accountTitle: "Janata Bank General A/C",
    balance: 50000,
    branchCode: "JB0001",
    status: "ACTIVE",
    isLocked: false,
    feeRate: 0.05,
    remarks: "Standard corporate checking",
    signatories: ["EMP001", "EMP002"],
    address: {
      street: "1 Motijheel C/A",
      city: "Dhaka",
      postalCode: "1000",
      country: "Bangladesh",
    },
  };

  // ============================================================================
  // --- 1. Pristine Baseline & Cloned Identity ---
  // ============================================================================
  console.log("--- 1. Pristine Baseline & Cloned Identity ---");

  // 1.1 Identical flat clone
  const flatClone = { ...baselineAccount };
  const deltaFlatClone = computeDelta(baselineAccount, flatClone);
  assert("Pristine: Flat clone produces isDirty: false", deltaFlatClone.isDirty === false);
  assert("Pristine: Flat clone dirtyKeys is empty", deltaFlatClone.dirtyKeys.length === 0);
  assert(
    "Pristine: Flat clone modifiedFields is empty",
    Object.keys(deltaFlatClone.modifiedFields).length === 0,
  );
  assert(
    "Pristine: Flat clone originalFields is empty",
    Object.keys(deltaFlatClone.originalFields).length === 0,
  );

  // 1.2 Empty object comparison
  const deltaEmpty = computeDelta({}, {});
  assert(
    "Pristine: Empty records produce isDirty: false",
    deltaEmpty.isDirty === false && deltaEmpty.dirtyKeys.length === 0,
  );

  // 1.3 Key order independence
  const unorderedA = { branch: "JB001", currency: "BDT", active: true };
  const unorderedB = { active: true, branch: "JB001", currency: "BDT" };
  const deltaOrder = computeDelta(unorderedA, unorderedB);
  assert("Pristine: Object key order does not trigger false dirty", deltaOrder.isDirty === false);

  // 1.4 Identical deep clone
  const deepClone = JSON.parse(JSON.stringify(baselineAccount)) as typeof baselineAccount;
  const deltaDeepClone = computeDelta(baselineAccount, deepClone);
  assert("Pristine: Deep nested clone produces isDirty: false", deltaDeepClone.isDirty === false);

  // 1.5 Array clone identity
  const arrayBase = { codes: [101, 102, 103], labels: ["A", "B", "C"] };
  const arrayClone = { codes: [101, 102, 103], labels: ["A", "B", "C"] };
  assert(
    "Pristine: Cloned array properties produce isDirty: false",
    computeDelta(arrayBase, arrayClone).isDirty === false,
  );

  // ============================================================================
  // --- 2. Primitive Field Mutations ---
  // ============================================================================
  console.log("\n--- 2. Primitive Field Mutations ---");

  // 2.1 String update
  const stringEdit = { ...baselineAccount, accountTitle: "Janata Bank Corporate A/C" };
  const deltaString = computeDelta(baselineAccount, stringEdit);
  assert("Primitive: String edit marks isDirty: true", deltaString.isDirty === true);
  assert(
    "Primitive: String edit dirtyKeys includes accountTitle",
    deltaString.dirtyKeys.includes("accountTitle"),
  );
  assert("Primitive: String edit dirtyKeys length is 1", deltaString.dirtyKeys.length === 1);
  assert(
    "Primitive: String edit originalFields captures old value",
    deltaString.originalFields.accountTitle === "Janata Bank General A/C",
  );
  assert(
    "Primitive: String edit modifiedFields captures new value",
    deltaString.modifiedFields.accountTitle === "Janata Bank Corporate A/C",
  );

  // 2.2 Numeric update
  const numberEdit = { ...baselineAccount, balance: 75000 };
  const deltaNumber = computeDelta(baselineAccount, numberEdit);
  assert(
    "Primitive: Number edit captured",
    deltaNumber.dirtyKeys.includes("balance") &&
      deltaNumber.modifiedFields.balance === 75000 &&
      deltaNumber.originalFields.balance === 50000,
  );

  // 2.3 Falsy value update to zero
  const zeroEdit = { ...baselineAccount, balance: 0 };
  const deltaZero = computeDelta(baselineAccount, zeroEdit);
  assert(
    "Primitive: Zero value is not swallowed by falsy checks",
    deltaZero.dirtyKeys.includes("balance") && deltaZero.modifiedFields.balance === 0,
  );

  // 2.4 Boolean toggle
  const boolEdit = { ...baselineAccount, isLocked: true };
  const deltaBool = computeDelta(baselineAccount, boolEdit);
  assert(
    "Primitive: Boolean toggle captured",
    deltaBool.dirtyKeys.includes("isLocked") &&
      deltaBool.modifiedFields.isLocked === true &&
      deltaBool.originalFields.isLocked === false,
  );

  // 2.5 Empty string update
  const emptyStrEdit = { ...baselineAccount, remarks: "" };
  const deltaEmptyStr = computeDelta(baselineAccount, emptyStrEdit);
  assert(
    "Primitive: Empty string edit captured",
    deltaEmptyStr.dirtyKeys.includes("remarks") && deltaEmptyStr.modifiedFields.remarks === "",
  );

  // 2.6 Value to null
  const nullFieldEdit = { ...baselineAccount, remarks: null as unknown as string };
  const deltaNullField = computeDelta(baselineAccount, nullFieldEdit);
  assert(
    "Primitive: Value to null captured",
    deltaNullField.dirtyKeys.includes("remarks") && deltaNullField.modifiedFields.remarks === null,
  );

  // 2.7 Value to undefined
  const undefinedFieldEdit = { ...baselineAccount, remarks: undefined as unknown as string };
  const deltaUndefField = computeDelta(baselineAccount, undefinedFieldEdit);
  assert(
    "Primitive: Value to undefined captured",
    deltaUndefField.dirtyKeys.includes("remarks") &&
      deltaUndefField.modifiedFields.remarks === undefined,
  );

  // 2.8 Null vs Undefined distinction
  const nullToUndefA = { status: null as unknown as string };
  const nullToUndefB = { status: undefined as unknown as string };
  const deltaNullVsUndef = computeDelta(nullToUndefA, nullToUndefB);
  assert(
    "Primitive: null vs undefined is recognized as dirty",
    deltaNullVsUndef.isDirty === true && deltaNullVsUndef.dirtyKeys.includes("status"),
  );

  // ============================================================================
  // --- 3. Field Lifecycle: Additions & Removals ---
  // ============================================================================
  console.log("\n--- 3. Field Lifecycle: Additions & Removals ---");

  // 3.1 New field addition
  const withAddedField = {
    ...baselineAccount,
    taxExemptNumber: "TAX-998811",
  };
  const deltaAdded = computeDelta(baselineAccount, withAddedField);
  assert(
    "Lifecycle: Added field is marked dirty",
    deltaAdded.dirtyKeys.includes("taxExemptNumber"),
  );
  assert(
    "Lifecycle: Added field original is undefined",
    deltaAdded.originalFields.taxExemptNumber === undefined,
  );
  assert(
    "Lifecycle: Added field modified is new value",
    deltaAdded.modifiedFields.taxExemptNumber === "TAX-998811",
  );

  // 3.2 Existing field removal / omission
  const withRemovedField = { ...baselineAccount } as Partial<typeof baselineAccount>;
  delete withRemovedField.remarks;
  const deltaRemoved = computeDelta(baselineAccount, withRemovedField);
  assert("Lifecycle: Removed field is marked dirty", deltaRemoved.dirtyKeys.includes("remarks"));
  assert(
    "Lifecycle: Removed field original retains baseline value",
    deltaRemoved.originalFields.remarks === "Standard corporate checking",
  );
  assert(
    "Lifecycle: Removed field modified is undefined",
    deltaRemoved.modifiedFields.remarks === undefined,
  );

  // 3.3 Simultaneous addition, edit, and deletion
  const multiLifeBase: Record<string, unknown> = { a: "keep", b: "edit_old", c: "delete_me" };
  const multiLifeDraft: Record<string, unknown> = { a: "keep", b: "edit_new", d: "new_added" };
  const deltaMultiLife = computeDelta(multiLifeBase, multiLifeDraft);
  assert(
    "Lifecycle: Simultaneous add, edit, delete length is 3",
    deltaMultiLife.dirtyKeys.length === 3,
  );
  assert(
    "Lifecycle: Captures edit b",
    deltaMultiLife.dirtyKeys.includes("b") && deltaMultiLife.modifiedFields.b === "edit_new",
  );
  assert(
    "Lifecycle: Captures removal c",
    deltaMultiLife.dirtyKeys.includes("c") && deltaMultiLife.modifiedFields.c === undefined,
  );
  assert(
    "Lifecycle: Captures addition d",
    deltaMultiLife.dirtyKeys.includes("d") && deltaMultiLife.modifiedFields.d === "new_added",
  );

  // ============================================================================
  // --- 4. Deep Equality: Nested Objects & Arrays ---
  // ============================================================================
  console.log("\n--- 4. Deep Equality: Nested Objects & Arrays ---");

  // 4.1 Nested object property edit
  const nestedObjEdit = {
    ...baselineAccount,
    address: {
      ...baselineAccount.address,
      city: "Chittagong",
    },
  };
  const deltaNestedObj = computeDelta(baselineAccount, nestedObjEdit);
  assert(
    "Nested Object: Property change marks parent field dirty",
    deltaNestedObj.dirtyKeys.includes("address") && deltaNestedObj.dirtyKeys.length === 1,
  );
  assert(
    "Nested Object: Captures entire modified sub-object",
    (deltaNestedObj.modifiedFields.address as typeof baselineAccount.address)?.city ===
      "Chittagong",
  );
  assert(
    "Nested Object: Captures entire original sub-object",
    (deltaNestedObj.originalFields.address as typeof baselineAccount.address)?.city === "Dhaka",
  );

  // 4.2 Nested object unchanged (different reference)
  const nestedUnchanged = {
    ...baselineAccount,
    address: { ...baselineAccount.address },
  };
  assert(
    "Nested Object: Re-instantiated identical object is not dirty",
    computeDelta(baselineAccount, nestedUnchanged).isDirty === false,
  );

  // 4.3 Deeply nested object mutation (3 levels)
  const deepConfigBase = {
    security: {
      limits: {
        dailyTransferMax: 100000,
        currency: "BDT",
      },
    },
  };
  const deepConfigModified = {
    security: {
      limits: {
        dailyTransferMax: 250000,
        currency: "BDT",
      },
    },
  };
  const deltaDeepConfig = computeDelta(deepConfigBase, deepConfigModified);
  assert(
    "Nested Object: 3 levels deep mutation triggers dirty on root key",
    deltaDeepConfig.dirtyKeys.includes("security"),
  );

  // 4.4 Array element added
  const arrayAddEdit = {
    ...baselineAccount,
    signatories: [...baselineAccount.signatories, "EMP003"],
  };
  const deltaArrayAdd = computeDelta(baselineAccount, arrayAddEdit);
  assert(
    "Array: Append item marks signatories dirty",
    deltaArrayAdd.dirtyKeys.includes("signatories"),
  );
  assert(
    "Array: Append item captures new array length",
    (deltaArrayAdd.modifiedFields.signatories as string[])?.length === 3,
  );

  // 4.5 Array element reordered
  const arrayReorder = {
    ...baselineAccount,
    signatories: ["EMP002", "EMP001"],
  };
  const deltaArrayReorder = computeDelta(baselineAccount, arrayReorder);
  assert(
    "Array: Reordered array marks field dirty",
    deltaArrayReorder.dirtyKeys.includes("signatories"),
  );

  // 4.6 Array element updated in-place
  const arrayItemEdit = {
    ...baselineAccount,
    signatories: ["EMP001", "EMP999"],
  };
  const deltaArrayItem = computeDelta(baselineAccount, arrayItemEdit);
  assert(
    "Array: Element replacement marks field dirty",
    deltaArrayItem.dirtyKeys.includes("signatories"),
  );

  // 4.7 Array of objects updated
  const arrayObjBase = {
    limits: [
      { id: 1, limit: 5000 },
      { id: 2, limit: 10000 },
    ],
  };
  const arrayObjModified = {
    limits: [
      { id: 1, limit: 5000 },
      { id: 2, limit: 15000 }, // modified
    ],
  };
  const deltaArrayObj = computeDelta(arrayObjBase, arrayObjModified);
  assert(
    "Array: Modification inside array of objects triggers dirty",
    deltaArrayObj.dirtyKeys.includes("limits"),
  );

  // 4.8 Array of objects unchanged
  const arrayObjClone = {
    limits: [
      { id: 1, limit: 5000 },
      { id: 2, limit: 10000 },
    ],
  };
  assert(
    "Array: Identical array of objects is not dirty",
    computeDelta(arrayObjBase, arrayObjClone).isDirty === false,
  );

  // ============================================================================
  // --- 5. Ignore Keys Filtering (Audit & Metadata Exclusion) ---
  // ============================================================================
  console.log("\n--- 5. Ignore Keys Filtering ---");

  // 5.1 Single ignored audit key
  const withSingleAudit = {
    ...baselineAccount,
    lastActivity: "2026-10-19T00:00:00Z",
  };
  const deltaSingleAudit = computeDelta(baselineAccount, withSingleAudit, ["lastActivity"]);
  assert(
    "IgnoreKeys: Single ignored key excluded from isDirty",
    deltaSingleAudit.isDirty === false && deltaSingleAudit.dirtyKeys.length === 0,
  );

  // 5.2 Multiple canonical CBS maker-checker audit keys
  const cbsAuditRecord = {
    ...baselineAccount,
    recStatus: "INA",
    recCurrNumber: 2,
    recInputter: "TELLER01",
    recInputTime: "12:00:00",
    recAuthorizer: "OFFICER01",
    recAuthTime: "12:05:00",
  };
  const cbsAuditIgnoreList = [
    "recStatus",
    "recCurrNumber",
    "recInputter",
    "recInputTime",
    "recAuthorizer",
    "recAuthTime",
  ];
  const deltaAuditExclusion = computeDelta(baselineAccount, cbsAuditRecord, cbsAuditIgnoreList);
  assert(
    "IgnoreKeys: Complete CBS maker-checker audit suite excluded",
    deltaAuditExclusion.isDirty === false,
  );

  // 5.3 Mixed scenario: Ignored fields + Legitimate domain change
  const mixedRecord = {
    ...baselineAccount,
    accountTitle: "New Legitimate Title",
    recInputter: "TELLER02",
    recCurrNumber: 3,
  };
  const deltaMixed = computeDelta(baselineAccount, mixedRecord, cbsAuditIgnoreList);
  assert(
    "IgnoreKeys: Mixed update captures ONLY legitimate domain field",
    deltaMixed.isDirty === true &&
      deltaMixed.dirtyKeys.length === 1 &&
      deltaMixed.dirtyKeys[0] === "accountTitle",
  );
  assert(
    "IgnoreKeys: Ignored keys not in modifiedFields",
    !Object.hasOwn(deltaMixed.modifiedFields, "recInputter") &&
      !Object.hasOwn(deltaMixed.modifiedFields, "recCurrNumber"),
  );

  // 5.4 Non-existent ignored key passed gracefully
  const deltaNonExistentIgnore = computeDelta(baselineAccount, stringEdit, ["NON_EXISTENT_KEY"]);
  assert(
    "IgnoreKeys: Non-matching ignore keys do not disrupt dirty detection",
    deltaNonExistentIgnore.isDirty === true &&
      deltaNonExistentIgnore.dirtyKeys.includes("accountTitle"),
  );

  // 5.5 Default parameter without ignoredKeys array
  const deltaNoIgnoreParam = computeDelta(baselineAccount, stringEdit);
  assert(
    "IgnoreKeys: Default parameter captures all differences",
    deltaNoIgnoreParam.isDirty === true && deltaNoIgnoreParam.dirtyKeys.length === 1,
  );

  // ============================================================================
  // --- 6. Null, Undefined & Boundary Records ---
  // ============================================================================
  console.log("\n--- 6. Null, Undefined & Boundary Records ---");

  // 6.1 Null baseline + New draft record
  const deltaNullBaseline = computeDelta(null, { accountNo: "AC20000001", title: "New Account" });
  assert("Boundary: Null baseline marks isDirty: true", deltaNullBaseline.isDirty === true);
  assert(
    "Boundary: Null baseline captures all draft keys",
    deltaNullBaseline.dirtyKeys.length === 2 &&
      deltaNullBaseline.dirtyKeys.includes("accountNo") &&
      deltaNullBaseline.dirtyKeys.includes("title"),
  );
  assert(
    "Boundary: Null baseline sets originalFields values to undefined",
    deltaNullBaseline.originalFields.accountNo === undefined,
  );

  // 6.2 Undefined baseline + New draft record
  const deltaUndefBaseline = computeDelta(undefined, { currency: "USD" });
  assert(
    "Boundary: Undefined baseline marks isDirty: true",
    deltaUndefBaseline.isDirty === true && deltaUndefBaseline.dirtyKeys.includes("currency"),
  );

  // 6.3 Baseline record + Null draft record (deletion scenario)
  const deltaNullDraft = computeDelta({ code: "VAL" }, null);
  assert("Boundary: Null draft marks isDirty: true", deltaNullDraft.isDirty === true);
  assert(
    "Boundary: Null draft retains baseline in originalFields",
    deltaNullDraft.originalFields.code === "VAL",
  );
  assert(
    "Boundary: Null draft sets modifiedFields to undefined",
    deltaNullDraft.modifiedFields.code === undefined,
  );

  // 6.4 Baseline record + Undefined draft record
  const deltaUndefDraft = computeDelta({ code: "VAL" }, undefined);
  assert("Boundary: Undefined draft marks isDirty: true", deltaUndefDraft.isDirty === true);

  // 6.5 Both null
  const deltaBothNull = computeDelta(null, null);
  assert(
    "Boundary: Both null produces isDirty: false",
    deltaBothNull.isDirty === false && deltaBothNull.dirtyKeys.length === 0,
  );

  // 6.6 Both undefined
  const deltaBothUndef = computeDelta(undefined, undefined);
  assert(
    "Boundary: Both undefined produces isDirty: false",
    deltaBothUndef.isDirty === false && deltaBothUndef.dirtyKeys.length === 0,
  );

  // ============================================================================
  // --- 7. CbsDeltaPatch Contract & Immutability Integrity ---
  // ============================================================================
  console.log("\n--- 7. CbsDeltaPatch Contract & Immutability Integrity ---");

  // 7.1 Verify return contract conformity
  const samplePatch: CbsDeltaPatch = deltaString;
  assert(
    "Contract: Patch satisfies CbsDeltaPatch type",
    typeof samplePatch.isDirty === "boolean" && Array.isArray(samplePatch.dirtyKeys),
  );
  assert(
    "Contract: dirtyKeys matches length of modifiedFields",
    samplePatch.dirtyKeys.length === Object.keys(samplePatch.modifiedFields).length,
  );
  assert(
    "Contract: dirtyKeys matches length of originalFields",
    samplePatch.dirtyKeys.length === Object.keys(samplePatch.originalFields).length,
  );

  // 7.2 Immutability: input objects must never be altered
  const frozenOrig: Readonly<Record<string, unknown>> = Object.freeze({
    name: "Unchanged Original",
    rate: 10,
  });
  const frozenDraft: Readonly<Record<string, unknown>> = Object.freeze({
    name: "New Working Draft",
    rate: 10,
  });
  const deltaFrozen = computeDelta(frozenOrig, frozenDraft);
  assert(
    "Immutability: Operates safely on Object.freeze() inputs without mutation",
    deltaFrozen.isDirty === true && frozenOrig.name === "Unchanged Original",
  );

  // ============================================================================
  // --- 8. Baseline Lifecycle Management ---
  // ============================================================================
  console.log("\n--- 8. Baseline Lifecycle Management ---");

  // 8.1 Hydrate is not dirty
  const freshRecord = { ...baselineAccount };
  const baselineInstance = createBaseline(freshRecord);
  const deltaHydrate = evaluateDirty(baselineInstance, freshRecord);
  assert(
    "Baseline: Hydrate creates clean baseline where isDirty is false",
    deltaHydrate.isDirty === false && deltaHydrate.dirtyKeys.length === 0,
  );

  // 8.2 Edit then undo returns to clean
  const mutableDraft = { ...freshRecord, accountTitle: "Changed For Test" };
  const deltaEdited = evaluateDirty(baselineInstance, mutableDraft);
  assert("Baseline: Edit marks isDirty: true", deltaEdited.isDirty === true);

  mutableDraft.accountTitle = freshRecord.accountTitle;
  const deltaReverted = evaluateDirty(baselineInstance, mutableDraft);
  assert(
    "Baseline: Edit-then-undo returns to clean where isDirty is false",
    deltaReverted.isDirty === false && deltaReverted.dirtyKeys.length === 0,
  );

  // 8.3 Rebaseline clears dirty state
  mutableDraft.accountTitle = "Newly Committed Account Title";
  assert(
    "Baseline: Pre-rebaseline is dirty",
    evaluateDirty(baselineInstance, mutableDraft).isDirty === true,
  );
  const committedBaseline = rebaseline(mutableDraft);
  const deltaAfterRebaseline = evaluateDirty(committedBaseline, mutableDraft);
  assert(
    "Baseline: Rebaseline clears dirty state and sets new clean reference",
    deltaAfterRebaseline.isDirty === false && deltaAfterRebaseline.dirtyKeys.length === 0,
  );

  // 8.4 Preserved ignored keys in baseline container
  const auditBaseline = createBaseline(freshRecord, ["recInputter", "recCurrNumber"]);
  const draftWithIgnoredAudit = {
    ...freshRecord,
    recInputter: "DIFF_TELLER",
    recCurrNumber: 99,
  };
  assert(
    "Baseline: Pre-configured ignoredKeys are filtered out during evaluateDirty",
    evaluateDirty(auditBaseline, draftWithIgnoredAudit).isDirty === false,
  );

  // ============================================================================
  // --- Master Summary ---
  // ============================================================================
  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(`ALL ${reports.length} RECORD DELTA TEST CASES PASSED WITH 100% SUCCESS!`);
  } else {
    const failedCount = reports.filter((r) => !r.passed).length;
    console.error(`FAILED: ${failedCount} OF ${reports.length} TESTS FAILED!`);
    process.exit(1);
  }
  console.log("========================================================\n");
}

runSuite().catch((err: unknown) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});

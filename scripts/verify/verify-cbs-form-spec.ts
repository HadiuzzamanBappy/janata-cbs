/**
 * Automated Verification Suite for CBS Form Spec & Compiler Engine (@/lib/cbs-form-spec)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/cbs-form-spec` with explicit Input and Output visualization:
 * 1. Semantic Width Mapping (defaultWidthForLength: xs, sm, md, lg, full)
 * 2. Fallback Layout Compilation (buildFallbackSections: 12-col card layout when no custom layout)
 * 3. Custom Layout Compilation & Model Rules Merging (compileFormSpec: preserves layout, enforces model constraints)
 * 4. Headless Value Validation (validateValues: required, numeric/digits, date, length, clean state)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-cbs-form-spec.ts
 */

import {
  applyFieldTransform,
  buildRenderBlocks,
  compileFormSpec,
  defaultWidthForLength,
  deleteFieldValue,
  deriveSemanticWidth,
  evaluateFieldCascade,
  evaluateFieldCondition,
  getBlockGapSectionIndex,
  getFieldColSpanClass,
  getFieldValue,
  getGridColsClass,
  getInputWidthClass,
  resolveWidgetType,
  setFieldValue,
  validateSingleField,
  validateValues,
} from "@/lib/cbs-form-spec";
import type { FormConfigRecord, ModelConfigRecord } from "@/lib/data-schemas";

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

// Canonical Test Model Definition (Account Model)
const testModel: ModelConfigRecord = {
  TABLENAME: "ACCOUNT",
  DESCRIPTION: "Customer Account Definition",
  PREFIX: "AC",
  SERVICEPATH: "account.service",
  ACCESS: "BRANCH",
  SEARCHABLE: true,
  USERDEFINEID: false,
  READONLY: false,
  AUTHORIZE: true,
  ASSOCIATES: [],
  _DEVBY: "SYSTEM",
  _DEVDATE: "2026-10-20",
  IDROUTINE: "",
  FIELDBASED: false,
  IDDEF: {
    IDPREFIX: "AC",
    IDPATTERN: "AC{YYYY}{SEQ:6}",
    SEQUENCELENGTH: 6,
    SEQUENCERESET: false,
  },
  PROPERTIES: [
    {
      SN: "1",
      NAME: "accountNumber",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 12,
      REQUIRED: true,
    },
    {
      SN: "2",
      NAME: "accountTitle",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      REQUIRED: true,
    },
    {
      SN: "3",
      NAME: "balance",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 10,
      REQUIRED: false,
    },
    {
      SN: "4",
      NAME: "openingDate",
      TYPE: "Date",
      STRUCTURE: "S",
      LENGTH: 10,
      REQUIRED: false,
    },
    {
      SN: "5",
      NAME: "nomineeShare",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 3,
      REQUIRED: true,
    },
  ],
};

async function runSuite() {
  console.log("\n================================================================================");
  console.log("             CBS FORM SPEC COMPILER & VALIDATION VERIFICATION                   ");
  console.log("================================================================================");
  console.log(" Architecture : Pure Headless Form Engine (@/lib/cbs-form-spec)");
  console.log(" Pattern      : Single Unique Test per Compiler/Rule Capability with Visible IO");
  console.log("================================================================================");

  // ── 1. Responsive Numerical & Semantic Width Mapping ──
  console.log("\n── 1. Responsive Numerical & Semantic Width Mapping (defaultWidthForLength) ──");
  const wShort = defaultWidthForLength({
    SN: "1",
    NAME: "code",
    TYPE: "String",
    STRUCTURE: "S",
    LENGTH: 4,
    REQUIRED: false,
  });
  recordTest(
    "1.1 Maps short field length (<= 6) to 'xs' semantic token",
    { length: 4 },
    { width: wShort },
    wShort === "xs",
  );

  const wLong = defaultWidthForLength({
    SN: "2",
    NAME: "narrative",
    TYPE: "String",
    STRUCTURE: "S",
    LENGTH: 120,
    REQUIRED: false,
  });
  recordTest(
    "1.2 Maps long field length (120) to 'xl' semantic token",
    { length: 120 },
    { width: wLong },
    wLong === "xl",
  );

  const wDate = defaultWidthForLength({
    SN: "3",
    NAME: "openingDate",
    TYPE: "Date",
    STRUCTURE: "S",
    LENGTH: 10,
    REQUIRED: true,
  });
  recordTest(
    "1.3 Maps Date type to 'sm' semantic token regardless of length",
    { type: "Date", length: 10 },
    { width: wDate },
    wDate === "sm",
  );

  const wExplicitPreserved = deriveSemanticWidth("lg", 4, "String");
  const resolvedSelect = resolveWidgetType("String", {
    type: "O",
    data: [{ code: "A", label: "Active" }],
  });
  recordTest(
    "1.4 Canonical Formulas: deriveSemanticWidth preserves explicit token & resolveWidgetType infers lookup 'select'",
    { explicitInput: "lg", paramType: "O" },
    { derivedWidth: wExplicitPreserved, resolvedWidget: resolvedSelect },
    wExplicitPreserved === "lg" && resolvedSelect === "select",
  );

  // ── 2. Fallback Layout Compilation ──
  console.log("\n── 2. Fallback Layout Compilation (compileFormSpec) ──");
  const fallback = compileFormSpec(testModel, null);
  recordTest(
    "2.1 Generates canonical 12-column card fallback section when no custom layout exists",
    { model: testModel.TABLENAME, layout: null },
    {
      title: fallback.title,
      sectionsCount: fallback.frmElements.sections.length,
      firstSectionId: fallback.frmElements.sections[0]?.id,
      fieldsCount: fallback.frmElements.sections[0]?.fields.length,
      generatedFirstLabel: fallback.frmElements.sections[0]?.fields[0]?.LABEL,
    },
    fallback.title === "Customer Account Definition" &&
      fallback.frmElements.sections.length === 1 &&
      fallback.frmElements.sections[0]?.fields.length === testModel.PROPERTIES.length &&
      fallback.frmElements.sections[0]?.fields[0]?.LABEL === "Account Number",
  );

  // ── 3. Custom Layout Compilation & Model Rules Merging ──
  console.log("\n── 3. Custom Layout Composition & Model Constraints ──");
  const customLayout: FormConfigRecord = {
    title: "Account Custom Form",
    description: "Tailored view",
    authNumber: 1,
    frmRoutine: { rtnValidate: [], rtnBeforeAuth: [], rtnAfterAuth: [] },
    frmElements: {
      sections: [
        {
          id: "sec_custom",
          title: "Primary Info",
          containerType: "card",
          fields: [
            {
              SN: "1",
              NAME: "accountNumber",
              LABEL: "Bank A/C Number", // Custom label
              TYPE: "String",
              LENGTH: 0, // Fallback to model physical length (12)
              STRUCTURE: "S",
              REQUIRED: false, // Model constraint (true) must take precedence
              DISABLED: false,
              WIDTH: "md",
              POSITION: "",
            },
          ],
        },
      ],
    },
  };
  const compiledCustom = compileFormSpec(testModel, customLayout);
  const customField = compiledCustom.frmElements.sections[0]?.fields[0];
  recordTest(
    "3.1 Preserves visual layout styling while enforcing physical ModelConfig constraints",
    { customLayoutTitle: customLayout.title, fieldName: "accountNumber" },
    {
      fieldLabel: customField?.LABEL,
      fieldLength: customField?.LENGTH,
      fieldRequired: customField?.REQUIRED,
    },
    customField?.LABEL === "Bank A/C Number" &&
      customField?.LENGTH === 12 &&
      customField?.REQUIRED === true,
  );

  const advancedLayout: FormConfigRecord = {
    title: "Advanced Layout",
    frmElements: {
      sections: [
        {
          id: "sec_adv",
          containerType: "card",
          fields: [
            {
              SN: "1",
              NAME: "accountNumber",
              LABEL: "A/C Number",
              TYPE: "String",
              STRUCTURE: "S",
              LENGTH: 12,
              TRANSFORM: "uppercase",
              CASCADE: [{ when: "SAVINGS", set: { balance: 500 } }],
              ON_CHANGE: { target: "accountTitle", action: "copy" },
              HIDDEN_WHEN: { field: "USERDEFINEID", operator: "truthy" },
              RATE_CONFIG: { decimals: 4, allowNegative: false, suffix: "%" },
            },
          ],
        },
      ],
    },
  };
  const compiledAdv = compileFormSpec(testModel, advancedLayout);
  const advField = compiledAdv.frmElements.sections[0]?.fields[0];
  recordTest(
    "3.2 Preserves all advanced FormElement properties (CASCADE, TRANSFORM, RATE_CONFIG, ON_CHANGE, HIDDEN_WHEN)",
    { fieldName: "accountNumber" },
    {
      transform: advField?.TRANSFORM,
      hasCascade: Boolean(advField?.CASCADE),
      hasOnChange: Boolean(advField?.ON_CHANGE),
      hasHiddenWhen: Boolean(advField?.HIDDEN_WHEN),
      hasRateConfig: Boolean(advField?.RATE_CONFIG),
    },
    advField?.TRANSFORM === "uppercase" &&
      Array.isArray(advField?.CASCADE) &&
      advField?.ON_CHANGE?.target === "accountTitle" &&
      advField?.HIDDEN_WHEN !== undefined &&
      advField?.RATE_CONFIG?.suffix === "%",
  );

  // ── 4. Headless Value Validation ──
  console.log("\n── 4. Headless Runtime Value Validation (validateValues) ──");
  const requiredErrors = validateValues(fallback, {});
  recordTest(
    "4.1 Flags missing mandatory required fields on empty draft",
    { values: {} },
    requiredErrors,
    requiredErrors.accountNumber === "Account Number is required" &&
      requiredErrors.accountTitle === "Account Title is required" &&
      requiredErrors.balance === undefined,
  );

  const lengthErrors = validateValues(fallback, {
    accountNumber: "AC1234567890EXTRA", // 17 chars > max 12
    accountTitle: "Janata Bank Checking",
  });
  recordTest(
    "4.2 Flags text values exceeding physical max character length",
    { accountNumber: "AC1234567890EXTRA (17 chars)", maxAllowed: 12 },
    lengthErrors,
    lengthErrors.accountNumber === "Account Number cannot exceed 12 characters",
  );

  const numErrors = validateValues(fallback, {
    accountNumber: "AC10001",
    accountTitle: "Title",
    balance: "not-a-number",
    nomineeShare: 10000, // 5 digits > max 3
  });
  recordTest(
    "4.3 Flags invalid numeric formats and digit count limits",
    { balance: "not-a-number", nomineeShare: 10000 },
    numErrors,
    numErrors.balance === "Balance must be a valid number" &&
      numErrors.nomineeShare === "Nominee Share cannot exceed 3 digits",
  );

  const dateErrors = validateValues(fallback, {
    accountNumber: "AC10001",
    accountTitle: "Title",
    openingDate: "invalid-date-string",
  });
  recordTest(
    "4.4 Flags unparseable or malformed date strings",
    { openingDate: "invalid-date-string" },
    dateErrors,
    dateErrors.openingDate === "Opening Date must be a valid date",
  );

  const cleanErrors = validateValues(fallback, {
    accountNumber: "AC10000001",
    accountTitle: "Janata Bank Main Checking",
    balance: 50000,
    openingDate: "2026-10-20",
    nomineeShare: 100,
  });
  recordTest(
    "4.5 Passes clean valid form values with zero validation errors",
    { values: "Valid account data payload" },
    cleanErrors,
    Object.keys(cleanErrors).length === 0,
  );

  const boolValid = validateSingleField(
    { required: false, length: 1, type: "Boolean", label: "User Define Id" },
    false,
  );
  recordTest(
    "4.6 Validates boolean fields (true/false) with length 1 without character length errors",
    { value: false, length: 1, type: "Boolean" },
    { error: boolValid },
    boolValid === null,
  );

  const timeValid = validateSingleField(
    { required: true, type: "Time", label: "Transaction Time" },
    "14:30",
  );
  const timeInvalid = validateSingleField(
    { required: true, type: "Time", label: "Transaction Time" },
    "invalid-time",
  );
  recordTest(
    "4.7 Validates Time format (HH:mm) accurately",
    { valid: "14:30", invalid: "invalid-time" },
    { validRes: timeValid, invalidRes: timeInvalid },
    timeValid === null && timeInvalid === "Transaction Time must be a valid time (HH:mm)",
  );

  const customRuleErrors = validateSingleField(
    {
      required: true,
      label: "Custom Code",
      type: "String",
      validation: {
        matches: "^[A-Z]{3}$",
        message: "Code must be exactly 3 uppercase letters",
      },
    },
    "abcd",
  );
  recordTest(
    "4.8 Evaluates custom validation matches regex with custom message",
    { value: "abcd", regex: "^[A-Z]{3}$" },
    { error: customRuleErrors },
    customRuleErrors === "Code must be exactly 3 uppercase letters",
  );

  const nestedObjSection = [
    {
      id: "sec_obj",
      containerType: "card" as const,
      fields: [
        {
          SN: "1",
          NAME: "AUDIT_DETAILS",
          TYPE: "Json" as const,
          STRUCTURE: "S" as const,
          LENGTH: 0,
          PROP: [
            {
              SN: "1.1",
              NAME: "reviewer",
              LABEL: "Reviewer Name",
              TYPE: "String" as const,
              STRUCTURE: "S" as const,
              LENGTH: 35,
              REQUIRED: true,
            },
          ],
        },
      ],
    },
  ];
  const nestedErrors = validateValues(nestedObjSection, {
    AUDIT_DETAILS: { reviewer: "" },
  });
  recordTest(
    "4.9 Recursively validates nested sub-properties (PROP) in object fields",
    { data: { AUDIT_DETAILS: { reviewer: "" } } },
    nestedErrors,
    nestedErrors["AUDIT_DETAILS.reviewer"] === "Reviewer Name is required",
  );

  // ── 5. Reactive Field Condition Evaluation (evaluateFieldCondition) ──
  console.log("\n── 5. Reactive Field Condition Evaluation (evaluateFieldCondition) ──");

  const condEqPass = evaluateFieldCondition(
    { field: "TYPE", operator: "eq", value: "Boolean" },
    { TYPE: "Boolean" },
  );
  recordTest(
    "5.1 Matches single field equality ('eq') correctly",
    { condition: { field: "TYPE", operator: "eq", value: "Boolean" }, values: { TYPE: "Boolean" } },
    { result: condEqPass },
    condEqPass === true,
  );

  const condInPass = evaluateFieldCondition(
    { field: "TYPE", operator: "in", value: ["Json", "Object", "Date", "Boolean"] },
    { TYPE: "Json" },
  );
  const condInFail = evaluateFieldCondition(
    { field: "TYPE", operator: "in", value: ["Json", "Object", "Date", "Boolean"] },
    { TYPE: "String" },
  );
  recordTest(
    "5.2 Matches single field inclusion ('in') and non-inclusion correctly",
    { targetIn: "Json", targetNotIn: "String" },
    { inMatches: condInPass, notInFails: !condInFail },
    condInPass === true && condInFail === false,
  );

  const condCompoundPass = evaluateFieldCondition(
    {
      and: [
        { field: "TYPE", operator: "eq", value: "Number" },
        { field: "balance", operator: "gt", value: 1000 },
      ],
    },
    { TYPE: "Number", balance: 5000 },
  );
  recordTest(
    "5.3 Evaluates compound 'and' condition accurately",
    { TYPE: "Number", balance: 5000 },
    { result: condCompoundPass },
    condCompoundPass === true,
  );

  const condHiddenPass = evaluateFieldCondition(
    { field: "USERDEFINEID", operator: "truthy" },
    { USERDEFINEID: true },
  );
  recordTest(
    "5.4 Evaluates HIDDEN_WHEN / truthy condition accurately",
    { USERDEFINEID: true },
    { isHidden: condHiddenPass },
    condHiddenPass === true,
  );

  // ── 6. Declarative Field Value Transforms & Cascades (applyFieldTransform & evaluateFieldCascade) ──
  console.log("\n── 6. Declarative Field Value Transforms & Cascades ──");

  const transformedStrip = applyFieldTransform("stripWhitespace", "  account Number 123  ");
  recordTest(
    "6.1 Strips all whitespace with 'stripWhitespace' transform",
    "  account Number 123  ",
    transformedStrip,
    transformedStrip === "accountNumber123",
  );

  const transformedUpper = applyFieldTransform("uppercase", "test_column");
  recordTest(
    "6.2 Converts string to uppercase with 'uppercase' transform",
    "test_column",
    transformedUpper,
    transformedUpper === "TEST_COLUMN",
  );

  const cascadeRules = [
    { when: "Date", set: { LENGTH: 10, PROP: undefined } },
    { when: "Boolean", set: { LENGTH: 1, STRUCTURE: "S" } },
    { when: ["Json", "Object"], set: { LENGTH: 0, PROP: [] } },
  ];

  const cascadeBoolean = evaluateFieldCascade(cascadeRules, "Boolean");
  recordTest(
    "6.3 Evaluates single value cascade correctly",
    { targetType: "Boolean" },
    cascadeBoolean,
    cascadeBoolean?.LENGTH === 1 && cascadeBoolean?.STRUCTURE === "S",
  );

  const cascadeJson = evaluateFieldCascade(cascadeRules, "Json");
  recordTest(
    "6.4 Evaluates multi-match array cascade correctly",
    { targetType: "Json" },
    cascadeJson,
    cascadeJson?.LENGTH === 0 && Array.isArray(cascadeJson?.PROP),
  );

  // ── 7. Render Block Clustering & Layout Navigation ──
  console.log("\n── 7. Render Block Clustering & Layout Navigation ──");

  const layoutSections = [
    { id: "sec_card1", containerType: "card" as const, fields: [] },
    { id: "sec_tab1", containerType: "tab" as const, groupId: "grp_tabs", fields: [] },
    { id: "sec_tab2", containerType: "tab" as const, groupId: "grp_tabs", fields: [] },
    { id: "sec_card2", containerType: "card" as const, fields: [] },
  ];
  const clusteredBlocks = buildRenderBlocks(layoutSections);
  recordTest(
    "7.1 Clusters contiguous tabs into tab-group block and keeps cards separate",
    { totalSections: layoutSections.length },
    { totalBlocks: clusteredBlocks.length, blockTypes: clusteredBlocks.map((b) => b.type) },
    clusteredBlocks.length === 3 &&
      clusteredBlocks[0]?.type === "single" &&
      clusteredBlocks[1]?.type === "tab-group" &&
      clusteredBlocks[1]?.tabSections.length === 2 &&
      clusteredBlocks[2]?.type === "single",
  );

  const gapIdx = getBlockGapSectionIndex(clusteredBlocks, layoutSections, 2);
  recordTest(
    "7.2 Resolves raw section insertion index from block gap correctly",
    { targetBlockGap: 2 },
    { sectionIndex: gapIdx },
    gapIdx === 3,
  );

  // ── 8. Layout Grid & Input Width Classes ──
  console.log("\n── 8. Layout Grid & Input Width Classes ──");

  const inputWidthSwitch = getInputWidthClass(undefined, undefined, "Boolean", "switch");
  const inputWidthTime = getInputWidthClass(undefined, undefined, "Time", "time");
  const inputWidthTextMd = getInputWidthClass("md", 35, "String", "text");
  recordTest(
    "8.1 Resolves specialized input widths for boolean, time, and standard semantic tokens",
    { switch: "switch", time: "time", textMd: "md" },
    { switchWidth: inputWidthSwitch, timeWidth: inputWidthTime, textWidth: inputWidthTextMd },
    inputWidthSwitch === "w-auto" &&
      inputWidthTime === "w-full sm:max-w-36" &&
      inputWidthTextMd === "w-full sm:max-w-72",
  );

  const gridCols12 = getGridColsClass(12);
  const gridCols2 = getGridColsClass(2);
  recordTest(
    "8.2 Maps grid column configuration to responsive grid CSS classes",
    { cols12: 12, cols2: 2 },
    { css12: gridCols12, css2: gridCols2 },
    gridCols12 === "grid-cols-12" && gridCols2 === "grid-cols-1 md:grid-cols-2",
  );

  const colSpanSingle = getFieldColSpanClass(1, "md", 35, "String");
  const colSpan12Md = getFieldColSpanClass(12, "md", 35, "String");
  recordTest(
    "8.3 Computes field cell column spans across single-col and 12-col grids",
    { cols1: 1, cols12: 12 },
    { span1: colSpanSingle, span12: colSpan12Md },
    colSpanSingle === "w-full col-span-1" && colSpan12Md === "col-span-12 md:col-span-4",
  );

  // ── 9. Path Utilities (getFieldValue, setFieldValue, deleteFieldValue) ──
  console.log("\n── 9. Path Utilities (getFieldValue, setFieldValue, deleteFieldValue) ──");

  const initialRecord = {
    accountNumber: "AC1001",
    CUSTOMER: {
      profile: {
        name: "Jane Doe",
      },
      tags: ["vip", "retail"],
    },
    "FLAT.KEY": "DirectValue",
  };

  const directHit = getFieldValue(initialRecord, "FLAT.KEY");
  const nestedHit = getFieldValue(initialRecord, "CUSTOMER.profile.name");
  const missingHit = getFieldValue(initialRecord, "CUSTOMER.profile.missing");
  recordTest(
    "9.1 Safely reads direct flattened keys and deeply nested dot-paths",
    { directPath: "FLAT.KEY", nestedPath: "CUSTOMER.profile.name" },
    { directHit, nestedHit, missingHit },
    directHit === "DirectValue" && nestedHit === "Jane Doe" && missingHit === undefined,
  );

  const updatedRecord = setFieldValue(initialRecord, "CUSTOMER.profile.name", "John Smith");
  const addedArrayElem = setFieldValue(updatedRecord, "CUSTOMER.tags.2", "priority");
  recordTest(
    "9.2 Immutably sets nested object and array values without mutating source record",
    { updatedPath: "CUSTOMER.profile.name", addedPath: "CUSTOMER.tags.2" },
    {
      originalName: initialRecord.CUSTOMER.profile.name,
      updatedName: updatedRecord.CUSTOMER.profile.name,
      newTag: addedArrayElem.CUSTOMER.tags[2],
    },
    initialRecord.CUSTOMER.profile.name === "Jane Doe" &&
      updatedRecord.CUSTOMER.profile.name === "John Smith" &&
      addedArrayElem.CUSTOMER.tags[2] === "priority",
  );

  const deletedRecord = deleteFieldValue(addedArrayElem, "CUSTOMER.profile.name");
  recordTest(
    "9.3 Immutably deletes nested keys without mutating source record",
    { deletePath: "CUSTOMER.profile.name" },
    {
      deletedResult: getFieldValue(deletedRecord, "CUSTOMER.profile.name"),
      priorResult: getFieldValue(addedArrayElem, "CUSTOMER.profile.name"),
    },
    getFieldValue(deletedRecord, "CUSTOMER.profile.name") === undefined &&
      getFieldValue(addedArrayElem, "CUSTOMER.profile.name") === "John Smith",
  );

  // Consolidated Summary
  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  console.log("\n================================================================================");
  if (failedTests === 0) {
    console.log(
      `>>> SUCCESS: ALL ${passedTests} FORM SPEC & VALIDATION CAPABILITIES VALIDATED 100% CLEAN! <<<`,
    );
  } else {
    console.error(`>>> FAILURE: ${failedTests} TESTS FAILED! <<<`);
    process.exit(1);
  }
  console.log("================================================================================\n");
}

runSuite().catch((err: unknown) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});

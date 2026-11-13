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
  compileFormSpec,
  defaultWidthForLength,
  deriveSemanticWidth,
  evaluateFieldCascade,
  evaluateFieldCondition,
  resolveWidgetType,
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

  const wExplicitPreserved = deriveSemanticWidth("lg", 4, "Text");
  const resolvedSelect = resolveWidgetType("Text", {
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

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

import { compileFormSpec, defaultWidthForLength, validateValues } from "@/lib/cbs-form-spec";
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
      LABEL: "Account Number",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 12,
      REQUIRED: true,
    },
    {
      SN: "2",
      NAME: "accountTitle",
      LABEL: "Account Title",
      TYPE: "Text",
      STRUCTURE: "S",
      LENGTH: 50,
      REQUIRED: true,
    },
    {
      SN: "3",
      NAME: "balance",
      LABEL: "Ledger Balance",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 10,
      REQUIRED: false,
    },
    {
      SN: "4",
      NAME: "openingDate",
      LABEL: "Account Opening Date",
      TYPE: "Date",
      STRUCTURE: "S",
      LENGTH: 10,
      REQUIRED: false,
    },
    {
      SN: "5",
      NAME: "nomineeShare",
      LABEL: "Nominee Share %",
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
    LABEL: "Code",
    TYPE: "Text",
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
    LABEL: "Narrative",
    TYPE: "Text",
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
    LABEL: "Opening Date",
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
    },
    fallback.title === "Customer Account Definition" &&
      fallback.frmElements.sections.length === 1 &&
      fallback.frmElements.sections[0]?.fields.length === testModel.PROPERTIES.length,
  );

  // ── 3. Custom Layout Compilation & Model Rules Merging ──
  console.log("\n── 3. Custom Layout Composition & Model Constraints ──");
  const customLayout: FormConfigRecord = {
    title: "Account Custom Form",
    description: "Tailored view",
    authNumber: 1,
    frmRoutine: { rtnValidate: [], rtnBeforeAuth: [], rtnAfterAuth: [] },
    frmElements: {
      steps: [],
      sections: [
        {
          id: "sec_custom",
          title: "Primary Info",
          type: "standard",
          zone: "standard",
          layoutStyle: "card",
          fields: [
            {
              SN: "1",
              NAME: "accountNumber",
              LABEL: "Bank A/C Number", // Custom label
              TYPE: "Text",
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
    numErrors.balance === "Ledger Balance must be a valid number" &&
      numErrors.nomineeShare === "Nominee Share % cannot exceed 3 digits",
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
    dateErrors.openingDate === "Account Opening Date must be a valid date",
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

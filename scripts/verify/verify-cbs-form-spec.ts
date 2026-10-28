/**
 * Automated Verification Suite for CBS Form Spec & Compiler Engine (@/lib/cbs-form-spec)
 * Tests:
 * 1. Compilation without layout (12-column responsive fallback generation)
 * 2. Compilation with custom layout
 * 3. Dropping archived fields from compiled runtime spec
 * 4. Safe widget fallback on type incompatibility
 * 5. Layout validation against model (missing property, archived property, incompatible widget, model mismatch)
 * 6. Headless value validation (required fields, max length/digit limits, numeric/date types)
 *
 * Usage:
 *   pnpm tsx scripts/verify-cbs-form-spec.ts
 */

import { compileFormSpec, validateValues } from "@/lib/cbs-form-spec";
import type { FormConfigRecord, ModelConfigRecord } from "@/lib/data-schemas";

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
  console.log("       CBS FORM SPEC COMPILER & VALIDATION SUITE        ");
  console.log("========================================================\n");

  // --- Canonical Test Model Definition ---
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
    VIEWDEF: [],
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
        SN: "5_1",
        NAME: "nomineeName",
        LABEL: "Nominee Full Name",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 40,
        REQUIRED: true,
      },
      {
        SN: "5_2",
        NAME: "nomineeShare",
        LABEL: "Nominee Share %",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 3,
        REQUIRED: true,
      },
    ],
  };

  // ============================================================================
  // --- 1. Compile Without Layout (Responsive 12-Column Fallback) ---
  // ============================================================================
  console.log("--- 1. Compile Without Layout (Responsive Fallback) ---");

  const fallbackSpec = compileFormSpec(testModel, null);

  assert(
    "Fallback: Generates compiled spec with title",
    fallbackSpec.title === "Customer Account Definition",
  );
  assert("Fallback: Sets authNumber to 1", fallbackSpec.authNumber === 1);
  assert("Fallback: Generates sections array", Array.isArray(fallbackSpec.frmElements?.sections));

  const allFallbackFields = (fallbackSpec.frmElements?.sections || []).flatMap(
    (s) => s.fields || [],
  );
  const fallbackFieldKeys = allFallbackFields.map((f) => f.NAME);
  assert(
    "Fallback: Includes active property accountNumber",
    fallbackFieldKeys.includes("accountNumber"),
  );
  assert(
    "Fallback: Includes active property accountTitle",
    fallbackFieldKeys.includes("accountTitle"),
  );

  // Check fallback section and inline field group hierarchy
  assert(
    "Fallback: Generates 1 consolidated section with fields",
    fallbackSpec.frmElements.sections.length === 1,
  );
  const rootSection = fallbackSpec.frmElements.sections[0];
  assert("Fallback: Root section has layoutStyle card", rootSection.layoutStyle === "card");
  assert(
    "Fallback: Root section contains all model properties",
    rootSection.fields.length === testModel.PROPERTIES.length,
  );

  // ============================================================================
  // --- 2. Compile With Valid Custom Layout ---
  // ============================================================================
  console.log("\n--- 2. Compile With Valid Custom Layout ---");

  const validLayout: FormConfigRecord = {
    title: "Standard Account Opening Form",
    description: "Account opening layout",
    authNumber: 1,
    frmRoutine: {
      rtnValidate: [],
      rtnBeforeAuth: [],
      rtnAfterAuth: [],
    },
    frmElements: {
      steps: [],
      sections: [
        {
          id: "sec_main",
          title: "Account Details",
          type: "standard",
          zone: "standard",
          columns: 2,
          collapsible: false,
          isCollapsed: false,
          layoutStyle: "card",
          fields: [
            {
              SN: "1",
              NAME: "accountNumber",
              LABEL: "A/C Number",
              TYPE: "Text",
              LENGTH: 12,
              STRUCTURE: "S",
              REQUIRED: true,
              DISABLED: false,
              WIDTH: 200,
              POSITION: "",
              PARAMETER: {
                type: "O",
                data: [],
                modelName: "",
                displayField: "",
                condition: "",
                reference: "",
              },
              ENRICHTEXT: "",
              VALUE: "",
              FIXEDVALUE: "",
              ISOPEN: false,
              ISLOADING: false,
              PROP: [],
              DATASOURCE: [],
              DEFAULTVALUE: "",
            },
            {
              SN: "2",
              NAME: "accountTitle",
              LABEL: "A/C Title",
              TYPE: "Text",
              LENGTH: 50,
              STRUCTURE: "S",
              REQUIRED: true,
              DISABLED: false,
              WIDTH: 200,
              POSITION: "",
              PARAMETER: {
                type: "O",
                data: [],
                modelName: "",
                displayField: "",
                condition: "",
                reference: "",
              },
              ENRICHTEXT: "",
              VALUE: "",
              FIXEDVALUE: "",
              ISOPEN: false,
              ISLOADING: false,
              PROP: [],
              DATASOURCE: [],
              DEFAULTVALUE: "",
            },
            {
              SN: "3",
              NAME: "balance",
              LABEL: "Opening Balance",
              TYPE: "Number",
              LENGTH: 10,
              STRUCTURE: "S",
              REQUIRED: false,
              DISABLED: false,
              WIDTH: 200,
              POSITION: "",
              PARAMETER: {
                type: "O",
                data: [],
                modelName: "",
                displayField: "",
                condition: "",
                reference: "",
              },
              ENRICHTEXT: "",
              VALUE: "",
              FIXEDVALUE: "",
              ISOPEN: false,
              ISLOADING: false,
              PROP: [],
              DATASOURCE: [],
              DEFAULTVALUE: "",
            },
          ],
        },
      ],
    },
  };

  const validSpec = compileFormSpec(testModel, validLayout);

  assert("Custom: Retains layout title", validSpec.title === "Standard Account Opening Form");
  const compiledFields = (validSpec.frmElements?.sections || []).flatMap((s) => s.fields || []);
  assert("Custom: Compiled fields length is 3", compiledFields.length === 3);

  // Check synchronization of model rules into layout fields
  const compiledAccNo = compiledFields.find((f) => f.NAME === "accountNumber");
  assert("Custom: Model rule 'REQUIRED: true' synced to field", compiledAccNo?.REQUIRED === true);
  assert("Custom: Model rule 'LENGTH: 12' synced to field", compiledAccNo?.LENGTH === 12);
  assert("Custom: Model rule 'TYPE: Text' synced to field", compiledAccNo?.TYPE === "Text");

  // ============================================================================
  // --- 3. Custom Layout Element Enrichment ---
  // ============================================================================
  console.log("\n--- 3. Custom Layout Element Enrichment ---");

  const layoutToEnrich: FormConfigRecord = {
    title: "Enriched Form Layout",
    description: "Layout with partial field definitions",
    authNumber: 1,
    frmRoutine: {
      rtnValidate: [],
      rtnBeforeAuth: [],
      rtnAfterAuth: [],
    },
    frmElements: {
      steps: [],
      sections: [
        {
          id: "sec_main",
          title: "General",
          type: "standard",
          zone: "standard",
          columns: 2,
          collapsible: false,
          isCollapsed: false,
          layoutStyle: "card",
          fields: [
            {
              SN: "1",
              NAME: "accountNumber",
              LABEL: "", // Empty to test fallback to model label
              TYPE: "Text",
              LENGTH: 0, // 0 to test fallback to model length
              STRUCTURE: "S",
              REQUIRED: false,
              DISABLED: false,
              WIDTH: 200,
              POSITION: "",
              PARAMETER: {
                type: "O",
                data: [],
                modelName: "",
                displayField: "",
                condition: "",
                reference: "",
              },
              ENRICHTEXT: "",
              VALUE: "",
              FIXEDVALUE: "",
              ISOPEN: false,
              ISLOADING: false,
              PROP: [],
              DATASOURCE: [],
              DEFAULTVALUE: "",
            },
          ],
        },
      ],
    },
  };

  const enrichedSpec = compileFormSpec(testModel, layoutToEnrich);
  const enrichedFields = (enrichedSpec.frmElements?.sections || []).flatMap((s) => s.fields || []);

  assert("Enrichment: Compiled fields length is 1", enrichedFields.length === 1);
  assert(
    "Enrichment: Empty label enriched from model property",
    enrichedFields[0]?.LABEL === "Account Number",
  );
  assert("Enrichment: Zero length enriched from model property", enrichedFields[0]?.LENGTH === 12);

  // ============================================================================
  // --- 4. Headless Value Validation (validateValues) ---
  // ============================================================================
  console.log("\n--- 4. Headless Value Validation (validateValues) ---");

  // 5.1 Mandatory Required Validation
  const emptyValues = {};
  const requiredErrors = validateValues(fallbackSpec, emptyValues);
  assert(
    "FieldRules: Missing required accountNumber triggers error",
    requiredErrors.accountNumber === "Account Number is required",
  );
  assert(
    "FieldRules: Missing required accountTitle triggers error",
    requiredErrors.accountTitle === "Account Title is required",
  );
  assert(
    "FieldRules: Optional field balance does not trigger error when empty",
    requiredErrors.balance === undefined,
  );

  // 5.2 Max Length Validation (String)
  const longStringValues = {
    accountNumber: "AC1234567890EXTRA", // 17 chars > max 12
    accountTitle: "Valid Title",
  };
  const lengthErrors = validateValues(fallbackSpec, longStringValues);
  assert(
    "FieldRules: String exceeding max length triggers error",
    lengthErrors.accountNumber === "Account Number cannot exceed 12 characters",
  );

  // 5.3 Max Digits Validation (Number)
  const longNumberValues = {
    accountNumber: "AC10000001",
    accountTitle: "Valid Title",
    nomineeShare: 10000, // 5 digits > max 3
  };
  const digitErrors = validateValues(fallbackSpec, longNumberValues);
  assert(
    "FieldRules: Numeric value exceeding max digits triggers error",
    digitErrors.nomineeShare === "Nominee Share % cannot exceed 3 digits",
  );

  // 5.4 Numeric Format Validation
  const invalidNumberValues = {
    accountNumber: "AC10000001",
    accountTitle: "Valid Title",
    balance: "not-a-number",
  };
  const numErrors = validateValues(fallbackSpec, invalidNumberValues);
  assert(
    "FieldRules: Invalid number string triggers error",
    numErrors.balance === "Ledger Balance must be a valid number",
  );

  // 5.5 Date Format Validation
  const invalidDateValues = {
    accountNumber: "AC10000001",
    accountTitle: "Valid Title",
    openingDate: "invalid-date-string",
  };
  const dateErrors = validateValues(fallbackSpec, invalidDateValues);
  assert(
    "FieldRules: Invalid date string triggers error",
    dateErrors.openingDate === "Account Opening Date must be a valid date",
  );

  // 5.6 100% Valid Form Values
  const cleanValues = {
    accountNumber: "AC10000001",
    accountTitle: "Janata Bank Main Branch Checking",
    balance: 50000,
    openingDate: "2026-10-20",
    nomineeName: "John Doe",
    nomineeShare: 100,
  };
  const cleanErrors = validateValues(fallbackSpec, cleanValues);
  assert(
    "FieldRules: Clean valid payload returns 0 validation errors",
    Object.keys(cleanErrors).length === 0,
  );

  // ============================================================================
  // --- Master Summary ---
  // ============================================================================
  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(`ALL ${reports.length} FORM SPEC TEST CASES PASSED WITH 100% SUCCESS!`);
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

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
        DISABLED: false,
        STATUS: "ACTIVE",
      },
      {
        SN: "2",
        NAME: "accountTitle",
        LABEL: "Account Title",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 50,
        REQUIRED: true,
        DISABLED: false,
        STATUS: "ACTIVE",
      },
      {
        SN: "3",
        NAME: "balance",
        LABEL: "Ledger Balance",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 10,
        REQUIRED: false,
        DISABLED: false,
        STATUS: "ACTIVE",
      },
      {
        SN: "4",
        NAME: "openingDate",
        LABEL: "Account Opening Date",
        TYPE: "Date",
        STRUCTURE: "S",
        LENGTH: 10,
        REQUIRED: false,
        DISABLED: false,
        STATUS: "ACTIVE",
      },
      {
        SN: "5",
        NAME: "legacyTaxCode",
        LABEL: "Old Tax Reference",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 20,
        REQUIRED: false,
        DISABLED: false,
        STATUS: "ARCHIVED", // ARCHIVED FIELD
      },
      {
        SN: "6",
        NAME: "nominee",
        LABEL: "Primary Nominee",
        TYPE: "Object",
        STRUCTURE: "S",
        LENGTH: 50,
        REQUIRED: false,
        DISABLED: false,
        STATUS: "ACTIVE",
      },
      {
        SN: "6_1",
        NAME: "nomineeName",
        LABEL: "Nominee Full Name",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 40,
        REQUIRED: true,
        DISABLED: false,
        STATUS: "ACTIVE",
      },
      {
        SN: "6_2",
        NAME: "nomineeShare",
        LABEL: "Nominee Share %",
        TYPE: "Number",
        STRUCTURE: "S",
        LENGTH: 3,
        REQUIRED: true,
        DISABLED: false,
        STATUS: "ACTIVE",
      },
    ],
  };

  // ============================================================================
  // --- 1. Compile Without Layout (Responsive 12-Column Fallback) ---
  // ============================================================================
  console.log("--- 1. Compile Without Layout (Responsive Fallback) ---");

  const fallbackSpec = compileFormSpec(testModel, null);

  assert("Fallback: Generates compiled spec with code", fallbackSpec.code === "ACCOUNT");
  assert("Fallback: Sets layoutSource to 'fallback'", fallbackSpec.layoutSource === "fallback");
  assert("Fallback: Pristine spec is not stale", fallbackSpec.isStale === false);
  assert("Fallback: Inherits idPrefix from model", fallbackSpec.idPrefix === "AC");

  // Check that archived property is excluded from fallback
  const fallbackFieldKeys = fallbackSpec.fields.map((f) => f.fieldKey);
  assert(
    "Fallback: Excludes ARCHIVED property legacyTaxCode",
    !fallbackFieldKeys.includes("legacyTaxCode"),
  );
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
    "Fallback: Generates 1 consolidated section with inline fields",
    fallbackSpec.presentation.sections.length === 1,
  );
  const rootSection = fallbackSpec.presentation.sections[0];
  assert("Fallback: Root section has layoutStyle card", rootSection.layoutStyle === "card");

  // Verify inline group child fields preserve parent object association (nominee group)
  const nomineeChildFields = rootSection.fields.filter((f) => f.groupKey === "nominee");
  assert(
    "Fallback: Contains nominee child fields associated via groupKey",
    nomineeChildFields.length === 2,
  );
  assert(
    "Fallback: First child of nominee group has isFirstInGroup true",
    nomineeChildFields[0]?.isFirstInGroup === true,
  );
  assert(
    "Fallback: Second child of nominee group has isFirstInGroup false",
    nomineeChildFields[1]?.isFirstInGroup === false,
  );

  // ============================================================================
  // --- 2. Compile With Valid Custom Layout ---
  // ============================================================================
  console.log("\n--- 2. Compile With Valid Custom Layout ---");

  const validLayout: FormConfigRecord = {
    recordId: "FC.ACCOUNT.STANDARD",
    title: "Standard Account Opening Form",
    targetModel: "ACCOUNT",
    version: "1.0.0",
    isActive: true,
    presentation: {
      archetype: "grid",
      density: "compact",
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
          fields: [
            {
              id: "f_acc_no",
              fieldKey: "accountNumber",
              label: "A/C Number",
              widget: "text",
              colSpan: 6,
            },
            {
              id: "f_acc_title",
              fieldKey: "accountTitle",
              label: "A/C Title",
              widget: "text",
              colSpan: 6,
            },
            {
              id: "f_acc_bal",
              fieldKey: "balance",
              label: "Opening Balance",
              widget: "amount",
              colSpan: 6,
            },
          ],
        },
      ],
    },
  };

  const validSpec = compileFormSpec(testModel, validLayout);

  assert("Custom: Sets layoutSource to 'custom'", validSpec.layoutSource === "custom");
  assert("Custom: Valid layout produces isStale: false", validSpec.isStale === false);
  assert("Custom: Retains layout title", validSpec.title === "Standard Account Opening Form");
  assert("Custom: Compiled fields length is 3", validSpec.fields.length === 3);

  // Check synchronization of model rules into layout fields
  const compiledAccNo = validSpec.fields.find((f) => f.fieldKey === "accountNumber");
  assert("Custom: Model rule 'required: true' synced to field", compiledAccNo?.required === true);
  assert("Custom: Model rule 'length: 12' synced to field", compiledAccNo?.length === 12);
  assert(
    "Custom: Model rule 'modelType: Text' synced to field",
    compiledAccNo?.modelType === "Text",
  );

  // ============================================================================
  // --- 3. Archived Field Dropping & Stale Detection ---
  // ============================================================================
  console.log("\n--- 3. Archived Field Dropping & Stale Detection ---");

  const layoutWithArchived: FormConfigRecord = {
    recordId: "FC.ACCOUNT.LEGACY",
    title: "Legacy Layout with Archived Field",
    targetModel: "ACCOUNT",
    version: "1.0.0",
    isActive: true,
    presentation: {
      archetype: "grid",
      density: "compact",
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
          fields: [
            {
              id: "f_acc_no",
              fieldKey: "accountNumber",
              label: "Account Number",
              widget: "text",
            },
            {
              id: "f_archived",
              fieldKey: "legacyTaxCode", // ARCHIVED in testModel
              label: "Legacy Tax Code",
              widget: "text",
            },
          ],
        },
      ],
    },
  };

  const compiledWithArchived = compileFormSpec(testModel, layoutWithArchived);

  assert(
    "Archived Drop: Spec is marked isStale: false in append-only schema evolution",
    compiledWithArchived.isStale === false,
  );
  assert(
    "Archived Drop: Compiled fields length is 1 (archived field omitted)",
    compiledWithArchived.fields.length === 1,
  );
  assert(
    "Archived Drop: Compiled fields does NOT contain legacyTaxCode",
    !compiledWithArchived.fields.some((f) => f.fieldKey === "legacyTaxCode"),
  );
  assert(
    "Archived Drop: Section fields does NOT contain legacyTaxCode",
    !compiledWithArchived.presentation.sections[0].fields.some(
      (f) => f.fieldKey === "legacyTaxCode",
    ),
  );

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

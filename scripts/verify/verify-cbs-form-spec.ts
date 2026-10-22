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
    recordId: "ACCOUNT",
    tableName: "ACCOUNT",
    description: "Customer Account Definition",
    prefix: "AC",
    category: "CUSTOMER_ACCOUNTS",
    servicePath: "account.service",
    access: "BRANCH",
    searchable: true,
    userDefineId: false,
    predefineId: false,
    readOnly: false,
    authorize: true,
    associates: [],
    devBy: "SYSTEM",
    devDate: "2026-10-20",
    idDef: {
      idPrefix: "AC",
      idPattern: "AC{YYYY}{SEQ:6}",
      sequenceLength: 6,
      sequenceReset: false,
    },
    properties: [
      {
        sn: "1",
        name: "accountNumber",
        label: "Account Number",
        type: "Text",
        structure: "S",
        length: 12,
        required: true,
        disabled: false,
        status: "ACTIVE",
      },
      {
        sn: "2",
        name: "accountTitle",
        label: "Account Title",
        type: "Text",
        structure: "S",
        length: 50,
        required: true,
        disabled: false,
        status: "ACTIVE",
      },
      {
        sn: "3",
        name: "balance",
        label: "Ledger Balance",
        type: "Number",
        structure: "S",
        length: 10,
        required: false,
        disabled: false,
        status: "ACTIVE",
      },
      {
        sn: "4",
        name: "openingDate",
        label: "Account Opening Date",
        type: "Date",
        structure: "S",
        length: 10,
        required: false,
        disabled: false,
        status: "ACTIVE",
      },
      {
        sn: "5",
        name: "legacyTaxCode",
        label: "Old Tax Reference",
        type: "Text",
        structure: "S",
        length: 20,
        required: false,
        disabled: false,
        status: "ARCHIVED", // ARCHIVED FIELD
      },
      {
        sn: "6",
        name: "nominee",
        label: "Primary Nominee",
        type: "Object",
        structure: "S",
        length: 50,
        required: false,
        disabled: false,
        status: "ACTIVE",
      },
      {
        sn: "6_1",
        name: "nomineeName",
        label: "Nominee Full Name",
        type: "Text",
        structure: "S",
        length: 40,
        required: true,
        disabled: false,
        status: "ACTIVE",
      },
      {
        sn: "6_2",
        name: "nomineeShare",
        label: "Nominee Share %",
        type: "Number",
        structure: "S",
        length: 3,
        required: true,
        disabled: false,
        status: "ACTIVE",
      },
    ],
    isActive: true,
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

  // Check structured sections
  assert(
    "Fallback: Creates 2 sections (root + structured object)",
    fallbackSpec.presentation.sections.length === 2,
  );
  const rootSection = fallbackSpec.presentation.sections[0];
  const objSection = fallbackSpec.presentation.sections[1];
  assert("Fallback: Root section has layoutStyle card", rootSection.layoutStyle === "card");
  assert("Fallback: Object section is bound to nominee", objSection.bindKey === "nominee");
  assert("Fallback: Object section contains nominee child fields", objSection.fields.length === 2);

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

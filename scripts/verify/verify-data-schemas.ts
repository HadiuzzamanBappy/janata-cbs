/**
 * Automated Verification Suite for CBS Domain Schemas (@/lib/data-schemas)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * schema capability exposed by `@/lib/data-schemas` with explicit Input and Output visualization:
 * 1. Authentication Schemas (login credentials and password complexity)
 * 2. User Session & Roles (banking operator profile and access level)
 * 3. Form and Model Metadata Specifications (formConfigRecordSchema, modelConfigRecordSchema)
 * 4. Navigation Menu Hierarchy Schema (menuTreeRecordSchema)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-data-schemas.ts
 */

import {
  apiResponseSchema,
  cbsWirePayloadSchema,
  changePasswordSchema,
  currentUserSchema,
  formConfigRecordSchema,
  formElementSchema,
  inquiryConfigRecordSchema,
  isWidgetCompatibleWithType,
  loginSchema,
  menuTreeRecordSchema,
  modelConfigRecordSchema,
} from "@/lib/data-schemas";

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

async function runSuite() {
  console.log("================================================================================");
  console.log("       CBS DOMAIN SCHEMAS VERIFICATION (@/lib/data-schemas)                     ");
  console.log("================================================================================");

  // 1. Operator Login Credentials Contract
  const validLogin = { username: "ZZ028459", password: "SecretPassword123" };
  const loginResult = loginSchema.safeParse(validLogin);
  recordTest(
    "1. Auth Schema: Validates compliant operator credentials against loginSchema",
    { username: validLogin.username, password: "***" },
    { success: loginResult.success },
    loginResult.success === true,
  );

  // 2. Password Complexity Enforcement
  const weakPassword = {
    oldPassword: "old",
    newPassword: "short", // Fails minimum length
    confirmPassword: "short",
  };
  const passResult = changePasswordSchema.safeParse(weakPassword);
  recordTest(
    "2. Auth Schema: Rejects weak passwords failing minimum length or character rules",
    { newPassword: weakPassword.newPassword },
    {
      success: passResult.success,
      issueCount: !passResult.success ? passResult.error.issues.length : 0,
    },
    passResult.success === false,
  );

  // 3. User Session Profile Contract
  const sampleUser = {
    userId: "ZZ028459",
    fullName: "MD. HADIUZZAMAN BAPPY",
    userRole: ["MAKER"],
    accessibility: ["R", "I", "D", "A", "S", "H", "L"],
    branchCode: "JB9999",
    branchName: "Head Office",
    txnDate: "2026-11-02",
  };
  const userResult = currentUserSchema.safeParse(sampleUser);
  recordTest(
    "3. Common Schema: Validates complete banking operator session profile",
    { userId: sampleUser.userId, roles: sampleUser.userRole },
    { success: userResult.success },
    userResult.success === true,
  );

  // 4. Physical Model Configuration Schema Contract
  const sampleModel = {
    TABLENAME: "TEST_TABLE",
    DESCRIPTION: "Test Table Specification",
    ACCESS: "Global",
    SERVICEPATH: "common.v1.TestService",
    PROPERTIES: [
      {
        NAME: "recordId",
        TYPE: "String",
        LENGTH: 35,
        REQUIRED: true,
        WIDTH: 120,
      },
      {
        NAME: "isActive",
        TYPE: "Boolean",
        LENGTH: 1,
        REQUIRED: false,
        WIDTH: 120,
      },
      {
        NAME: "auditInfo",
        TYPE: "Json",
        STRUCTURE: "S",
        LENGTH: 0,
        PROP: [
          {
            NAME: "createdBy",
            TYPE: "String",
            LENGTH: 50,
            REQUIRED: true,
          },
        ],
      },
    ],
  };
  const modelSchemaResult = modelConfigRecordSchema.safeParse(sampleModel);
  recordTest(
    "4. Model Schema: Validates physical database table metadata and column properties",
    { tableName: sampleModel.TABLENAME, propertiesCount: sampleModel.PROPERTIES.length },
    { conforms: modelSchemaResult.success },
    modelSchemaResult.success === true,
  );

  // 5. Versioned Form Presentation Specification Contract
  const sampleForm = {
    title: "Test Form",
    version: "1.0.0",
    frmElements: {
      sections: [
        {
          id: "sec_main",
          title: "Main Section",
          type: "standard",
          zone: "standard",
          fields: [
            {
              NAME: "recordId",
              LABEL: "Record ID",
              TYPE: "String",
              LENGTH: 35,
              WIDTH: "md",
              WIDGET: "text",
              REQUIRED: true,
            },
          ],
        },
      ],
    },
  };
  const formSchemaResult = formConfigRecordSchema.safeParse(sampleForm);
  recordTest(
    "5. Form Schema: Validates screen presentation layout, sections, and fields",
    { title: sampleForm.title, sectionsCount: sampleForm.frmElements.sections.length },
    { conforms: formSchemaResult.success },
    formSchemaResult.success === true,
  );

  // 6. Navigation Menu Hierarchy Schema Contract
  const sampleMenuTree = {
    recordId: "MENU.ONE",
    treeDescription: "Main Navigation Hierarchy",
    menuTree: [
      {
        id: "node_1",
        menuId: 10,
        label: "General Operations",
        isVisible: true,
        orderIndex: 0,
        children: [
          {
            id: "node_11",
            menuId: 11,
            label: "Account Form",
            command: "ACCOUNT I",
            isVisible: true,
            orderIndex: 0,
            children: [],
          },
        ],
      },
    ],
  };
  const menuSchemaResult = menuTreeRecordSchema.safeParse(sampleMenuTree);
  recordTest(
    "6. Menu Schema: Validates recursive tree structure and action commands",
    { rootNodesCount: sampleMenuTree.menuTree.length },
    { conforms: menuSchemaResult.success },
    menuSchemaResult.success === true,
  );

  // 7. Universal Wire & API Response Contracts
  const validMutationWire = {
    idempotencyKey: "550e8400-e29b-41d4-a716-446655440000",
    requestType: "PUT",
    controlName: "ACCOUNT",
    recordId: "10001",
    data: { title: "Savings" },
  };
  const missingKeyMutation = {
    requestType: "PUT",
    controlName: "ACCOUNT",
    recordId: "10001",
    data: { title: "Savings" },
  };
  const readWire = {
    requestType: "GET",
    controlName: "ACCOUNT",
    recordId: "10001",
  };
  const wireResult = cbsWirePayloadSchema.safeParse(validMutationWire);
  const missingKeyResult = cbsWirePayloadSchema.safeParse(missingKeyMutation);
  const readResult = cbsWirePayloadSchema.safeParse(readWire);

  const sampleApiResponse = {
    status: "SUCCESS",
    statusCode: 200,
    message: "Record saved",
    data: { id: "10001" },
    timestamp: "2026-11-03T00:58:00.000Z",
    success: true,
  };
  const responseResult = apiResponseSchema.safeParse(sampleApiResponse);

  recordTest(
    "7. Wire & Response Schemas: Enforces UUIDv4 idempotencyKey on mutations, optional on reads",
    { mutationWithKey: validMutationWire.requestType, readWithoutKey: readWire.requestType },
    {
      mutationWithKeyValid: wireResult.success,
      mutationMissingKeyRejected: !missingKeyResult.success,
      readWithoutKeyValid: readResult.success,
      resSuccess: responseResult.success,
    },
    wireResult.success === true &&
      missingKeyResult.success === false &&
      readResult.success === true &&
      responseResult.success === true,
  );

  // 8. Metamodel Inheritance Defense: FormElement inherits baseFieldSchema + presentation overrides
  const formElementSample = {
    SN: "1",
    NAME: "accountNumber",
    LABEL: "Account Number",
    TYPE: "String",
    STRUCTURE: "S",
    LENGTH: 16,
    REQUIRED: true,
    WIDTH: "sm",
    WIDGET: "text",
    VISIBLE_WHEN: { field: "accountType", operator: "eq", value: "SAVINGS" },
    ON_CHANGE: { target: "memo", action: "copy" },
  };
  const formElementResult = formElementSchema.safeParse(formElementSample);
  recordTest(
    "8. Metamodel Inheritance: FormElement strictly inherits baseFieldSchema with valid UI controls & conditions",
    {
      fieldName: formElementSample.NAME,
      width: formElementResult.data?.WIDTH,
      widget: formElementResult.data?.WIDGET,
    },
    { conforms: formElementResult.success },
    formElementResult.success === true,
  );

  // 9. Semantic Width & Widget Constraints Defense
  const fallbackWidthSample = {
    NAME: "branchCode",
    LABEL: "Branch Code",
    WIDTH: "invalid_width_token", // Should normalize to default 'md'
  };
  const fallbackResult = formElementSchema.safeParse(fallbackWidthSample);
  const isFallbackNormal = fallbackResult.success && fallbackResult.data.WIDTH === "md";
  const isWidgetAllowed = isWidgetCompatibleWithType("Number", "amount");
  const isWidgetDisallowed = !isWidgetCompatibleWithType("Number", "textarea");
  recordTest(
    "9. Schema Defense: propertyWidthSchema normalizes invalid widths to 'md' & compatibility matrix guards widgets",
    {
      parsedWidth: fallbackResult.data?.WIDTH,
      numberCanBeAmount: isWidgetAllowed,
      numberCannotBeTextarea: isWidgetDisallowed,
    },
    {
      fallbackNormal: isFallbackNormal,
      compatibilityMatrixValid: isWidgetAllowed && isWidgetDisallowed,
    },
    isFallbackNormal && isWidgetAllowed && isWidgetDisallowed,
  );

  // 10. Inquiry Config Specification Schema (1:1 Canonical CBS Structure)
  const sampleInquiryWire = {
    INQInfo: {
      controllerName: "ACCOUNT",
      description: "Customer Account Ledger",
      pageOrientation: "Portrait",
      perpageItem: "25",
      showSerial: true,
      showPagination: true,
      showBranchWise: true,
      inqType: "DFT",
      rptControllerName: "RPT.ACC.LEDGER",
      fixedSelection: "",
      inqServicePath: "default",
      cmdFromInternal: false,
      cmdFieldName: "",
    },
    INQSelectField: [
      {
        selectFieldName: "accountNumber",
        selectFieldDisplay: "Account No",
        selectFieldType: "text",
        selectFieldOperator: "EQ",
        selectFieldOperatorFixed: "",
        selectFieldValue: "",
        selectFieldRequired: true,
      },
    ],
    INQDef: [
      {
        fieldName: "accountNumber",
        fieldDisplay: "Account No",
        fieldType: "DC",
        fieldFunc: "",
        fieldRowCol: "1,1",
        fieldLength: "16,L",
        dataPassable: true,
      },
    ],
    INQCmds: [
      {
        cmdFor: "ACCOUNT.SEE",
        cmdButton: "View Account",
      },
    ],
  };
  const inqSchemaResult = inquiryConfigRecordSchema.safeParse(sampleInquiryWire);
  recordTest(
    "10. Inquiry Config Schema: Enforces 1:1 canonical inquiry structure across INQInfo, INQSelectField, INQDef, and INQCmds",
    {
      controller: sampleInquiryWire.INQInfo.controllerName,
      filterCount: sampleInquiryWire.INQSelectField.length,
      colCount: sampleInquiryWire.INQDef.length,
      cmdCount: sampleInquiryWire.INQCmds.length,
    },
    {
      conforms: inqSchemaResult.success,
      parsedController: inqSchemaResult.data?.INQInfo.controllerName,
      parsedShowBranchWise: inqSchemaResult.data?.INQInfo.showBranchWise,
      parsedRequired: inqSchemaResult.data?.INQSelectField[0]?.selectFieldRequired,
      parsedDataPassable: inqSchemaResult.data?.INQDef[0]?.dataPassable,
    },
    inqSchemaResult.success === true &&
      inqSchemaResult.data?.INQInfo.controllerName === "ACCOUNT" &&
      inqSchemaResult.data?.INQInfo.showBranchWise === true &&
      inqSchemaResult.data?.INQSelectField[0]?.selectFieldRequired === true &&
      inqSchemaResult.data?.INQDef[0]?.dataPassable === true,
  );

  // Final Summary
  console.log("\n================================================================================");
  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  if (failedTests === 0) {
    console.log(
      `\x1b[32m✔ SUCCESS: ALL ${passedTests} DOMAIN SCHEMA CAPABILITIES VALIDATED 100% CLEAN!\x1b[0m`,
    );
    console.log(
      "================================================================================\n",
    );
  } else {
    console.error(`\x1b[31m✖ FAILURE: ${failedTests} TESTS FAILED!\x1b[0m`);
    console.log(
      "================================================================================\n",
    );
    process.exit(1);
  }
}

runSuite().catch((err: unknown) => {
  console.error("Fatal Test Suite Crash:", err);
  process.exit(1);
});

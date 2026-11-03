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
    accessibility: "RIDASHL",
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
        NAME: "ID",
        LABEL: "Record ID",
        TYPE: "Text",
        LENGTH: 35,
        REQUIRED: true,
        WIDTH: 120,
      },
      {
        NAME: "isActive",
        LABEL: "Active Status",
        TYPE: "Boolean",
        LENGTH: 1,
        REQUIRED: false,
        WIDTH: 120,
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
          label: "Main Section",
          rows: [
            {
              id: "row_1",
              fields: [
                {
                  id: "fld_id",
                  name: "ID",
                  label: "Record ID",
                  type: "TEXT",
                  colSpan: 6,
                },
              ],
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
  const sampleWirePayload = {
    requestType: "PUT",
    controlName: "ACCOUNT",
    recordId: "10001",
    data: { title: "Savings" },
  };
  const wireResult = cbsWirePayloadSchema.safeParse(sampleWirePayload);

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
    "7. Wire & Response Schemas: Validates cbsWirePayload and apiResponse wire contracts",
    { wireType: sampleWirePayload.requestType, resStatus: sampleApiResponse.status },
    { wireSuccess: wireResult.success, resSuccess: responseResult.success },
    wireResult.success === true && responseResult.success === true,
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

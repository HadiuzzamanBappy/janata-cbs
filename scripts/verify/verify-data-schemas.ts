/**
 * Automated Verification Suite for CBS Domain Schemas (@/lib/data-schemas)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * schema capability exposed by `@/lib/data-schemas` with explicit Input and Output visualization:
 * 1. Authentication Schemas (login credentials and password complexity)
 * 2. User Session & Roles (banking operator profile and access level)
 * 3. Form and Model Metadata Specifications (form / model record and save schemas)
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
  formConfigSaveSchema,
  formElementSchema,
  inquiryConfigRecordSchema,
  inquiryConfigSaveSchema,
  inquiryResultSchema,
  inquiryRunDataSchema,
  isWidgetCompatibleWithType,
  loginSchema,
  menuTreeRecordSchema,
  modelConfigRecordSchema,
  modelConfigSaveSchema,
  popupSearchParamsSchema,
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
        TYPE: "Array",
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

  // 4b. Save rules (SMC): stricter than reads, so stored models still load
  const saveIssues = modelConfigSaveSchema
    .safeParse({
      ...sampleModel,
      TABLENAME: "test table",
      PROPERTIES: [{ NAME: "amount", TYPE: "Number", LENGTH: 0 }],
      IDDEF: { IDPREFIX: "TT", SEQUENCELENGTH: "abc", SEQUENCERESET: false, IDPATTERN: "" },
    })
    .error?.issues.map((i) => i.path.join("."));
  const expectedSaveIssues = [
    "TABLENAME",
    "ACCESS",
    "SERVICEPATH",
    "IDDEF.SEQUENCELENGTH",
    "PROPERTIES.0.LENGTH",
  ];
  const cleanSave = modelConfigSaveSchema.safeParse({
    ...sampleModel,
    ACCESS: "G",
    SERVICEPATH: "finxurm",
  });
  const emptySave = modelConfigSaveSchema.safeParse({
    ...sampleModel,
    ACCESS: "G",
    SERVICEPATH: "default",
    PROPERTIES: [],
  });
  recordTest(
    "4b. Model Save Schema: uppercase table, G/B, service name, numeric sequence, positive length, ≥1 property",
    { readSampleAccess: sampleModel.ACCESS, readSampleService: sampleModel.SERVICEPATH },
    { saveIssues, cleanSave: cleanSave.success, emptySave: emptySave.success },
    JSON.stringify(saveIssues) === JSON.stringify(expectedSaveIssues) &&
      cleanSave.success &&
      !emptySave.success,
  );

  // 4c. Property rules are save rules; reads and drafts stay lenient. MODELNAME on Number is valid
  // (String / Number is a designer-UI limit, not a save rule)
  const propertyRuleModel = {
    ...sampleModel,
    ACCESS: "G",
    SERVICEPATH: "default",
    PROPERTIES: [
      { SN: "1", NAME: "branchCode", TYPE: "Number", LENGTH: 4, MODELNAME: "BRANCH" },
      { SN: "2", NAME: "branchCode", TYPE: "String", LENGTH: 10 },
      {
        SN: "3",
        NAME: "items",
        TYPE: "Array",
        LENGTH: 0,
        PROP: [
          { SN: "3_1", NAME: "code", TYPE: "String", LENGTH: 5, MODELNAME: "BAD NAME" },
          { SN: "3_2", NAME: "code", TYPE: "Array", LENGTH: 0 },
        ],
      },
    ],
  };
  const propertyReadOk = modelConfigRecordSchema.safeParse(propertyRuleModel).success;
  const propertySaveIssues = modelConfigSaveSchema
    .safeParse(propertyRuleModel)
    .error?.issues.map((i) => i.path.join("."));
  const expectedPropertyIssues = [
    "PROPERTIES.1.NAME",
    "PROPERTIES.2.PROP.0.MODELNAME",
    "PROPERTIES.2.PROP.1.NAME",
    "PROPERTIES.2.PROP.1.TYPE",
  ];
  recordTest(
    "4c. Model property rules: unique names, MODELNAME format, no nested Array on save; reads stay lenient; Number may reference a model",
    { properties: ["branchCode (Number → BRANCH)", "branchCode", "items[code, code(Array)]"] },
    { propertyReadOk, propertySaveIssues },
    propertyReadOk && JSON.stringify(propertySaveIssues) === JSON.stringify(expectedPropertyIssues),
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

  // 5b. Form save rules (SFC) and layout flags left unset on read
  const mainField = sampleForm.frmElements.sections[0].fields[0];
  const badFormIssues = formConfigSaveSchema
    .safeParse({
      ...sampleForm,
      frmElements: {
        sections: [
          sampleForm.frmElements.sections[0],
          {
            id: "sec_main",
            title: "Second",
            fields: [
              {
                ...mainField,
                NAME: "status",
                WIDGET: "radio-group",
                VISIBLE_WHEN: { field: "missingField", operator: "eq", value: "X" },
                CASCADE: [{ when: "A", set: { ghostField: 1 } }],
                DATE_CONFIG: { minDateOffset: 5, maxDateOffset: 1 },
                VALIDATION: { min: 9, max: 1, matches: "([A-Z" },
              },
            ],
          },
        ],
      },
    })
    .error?.issues.map((i) => i.path.join("."));
  const expectedFormIssues = [
    "frmElements.sections.1.id",
    "frmElements.sections.1.fields.0.VISIBLE_WHEN.field",
    "frmElements.sections.1.fields.0.CASCADE.0.set",
    "frmElements.sections.1.fields.0.DATE_CONFIG.minDateOffset",
    "frmElements.sections.1.fields.0.PARAMETER",
    "frmElements.sections.1.fields.0.VALIDATION.min",
    "frmElements.sections.1.fields.0.VALIDATION.matches",
  ];
  const cleanFormSave = formConfigSaveSchema.safeParse(sampleForm);
  const ghostConfig = formConfigRecordSchema.parse({
    ...sampleForm,
    frmElements: {
      sections: [{ ...sampleForm.frmElements.sections[0], containerConfig: { variant: "ghost" } }],
    },
  }).frmElements.sections[0].containerConfig;
  recordTest(
    "5b. Form Save Schema: unique section ids, known condition and cascade targets, date range order, options, min ≤ max, valid regex; ghost keeps its preset",
    { sections: 2, ghost: { variant: "ghost" } },
    { badFormIssues, cleanFormSave: cleanFormSave.success, ghostConfig },
    JSON.stringify(badFormIssues) === JSON.stringify(expectedFormIssues) &&
      cleanFormSave.success &&
      JSON.stringify(ghostConfig) === JSON.stringify({ variant: "ghost" }),
  );

  // 5c. Untitled cards save, tabs need a title, legacy date offsets still load
  const untitledCard = formConfigSaveSchema.safeParse({
    ...sampleForm,
    frmElements: { sections: [{ ...sampleForm.frmElements.sections[0], title: "" }] },
  });
  const untitledTabIssues = formConfigSaveSchema
    .safeParse({
      ...sampleForm,
      frmElements: {
        sections: [{ ...sampleForm.frmElements.sections[0], title: "", containerType: "tab" }],
      },
    })
    .error?.issues.map((i) => i.path.join("."));
  const legacyDateConfig = formConfigRecordSchema.parse({
    ...sampleForm,
    frmElements: {
      sections: [
        {
          ...sampleForm.frmElements.sections[0],
          fields: [{ ...mainField, DATE_CONFIG: { minDateOffset: "", maxDateOffset: "-3" } }],
        },
      ],
    },
  }).frmElements.sections[0].fields[0].DATE_CONFIG;
  recordTest(
    "5c. Form Save Schema: untitled card saves, untitled tab is rejected; stored string date offsets read as numbers",
    { card: "untitled", tab: "untitled", legacyOffsets: { min: "", max: "-3" } },
    { untitledCard: untitledCard.success, untitledTabIssues, legacyDateConfig },
    untitledCard.success &&
      JSON.stringify(untitledTabIssues) === JSON.stringify(["frmElements.sections.0.title"]) &&
      legacyDateConfig?.minDateOffset === undefined &&
      legacyDateConfig?.maxDateOffset === -3,
  );

  // 5d. Object groups: inner fields meet the same save rules, unique within their group
  const objectGroupIssues = formConfigSaveSchema
    .safeParse({
      ...sampleForm,
      frmElements: {
        sections: [
          {
            ...sampleForm.frmElements.sections[0],
            fields: [
              mainField,
              {
                ...mainField,
                SN: "9",
                NAME: "address",
                LABEL: "Address",
                TYPE: "Array",
                PROP: [
                  { ...mainField, SN: "9_1", NAME: "city", LABEL: "" },
                  { ...mainField, SN: "9_2", NAME: "city", LABEL: "City Again" },
                  {
                    ...mainField,
                    SN: "9_3",
                    NAME: "zip",
                    LABEL: "Zip",
                    VALIDATION: { matches: "([0-9" },
                    CASCADE: [{ when: "X", set: { ghostField: 1 } }],
                  },
                ],
              },
              {
                ...mainField,
                SN: "10",
                NAME: "emptyGroup",
                LABEL: "Empty",
                TYPE: "Array",
                PROP: [],
              },
            ],
          },
        ],
      },
    })
    .error?.issues.map((i) => i.path.join("."));
  const expectedObjectGroupIssues = [
    "frmElements.sections.0.fields.1.PROP.0.LABEL",
    "frmElements.sections.0.fields.1.PROP.1.NAME",
    "frmElements.sections.0.fields.1.PROP.2.CASCADE.0.set",
    "frmElements.sections.0.fields.1.PROP.2.VALIDATION.matches",
    "frmElements.sections.0.fields.2.PROP",
  ];
  recordTest(
    "5d. Form Save Schema: object-group inner fields need a label, unique names, valid rules; a group keeps one field",
    { group: "address", inner: ["city", "city", "zip"], emptyGroup: "emptyGroup" },
    { objectGroupIssues },
    JSON.stringify(objectGroupIssues) === JSON.stringify(expectedObjectGroupIssues),
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

  // 10b. Inquiry save rules (PUT on INQUIRY): the read sample's "ACCOUNT.SEE" has no function
  const sampleSaveIssues = inquiryConfigSaveSchema
    .safeParse(sampleInquiryWire)
    .error?.issues.map((i) => i.path.join("."));
  const badInquiryIssues = inquiryConfigSaveSchema
    .safeParse({
      ...sampleInquiryWire,
      INQInfo: {
        ...sampleInquiryWire.INQInfo,
        perpageItem: "abc",
        inqServicePath: "/api/x",
        fixedSelection: 'remarks EQ "a,b"; status XX AU',
      },
      INQSelectField: [
        {
          ...sampleInquiryWire.INQSelectField[0],
          selectFieldType: "number",
          selectFieldOperator: "CT",
        },
      ],
      INQDef: [
        sampleInquiryWire.INQDef[0],
        {
          ...sampleInquiryWire.INQDef[0],
          fieldName: "balance",
          fieldDisplay: "Balance",
          fieldRowCol: "x",
        },
      ],
      INQCmds: [{ cmdFor: "ACCOUNT S missingField", cmdButton: "View" }],
    })
    .error?.issues.map((i) => i.path.join("."));
  const expectedInquiryIssues = [
    "INQInfo.perpageItem",
    "INQInfo.inqServicePath",
    "INQInfo.fixedSelection",
    "INQSelectField.0.selectFieldOperator",
    "INQDef.1.fieldRowCol",
    "INQCmds.0.cmdFor",
  ];
  const cleanInquirySave = inquiryConfigSaveSchema.safeParse({
    ...sampleInquiryWire,
    INQCmds: [{ cmdFor: "ACCOUNT S @ID", cmdButton: "View Account" }],
  });
  recordTest(
    "10b. Inquiry Save Schema: page size, service name, fixed selection, operator by type, position format (shared allowed), RIDASHL commands on columns",
    { sampleCommand: sampleInquiryWire.INQCmds[0].cmdFor },
    { sampleSaveIssues, badInquiryIssues, cleanInquirySave: cleanInquirySave.success },
    JSON.stringify(sampleSaveIssues) === JSON.stringify(["INQCmds.0.cmdFor"]) &&
      JSON.stringify(badInquiryIssues) === JSON.stringify(expectedInquiryIssues) &&
      cleanInquirySave.success,
  );

  // 10c. Rules that keep a saved inquiry from widening: branch, fixed fields, locked operand, extra keys
  const widenIssues = inquiryConfigSaveSchema
    .safeParse({
      ...sampleInquiryWire,
      INQInfo: {
        ...sampleInquiryWire.INQInfo,
        fixedSelection: "branchCode EQ JB0099; accountType EQ SB; name NE O'Brien",
      },
      INQSelectField: [
        { ...sampleInquiryWire.INQSelectField[0], selectFieldOperatorFixed: "NE" },
        {
          ...sampleInquiryWire.INQSelectField[0],
          selectFieldName: "accountType",
          selectFieldDisplay: "Type",
        },
        {
          ...sampleInquiryWire.INQSelectField[0],
          selectFieldName: "branchCode",
          selectFieldDisplay: "Branch",
        },
        {
          ...sampleInquiryWire.INQSelectField[0],
          selectFieldName: "a b",
          selectFieldDisplay: "Bad",
        },
      ],
      INQCmds: [{ cmdFor: "ACCOUNT S @ID", cmdButton: "View Account" }],
    })
    .error?.issues.map((i) => i.path.join("."));
  const smuggled = inquiryConfigSaveSchema.safeParse({
    ...sampleInquiryWire,
    INQCmds: [{ cmdFor: "ACCOUNT S @ID", cmdButton: "View Account" }],
    record: { INQCmds: [{ cmdFor: "USERS I @ID", cmdButton: "Smuggled" }] },
  });
  recordTest(
    "10c. Inquiry Save Schema: no branch in a branch-wise fixed selection or filters, no filter on a fixed field, locked operand = operator, clean keys, no unknown top-level keys",
    "branch-wise inquiry with fixed branchCode, a fixed accountType filter, a branchCode filter, locked NE ≠ EQ, 'a b', a smuggled 'record'",
    widenIssues,
    JSON.stringify(widenIssues) ===
      JSON.stringify([
        "INQInfo.fixedSelection",
        "INQInfo.fixedSelection",
        "INQSelectField.0.selectFieldOperatorFixed",
        "INQSelectField.1.selectFieldName",
        "INQSelectField.2.selectFieldName",
        "INQSelectField.3.selectFieldName",
      ]) &&
      !smuggled.success &&
      smuggled.error.issues.some((i) => i.code === "unrecognized_keys"),
  );

  // 10d. INQ request data: the browser sends filter values only, in a strict shape
  const runOk = inquiryRunDataSchema.safeParse({
    queryString: [
      { selectFieldName: " accountNumber ", selectFieldOperator: "EQ", selectFieldValue: "1001" },
    ],
  });
  const runBad = [
    { queryString: [], perPage: 1000000 },
    { queryString: "branchCode EQ JB0002" },
    { queryString: [{ selectFieldName: "a;b", selectFieldOperator: "EQ", selectFieldValue: "1" }] },
    { queryString: [{ selectFieldName: "x", selectFieldOperator: "XX", selectFieldValue: "1" }] },
    { queryString: [{ selectFieldName: "x", selectFieldOperator: "EQ", selectFieldValue: "  " }] },
    {
      queryString: [
        {
          selectFieldName: "x",
          selectFieldOperator: "EQ",
          selectFieldValue: "1",
          selectFieldType: "text",
        },
      ],
    },
  ].map((data) => inquiryRunDataSchema.safeParse(data).success);
  const result = inquiryResultSchema.safeParse({ rows: [{ recordId: "", NAME: "A" }], total: 7 });
  recordTest(
    "10d. INQ data is strict (filters only: no paging, no type, known operands, clean names, a value); results carry rows and the matched total",
    {
      ok: "accountNumber EQ 1001",
      bad: ["perPage", "string query", "a;b", "XX", "blank", "selectFieldType"],
    },
    { ok: runOk.data, bad: runBad, result: result.success },
    runOk.success &&
      runOk.data.queryString[0].selectFieldName === "accountNumber" &&
      runBad.every((passed) => !passed) &&
      result.success &&
      result.data.total === 7,
  );

  // Popup URL parameters: a trust boundary. Valid values pass; a tampered value is dropped alone
  const popupOk = popupSearchParamsSchema.safeParse({
    tabId: "popup-ACCOUNT_1",
    mode: "A",
    recordId: "1001",
    component: "INQUIRY_SCREEN",
    step: "RESULTS",
    page: "2",
  });
  const popupTampered = popupSearchParamsSchema.safeParse({
    mode: "DROP TABLE",
    step: "<script>",
    page: "abc",
    recordId: "1001",
  });
  recordTest(
    "Popup search params: valid values parse (page numbers coerced); a tampered field becomes undefined, the rest survive",
    { valid: "mode=A&step=RESULTS&page=2", tampered: "mode=DROP TABLE&step=<script>&page=abc" },
    { valid: popupOk.data, tampered: popupTampered.data },
    popupOk.success &&
      popupOk.data.mode === "A" &&
      popupOk.data.page === 2 &&
      popupOk.data.component === "INQUIRY_SCREEN" &&
      popupTampered.success &&
      popupTampered.data.mode === undefined &&
      popupTampered.data.step === undefined &&
      popupTampered.data.page === undefined &&
      popupTampered.data.recordId === "1001",
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

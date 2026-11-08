/**
 * Automated Verification Suite for CBS Wire Data Parsers & Serializers (@/lib/data-parsers)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * parser capability exposed by `@/lib/data-parsers` with explicit Input and Output visualization:
 * 1. Protobuf Value Decoding (decodeProtobufValue: decodes string_value, struct_value, list_value)
 * 2. Record Envelope Unwrapping (unwrapRecordsPayload: extracts arrays from common wire wrappers)
 * 3. Operator Auth Response Parsing (parseAuthWirePayload: maps session fields & RIDASHL rights)
 * 4. Combined GFC Specification Parsing (parseGfcResponse: extracts model and presentation)
 * 5. Form Config Spec Sanitization (sanitizeFormConfigRecord: cleans sparse database wire layout)
 * 6. Model Config Spec Sanitization (sanitizeModelConfigRecord: cleans table metadata)
 * 7. Tabular Inquiry Row Extraction (parseInquiryRecords: unpacks records array & totals)
 * 8. Navigation Menu Serialization (serializeMenuTreeToWireJson: transforms tree to database wire JSON)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-data-parsers.ts
 */

import {
  decodeProtobufValue,
  parseAuthWirePayload,
  parseGfcResponse,
  parseInquiryRecords,
  parseModelConfig,
  sanitizeFormConfigRecord,
  sanitizeModelConfigRecord,
  serializeMenuTreeToWireJson,
  unwrapRecordsPayload,
} from "@/lib/data-parsers";
import type { FormConfigRecord } from "@/lib/data-schemas";

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
  console.log("       CBS DATA PARSERS & SERIALIZERS VERIFICATION (@/lib/data-parsers)         ");
  console.log("================================================================================");

  // ----------------------------------------------------------------------------
  // 1. Protobuf Struct / Value Decoder
  // ----------------------------------------------------------------------------
  const protobufInput = {
    struct_value: {
      fields: {
        operatorName: { string_value: "BAPPY" },
        activeBranch: { number_value: 9999 },
        flags: {
          list_value: {
            values: [{ string_value: "MAKER" }, { string_value: "CHECKER" }],
          },
        },
      },
    },
  };
  const decoded = decodeProtobufValue<Record<string, unknown>>(protobufInput);

  recordTest(
    "1. Protobuf Value Decoding: Recursively unwraps string, number, and list wrappers",
    protobufInput,
    decoded,
    decoded?.operatorName === "BAPPY" &&
      decoded?.activeBranch === 9999 &&
      Array.isArray(decoded?.flags) &&
      (decoded.flags as string[])[0] === "MAKER",
  );

  // ----------------------------------------------------------------------------
  // 2. Generic Envelope Unwrapper
  // ----------------------------------------------------------------------------
  const envelopeInput = {
    data: {
      records: [
        { id: "REC_01", title: "First Item" },
        { id: "REC_02", title: "Second Item" },
      ],
    },
  };
  const unwrapped = unwrapRecordsPayload<{ id: string; title: string }>(envelopeInput);

  recordTest(
    "2. Wire Envelope Unwrapping: Extracts array of records from nested response data",
    envelopeInput,
    { count: unwrapped.length, firstId: unwrapped[0]?.id },
    unwrapped.length === 2 && unwrapped[0]?.id === "REC_01",
  );

  // ----------------------------------------------------------------------------
  // 3. Authentication Wire Payload Parser
  // ----------------------------------------------------------------------------
  const authPayload = {
    userId: "OP100",
    fullName: "Chief Teller",
    branchCode: "001",
    branchName: "Corporate Branch",
    txnDate: "2026-11-03",
    userRole: "TELLER",
    accessibility: "RS",
    commandLine: true,
    token: "mock-jwt-session-token",
  };
  const authResult = parseAuthWirePayload(authPayload);

  recordTest(
    "3. Auth Wire Parsing: Extracts CurrentUser session profile and parses 'RS' rights",
    authPayload,
    {
      userId: authResult.currUser.userId,
      functionRights: authResult.currUser.functionRights,
      token: authResult.token,
    },
    authResult.currUser.userId === "OP100" &&
      Boolean(authResult.currUser.functionRights?.includes("R")) &&
      Boolean(authResult.currUser.functionRights?.includes("S")) &&
      !authResult.currUser.functionRights?.includes("I") &&
      authResult.token === "mock-jwt-session-token",
  );

  // ----------------------------------------------------------------------------
  // 4. Combined GFC Response Parser (Model + Form presentation)
  // ----------------------------------------------------------------------------
  const gfcRaw = {
    TABLENAME: "TEST_TABLE",
    DESCRIPTION: "Test Table Spec",
    ACCESS: "Global",
    SERVICEPATH: "common.v1.Service",
    PROPERTIES: [
      {
        NAME: "ACC_NO",
        LABEL: "Account Number",
        TYPE: "Text",
        LENGTH: 35,
        REQUIRED: true,
      },
    ],
    FORMCONTROL: {
      title: "Test Account Layout",
      version: "1.0.0",
      frmElements: {
        sections: [
          {
            id: "sec_1",
            label: "Basic Details",
            rows: [
              {
                id: "r_1",
                fields: [{ id: "f_1", name: "ACC_NO", label: "Account Number", type: "TEXT" }],
              },
            ],
          },
        ],
      },
    },
  };
  const parsedGfc = parseGfcResponse(gfcRaw);

  recordTest(
    "4. Combined GFC Parser: Splits backend response into typed Model and Form specs",
    { table: gfcRaw.TABLENAME, formTitle: gfcRaw.FORMCONTROL.title },
    {
      success: parsedGfc.success,
      isNew: parsedGfc.success ? parsedGfc.data.isNew : false,
      tableName: parsedGfc.success ? parsedGfc.data.model.TABLENAME : undefined,
    },
    parsedGfc.success === true &&
      parsedGfc.data.isNew === false &&
      parsedGfc.data.model.TABLENAME === "TEST_TABLE" &&
      parsedGfc.data.form?.title === "Test Account Layout",
  );

  // ----------------------------------------------------------------------------
  // 5. Form Config Spec Sanitization (Strips draft noise)
  // ----------------------------------------------------------------------------
  const dirtyForm: FormConfigRecord = {
    title: "  Account Form  ",
    frmElements: {
      sections: [
        {
          id: "sec_main",
          title: "  Main Section  ",
          containerType: "card",
          fields: [
            {
              SN: "1",
              NAME: "ACC_TITLE",
              LABEL: "Account Title",
              TYPE: "Text",
              STRUCTURE: "S",
              LENGTH: 35,
            },
          ],
        },
      ],
    },
  };
  const sanitizedForm = sanitizeFormConfigRecord(dirtyForm);

  recordTest(
    "5. Form Config Sanitizer: Trims whitespace and purges empty layout structures",
    { rawTitle: dirtyForm.title },
    { sanitizedTitle: sanitizedForm?.title },
    sanitizedForm?.title === "Account Form",
  );

  // ----------------------------------------------------------------------------
  // 6. Model Config Spec Parser & Sanitization
  // ----------------------------------------------------------------------------
  const rawModelPayload = {
    TABLENAME: "CUSTOM_TABLE",
    DESCRIPTION: "Custom Spec",
    ACCESS: "Global",
    SERVICEPATH: "custom.v1.Service",
    PROPERTIES: [
      {
        SN: "1",
        NAME: "ID",
        LABEL: "Record Identifier",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: 20,
        REQUIRED: true,
        WIDTH: 280, // Presentation noise: should be purged
        WIDGET: "text", // Presentation noise: should be purged
      },
      {
        SN: "2",
        NAME: "IS_ACTIVE",
        LABEL: "Is Active",
        TYPE: "Boolean",
        STRUCTURE: "M", // Invalid for boolean: should normalize to 'S'
        LENGTH: 50, // Invalid for boolean: should normalize to 1
      },
      {
        SN: "3",
        NAME: "TXN_DATE",
        LABEL: "Transaction Date",
        TYPE: "Date",
        STRUCTURE: "S",
        LENGTH: 35, // Should normalize to 10
      },
      {
        SN: "4",
        NAME: "USER_NAME",
        LABEL: "User Name",
        TYPE: "Text",
        STRUCTURE: "S",
        LENGTH: "65" as unknown as number, // Stringified number from DB wire: should coerce to 65
      },
    ],
  };
  const parsedModel = parseModelConfig(rawModelPayload);
  const sanitizedModel = parsedModel.success
    ? sanitizeModelConfigRecord(parsedModel.data)
    : undefined;
  const p1 = sanitizedModel?.PROPERTIES[0] as unknown as Record<string, unknown>;
  const p2 = sanitizedModel?.PROPERTIES[1];
  const p3 = sanitizedModel?.PROPERTIES[2];
  const p4 = sanitizedModel?.PROPERTIES[3];

  recordTest(
    "6. Model Config Spec Parser & Sanitizer: Standardizes physical metadata & column properties",
    { table: rawModelPayload.TABLENAME, propCount: rawModelPayload.PROPERTIES.length },
    {
      parsed: parsedModel.success,
      sanitizedTable: sanitizedModel?.TABLENAME,
      sanitizedAccess: sanitizedModel?.ACCESS,
      propCount: sanitizedModel?.PROPERTIES.length,
      p1HasWidth: "WIDTH" in (p1 || {}),
      p2Structure: p2?.STRUCTURE,
      p2Length: p2?.LENGTH,
      p3Length: p3?.LENGTH,
      p4Length: p4?.LENGTH,
    },
    parsedModel.success === true &&
      sanitizedModel?.TABLENAME === "CUSTOM_TABLE" &&
      sanitizedModel?.ACCESS === "G" &&
      sanitizedModel?.PROPERTIES.length === 4 &&
      !("WIDTH" in (p1 || {})) &&
      !("WIDGET" in (p1 || {})) &&
      p2?.STRUCTURE === "S" &&
      p2?.LENGTH === 1 &&
      p3?.LENGTH === 10 &&
      p4?.LENGTH === 65,
  );

  // ----------------------------------------------------------------------------
  // 7. Tabular Inquiry Row Parser
  // ----------------------------------------------------------------------------
  const rawInquiryWire = {
    data: {
      records: [
        { id: "TXN101", AMOUNT: 5000, STATUS: "POSTED" },
        { id: "TXN102", AMOUNT: 12000, STATUS: "PENDING" },
      ],
    },
  };
  const parsedInquiry = parseInquiryRecords(rawInquiryWire);

  recordTest(
    "7. Inquiry Records Parser: Normalizes tabular row items into typed EnquiryRow list",
    { rawRecordsCount: rawInquiryWire.data.records.length },
    { parsedCount: parsedInquiry.length, firstId: parsedInquiry[0]?.id },
    parsedInquiry.length === 2 && parsedInquiry[0]?.id === "TXN101",
  );

  // ----------------------------------------------------------------------------
  // 8. Navigation Menu Hierarchy Tree Serializer
  // ----------------------------------------------------------------------------
  const sampleTreeRecord = {
    recordId: "MENU.ONE",
    treeDescription: "Main Navigation Menu",
    menuTree: [
      {
        id: "root_1",
        menuId: 10,
        label: "Banking Operations",
        isVisible: true,
        orderIndex: 0,
        children: [
          {
            id: "leaf_1",
            menuId: 11,
            label: "Customer Account",
            command: "ACCOUNT I",
            menuType: "FORM" as const,
            menuAction: "SCREEN" as const,
            isVisible: true,
            orderIndex: 0,
            children: [],
          },
        ],
      },
    ],
  };
  const serializedTree = serializeMenuTreeToWireJson(sampleTreeRecord);

  recordTest(
    "8. Menu Tree Serializer: Conforms internal tree structure for wire transmission",
    { recordId: sampleTreeRecord.recordId, rootNodes: sampleTreeRecord.menuTree.length },
    {
      recordId: serializedTree.recordId,
      rootNodesCount: serializedTree.menuTree.length,
      firstLabel: serializedTree.menuTree[0]?.label,
    },
    serializedTree.recordId === "MENU.ONE" &&
      serializedTree.menuTree.length === 1 &&
      serializedTree.menuTree[0]?.label === "Banking Operations",
  );

  // ----------------------------------------------------------------------------
  // Master Summary
  // ----------------------------------------------------------------------------
  console.log("\n================================================================================");
  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  if (failedTests === 0) {
    console.log(
      `\x1b[32m✔ SUCCESS: ALL ${passedTests} DATA PARSER CAPABILITIES VALIDATED 100% CLEAN!\x1b[0m`,
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

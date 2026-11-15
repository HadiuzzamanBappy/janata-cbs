/**
 * Automated Verification Suite for CBS Inquiry Specification & Compiler (@/lib/cbs-inquiry-spec)
 *
 * Deterministic & Transparent Verification of Core Inquiry Specification Subsystems:
 * 1. Criteria Mapping & Wire Serialization (serializeCriteriaToWire, operands, defaults)
 * 2. Fixed Selection Expression Parsing (parseFixedSelectionToWire)
 * 3. Multi-Line Grid Coordinate Geometry (parseColumnCoordinates, formatting)
 * 4. Field Length & Alignment Specifiers (parseColumnLength, formatting)
 * 5. Presentation Column Metadata Derivation (deriveInquiryColumnMeta)
 * 6. Command Template Interpolation (@ID, recordId, field tokens)
 * 7. Internal Command & Action Resolution (cmdFromInternal, getPrimaryInquiryCommand)
 *
 * Usage:
 *   pnpm exec tsx scripts/verify/verify-cbs-inquiry-spec.ts
 */

import {
  deriveInquiryColumnMeta,
  formatColumnCoordinates,
  formatColumnLength,
  getPrimaryInquiryCommand,
  parseColumnCoordinates,
  parseColumnLength,
  parseFixedSelectionToWire,
  resolveCommandTemplate,
  serializeCriteriaToWire,
} from "@/lib/cbs-inquiry-spec";
import type { EnquiryRow, INQCmd, INQDef, INQSelectField } from "@/lib/data-schemas";

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
  console.log("\n================================================================================");
  console.log("             CBS INQUIRY SPECIFICATION & COMPILER VERIFICATION                  ");
  console.log("================================================================================");
  console.log(
    " Architecture : Pure Headless Inquiry Specification Engine (@/lib/cbs-inquiry-spec)",
  );
  console.log(" Domain Focus : Criteria, Fixed Selection, Grid Layout, Formatters & Commands");
  console.log("================================================================================");

  // ── 1. Fixed Selection Expression Parsing ──
  console.log("\n── 1. Fixed Selection Expression Parsing (parseFixedSelectionToWire) ──");
  {
    const singleStmt = parseFixedSelectionToWire("STATUS EQ AU");
    recordTest(
      "1.1 Single fixed selection parsed into canonical InquiryCriteriaParam",
      "STATUS EQ AU",
      singleStmt,
      singleStmt.length === 1 &&
        singleStmt[0].selectFieldName === "STATUS" &&
        singleStmt[0].selectFieldOperator === "EQ" &&
        singleStmt[0].selectFieldValue === "AU",
    );

    const multiStmt = parseFixedSelectionToWire("RECORD.STATUS NE 'REVE', CATEGORY EQ 1001");
    recordTest(
      "1.2 Comma-delimited statements with quotes parsed cleanly",
      "RECORD.STATUS NE 'REVE', CATEGORY EQ 1001",
      multiStmt,
      multiStmt.length === 2 &&
        multiStmt[0].selectFieldName === "RECORD.STATUS" &&
        multiStmt[0].selectFieldOperator === "NE" &&
        multiStmt[0].selectFieldValue === "REVE" &&
        multiStmt[1].selectFieldName === "CATEGORY" &&
        multiStmt[1].selectFieldValue === "1001",
    );

    const emptyStmt = parseFixedSelectionToWire("");
    recordTest(
      "1.3 Empty or whitespace fixedSelection returns empty array",
      "",
      emptyStmt,
      Array.isArray(emptyStmt) && emptyStmt.length === 0,
    );
  }

  // ── 2. Criteria Mapping & Wire Serialization ──
  console.log("\n── 2. Criteria Mapping & Wire Serialization (serializeCriteriaToWire) ──");
  {
    const fields: INQSelectField[] = [
      {
        selectFieldName: "ACCOUNT.NO",
        selectFieldDisplay: "Account Number",
        selectFieldType: "text",
        selectFieldValue: "",
        selectFieldOperator: "EQ",
        selectFieldOperatorFixed: "",
        selectFieldRequired: false,
      },
      {
        selectFieldName: "STATUS",
        selectFieldDisplay: "Status",
        selectFieldType: "select",
        selectFieldValue: "AU",
        selectFieldOperator: "EQ",
        selectFieldOperatorFixed: "EQ",
        selectFieldRequired: true,
      },
    ];

    const criteria = {
      "ACCOUNT.NO": { value: "1002345", operand: "LK" as const },
      STATUS: { value: "AU", operand: "EQ" as const },
    };

    const wireParams = serializeCriteriaToWire(criteria, fields, "BRANCH.TYPE EQ URBAN", "0012");

    recordTest(
      "2.1 Injects branchCode, fixed selections, and UI criteria into serialized wire array",
      { criteria, fixedSelection: "BRANCH.TYPE EQ URBAN", branchCode: "0012" },
      wireParams,
      wireParams.length === 4 &&
        wireParams[0].selectFieldName === "branchCode" &&
        wireParams[0].selectFieldValue === "0012" &&
        wireParams[1].selectFieldName === "BRANCH.TYPE" &&
        wireParams[1].selectFieldValue === "URBAN" &&
        wireParams[2].selectFieldName === "ACCOUNT.NO" &&
        wireParams[2].selectFieldOperator === "LK" &&
        wireParams[2].selectFieldValue === "1002345" &&
        wireParams[3].selectFieldName === "STATUS" &&
        wireParams[3].selectFieldValue === "AU",
    );

    const emptyCriteriaResult = serializeCriteriaToWire({}, fields);
    recordTest(
      "2.2 Omit empty criteria from serialized payload",
      {},
      emptyCriteriaResult,
      emptyCriteriaResult.length === 0,
    );
  }

  // ── 3. Grid Coordinates & Multi-Line Parsing ──
  console.log("\n── 3. Grid Coordinates & Geometry (parseColumnCoordinates) ──");
  {
    const parsedCoords = parseColumnCoordinates("2,5");
    recordTest(
      "3.1 Parses comma-separated row,col coordinate string",
      "2,5",
      parsedCoords,
      parsedCoords.row === 2 && parsedCoords.col === 5,
    );

    const fallbackCoords = parseColumnCoordinates(undefined);
    recordTest(
      "3.2 Fallback to 1,1 on undefined coordinate specifier",
      undefined,
      fallbackCoords,
      fallbackCoords.row === 1 && fallbackCoords.col === 1,
    );

    const formattedCoords = formatColumnCoordinates(3, 4);
    recordTest(
      "3.3 Formats coordinate pair into canonical wire representation",
      { row: 3, col: 4 },
      formattedCoords,
      formattedCoords === "3,4",
    );
  }

  // ── 4. Column Length & Alignment Specifiers ──
  console.log("\n── 4. Column Length & Alignment Specifiers (parseColumnLength) ──");
  {
    const leftCol = parseColumnLength("25,L");
    recordTest(
      "4.1 Parses Left-aligned length specifier (25,L)",
      "25,L",
      leftCol,
      leftCol.length === 25 && leftCol.alignCode === "L" && leftCol.align === "left",
    );

    const rightCol = parseColumnLength("15,R");
    recordTest(
      "4.2 Parses Right-aligned length specifier (15,R)",
      "15,R",
      rightCol,
      rightCol.length === 15 && rightCol.alignCode === "R" && rightCol.align === "right",
    );

    const centerCol = parseColumnLength("10,C");
    recordTest(
      "4.3 Parses Center-aligned length specifier (10,C)",
      "10,C",
      centerCol,
      centerCol.length === 10 && centerCol.alignCode === "C" && centerCol.align === "center",
    );

    const formattedLen = formatColumnLength(35, "R");
    recordTest(
      "4.4 Formats length and alignment to canonical wire string (35,R)",
      { length: 35, alignCode: "R" },
      formattedLen,
      formattedLen === "35,R",
    );
  }

  // ── 5. Presentation Column Metadata Derivation ──
  console.log("\n── 5. Presentation Column Metadata Derivation (deriveInquiryColumnMeta) ──");
  {
    const currencyCol: INQDef = {
      fieldName: "WORKING.BALANCE",
      fieldDisplay: "Working Balance",
      fieldType: "number",
      fieldRowCol: "1,3",
      fieldLength: "20,R",
      fieldFunc: "AMT",
      dataPassable: false,
    };
    const derivedCurrency = deriveInquiryColumnMeta(currencyCol);
    recordTest(
      "5.1 Derives currency format and monospace styling from AMT routine",
      currencyCol,
      derivedCurrency,
      derivedCurrency.format === "currency" &&
        derivedCurrency.align === "right" &&
        derivedCurrency.isMono === true &&
        derivedCurrency.canPass === false,
    );

    const passableCol: INQDef = {
      fieldName: "CUSTOMER.ID",
      fieldDisplay: "Customer Number",
      fieldType: "text",
      fieldRowCol: "1,1",
      fieldLength: "12,L",
      fieldFunc: "",
      dataPassable: true,
    };
    const derivedPassable = deriveInquiryColumnMeta(passableCol);
    recordTest(
      "5.2 Correctly extracts passable drilldown flag and coordinates",
      passableCol,
      derivedPassable,
      derivedPassable.canPass === true &&
        derivedPassable.row === 1 &&
        derivedPassable.order === 1 &&
        derivedPassable.width === `${12 * 9}px`,
    );

    const statusCol: INQDef = {
      fieldName: "RECORD.STATUS",
      fieldDisplay: "Status",
      fieldType: "text",
      fieldRowCol: "2,1",
      fieldLength: "8,C",
      fieldFunc: "",
      dataPassable: false,
    };
    const derivedStatus = deriveInquiryColumnMeta(statusCol);
    recordTest(
      "5.3 Semantic status field detected as badge format with row 2 coordinates",
      statusCol,
      derivedStatus,
      derivedStatus.format === "badge" &&
        derivedStatus.row === 2 &&
        derivedStatus.align === "center",
    );
  }

  // ── 6. Command Template Interpolation ──
  console.log("\n── 6. Command Template Interpolation (resolveCommandTemplate) ──");
  {
    const sampleRow: EnquiryRow = {
      id: "REC-9001",
      recordId: "REC-9001",
      ACCOUNT_NUMBER: "1002345001",
      BRANCH_CODE: "0012",
      TXN_CMD: "TELLER,LC.DEP I 1002345001",
    };

    const interpolatedId = resolveCommandTemplate("ACCOUNT,SEE S @ID", sampleRow);
    recordTest(
      "6.1 Interpolates canonical CBS @ID alias token",
      { template: "ACCOUNT,SEE S @ID", row: sampleRow },
      interpolatedId,
      interpolatedId === "ACCOUNT,SEE S REC-9001",
    );

    const interpolatedField = resolveCommandTemplate(
      "FUNDS.TRANSFER,INP I ACCOUNT_NUMBER",
      sampleRow,
    );
    recordTest(
      "6.2 Interpolates exact named field token from row data",
      { template: "FUNDS.TRANSFER,INP I ACCOUNT_NUMBER", row: sampleRow },
      interpolatedField,
      interpolatedField === "FUNDS.TRANSFER,INP I 1002345001",
    );

    const interpolatedMulti = resolveCommandTemplate("BRANCH.REVIEW S BRANCH_CODE @ID", sampleRow);
    recordTest(
      "6.3 Interpolates multiple tokens in a single command template",
      { template: "BRANCH.REVIEW S BRANCH_CODE @ID", row: sampleRow },
      interpolatedMulti,
      interpolatedMulti === "BRANCH.REVIEW S 0012 REC-9001",
    );
  }

  // ── 7. Internal Commands & Primary Action Resolution ──
  console.log(
    "\n── 7. Internal Commands & Primary Action Resolution (getPrimaryInquiryCommand) ──",
  );
  {
    const sampleRow: EnquiryRow = {
      id: "ACC-5001",
      recordId: "ACC-5001",
      TXN_CMD: "USER.MGT,AUTH A ACC-5001",
    };

    const commands: INQCmd[] = [
      { cmdButton: "View", cmdFor: "ACCOUNT S @ID" },
      { cmdButton: "Edit", cmdFor: "ACCOUNT I @ID" },
    ];

    const standardPrimary = getPrimaryInquiryCommand(commands, sampleRow);
    recordTest(
      "7.1 Resolves standard primary command from View/See action template",
      { commands, row: sampleRow },
      standardPrimary,
      standardPrimary === "ACCOUNT S ACC-5001",
    );

    const internalPrimary = getPrimaryInquiryCommand(commands, sampleRow, true, "TXN_CMD");
    recordTest(
      "7.2 Preempts template with internal dynamic row command when cmdFromInternal is true",
      { commands, row: sampleRow, cmdFromInternal: true, cmdFieldName: "TXN_CMD" },
      internalPrimary,
      internalPrimary === "USER.MGT,AUTH A ACC-5001",
    );
  }

  // ── Summary Report ──
  console.log("\n================================================================================");
  console.log("                           TEST SUITE SUMMARY                                   ");
  console.log("================================================================================");
  const total = testCases.length;
  const passed = testCases.filter((t) => t.passed).length;
  const failed = total - passed;

  console.log(` Total Checks : ${total}`);
  console.log(` Passed       : \x1b[32m${passed}\x1b[0m`);
  console.log(` Failed       : ${failed > 0 ? `\x1b[31m${failed}\x1b[0m` : "\x1b[32m0\x1b[0m"}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Verification harness crashed:", err);
  process.exit(1);
});

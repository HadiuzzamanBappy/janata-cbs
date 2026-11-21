/**
 * Automated Verification Suite for CBS Inquiry Specification & Compiler (@/lib/cbs-inquiry-spec)
 *
 * Deterministic & Transparent Verification of Core Inquiry Specification Subsystems:
 * 1. Fixed Selection Expression Parsing (parseFixedSelection)
 * 2. Operator Filters on the Wire (serializeCriteriaToWire, buildDefaultCriteria)
 * 3. Server Query Composition (composeInquiryQuery: order, branch pin, refusals)
 * 4. Grid Coordinates & Column Length Specifiers
 * 5. Presentation Column Metadata Derivation (deriveInquiryColumnMeta)
 * 6. Command Template Interpolation (resolveCommandTemplate, fail-closed tokens)
 * 7. Row Actions & Primary Command (resolveRowActions, primaryRowCommand, rowCommandOf)
 * 8. Row Sorting (sortInquiryRows, nextInquirySort)
 * 9. Operand Options & Page Size (INQUIRY_OPERAND_OPTIONS, operandOptionsFor, inquiryPageSize)
 *
 * Usage:
 *   pnpm exec tsx scripts/verify/verify-cbs-inquiry-spec.ts
 */

import {
  buildDefaultCriteria,
  composeInquiryQuery,
  deriveInquiryColumnMeta,
  formatColumnCoordinates,
  formatColumnLength,
  INQUIRY_OPERAND_OPTIONS,
  inquiryPageSize,
  nextInquirySort,
  operandOptionsFor,
  parseColumnCoordinates,
  parseColumnLength,
  primaryRowCommand,
  resolveCommandTemplate,
  resolveRowActions,
  rowCommandOf,
  serializeCriteriaToWire,
  sortInquiryRows,
} from "@/lib/cbs-inquiry-spec";
import {
  type INQCmd,
  type INQDef,
  type INQSelectField,
  INQUIRY_OPERANDS,
  type InquiryConfigRecord,
  type InquiryCriteriaParam,
  type InquiryRow,
  inquiryConfigRecordSchema,
  parseFixedSelection,
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

const wire = (params: readonly InquiryCriteriaParam[]) =>
  params
    .map((c) => `${c.selectFieldName} ${c.selectFieldOperator} ${c.selectFieldValue}`)
    .join("; ");

const field = (over: Partial<INQSelectField>): INQSelectField => ({
  selectFieldName: "",
  selectFieldDisplay: "",
  selectFieldType: "text",
  selectFieldOperator: "EQ",
  selectFieldOperatorFixed: "",
  selectFieldValue: "",
  selectFieldRequired: false,
  ...over,
});

const column = (over: Partial<INQDef>): INQDef => ({
  fieldName: "COL",
  fieldDisplay: "Col",
  fieldType: "DC",
  fieldFunc: "",
  fieldRowCol: "1,1",
  fieldLength: "20,L",
  dataPassable: false,
  ...over,
});

const inquiry = (info: Record<string, unknown>, fields: INQSelectField[]): InquiryConfigRecord =>
  inquiryConfigRecordSchema.parse({
    INQInfo: { controllerName: "ACCOUNT", ...info },
    INQSelectField: fields,
  });

async function runSuite() {
  console.log("\n================================================================================");
  console.log("             CBS INQUIRY SPECIFICATION & COMPILER VERIFICATION                  ");
  console.log("================================================================================");
  console.log(
    " Architecture : Pure Headless Inquiry Specification Engine (@/lib/cbs-inquiry-spec)",
  );
  console.log(
    " Domain Focus : Fixed Selection, Filters, Query Composition, Layout, Commands, Sort",
  );
  console.log("================================================================================");

  // ── 1. Fixed Selection Expression Parsing ──
  console.log("\n── 1. Fixed Selection Expression Parsing (parseFixedSelection) ──");
  {
    const singleStmt = parseFixedSelection("STATUS EQ AU").criteria;
    recordTest(
      "1.1 Single fixed selection parsed into canonical InquiryCriteriaParam",
      "STATUS EQ AU",
      singleStmt,
      singleStmt.length === 1 && wire(singleStmt) === "STATUS EQ AU",
    );

    const multiStmt = parseFixedSelection("RECORD.STATUS NE 'REVE', CATEGORY EQ 1001").criteria;
    recordTest(
      "1.2 Comma-delimited statements with quotes parsed cleanly",
      "RECORD.STATUS NE 'REVE', CATEGORY EQ 1001",
      multiStmt,
      wire(multiStmt) === "RECORD.STATUS NE REVE; CATEGORY EQ 1001",
    );

    const emptyStmt = parseFixedSelection("   ");
    recordTest(
      "1.3 Empty or whitespace fixedSelection returns no criteria and nothing invalid",
      "   ",
      emptyStmt,
      emptyStmt.criteria.length === 0 && emptyStmt.invalid.length === 0,
    );

    const quoted = parseFixedSelection('remarks EQ "a,b"; recStatus XX AU; broken');
    recordTest(
      "1.4 Quoted commas stay in the value; bad statements are reported, never dropped",
      'remarks EQ "a,b"; recStatus XX AU; broken',
      quoted,
      quoted.criteria.length === 1 &&
        quoted.criteria[0].selectFieldValue === "a,b" &&
        JSON.stringify(quoted.invalid) === JSON.stringify(["recStatus XX AU", "broken"]),
    );

    const open = parseFixedSelection('remarks EQ "a, STATUS EQ AU');
    recordTest(
      "1.5 An unterminated quote is invalid, so the statements after it are never swallowed",
      'remarks EQ "a, STATUS EQ AU',
      open,
      open.criteria.length === 0 && open.invalid.length === 1,
    );

    const apostrophe = parseFixedSelection("name NE O'Brien; recStatus EQ AU");
    const quotedName = parseFixedSelection(`name EQ "O'Brien"; recStatus EQ AU`);
    recordTest(
      "1.6 A bare apostrophe can't widen the inquiry; quoting the value keeps both conditions",
      { bare: "name NE O'Brien; recStatus EQ AU", quoted: `name EQ "O'Brien"; recStatus EQ AU` },
      { bare: apostrophe, quoted: quotedName.criteria },
      apostrophe.invalid.length > 0 &&
        !apostrophe.criteria.some((c) => c.selectFieldName === "name") &&
        wire(quotedName.criteria) === "name EQ O'Brien; recStatus EQ AU",
    );

    const semi = parseFixedSelection(" ; remarks EQ 'x;y'; STATUS eq AU ;;");
    recordTest(
      "1.7 Quoted ';' is kept, a lower-case operand is normalized, empty statements are skipped",
      " ; remarks EQ 'x;y'; STATUS eq AU ;;",
      semi,
      semi.invalid.length === 0 && wire(semi.criteria) === "remarks EQ x;y; STATUS EQ AU",
    );

    const bad = parseFixedSelection(`a LIKE 1; b >= 2; X ; DROP; d EQ 'x' 'y'; c EQ "it"s"`);
    recordTest(
      "1.8 Unknown or 4-letter operands, symbols, bare words and stray inner quotes are all invalid",
      `a LIKE 1; b >= 2; X ; DROP; d EQ 'x' 'y'; c EQ "it"s"`,
      bad,
      bad.criteria.length === 0 && bad.invalid.length === 6,
    );
  }

  // ── 2. Operator Filters on the Wire ──
  console.log("\n── 2. Operator Filters on the Wire (serializeCriteriaToWire) ──");
  const fields: INQSelectField[] = [
    field({ selectFieldName: "ACCOUNT.NO", selectFieldDisplay: "Account Number" }),
    field({
      selectFieldName: "STATUS",
      selectFieldDisplay: "Status",
      selectFieldType: "select",
      selectFieldValue: "AU",
      selectFieldOperatorFixed: "EQ",
      selectFieldRequired: true,
    }),
    field({ selectFieldName: "OPENED", selectFieldDisplay: "Opened", selectFieldType: "date" }),
  ];
  {
    const sent = serializeCriteriaToWire(
      {
        STATUS: { value: " AU ", operand: "NE" },
        "ACCOUNT.NO": { value: "1002345", operand: "LK" },
        OPENED: { value: "   ", operand: "GE" },
        GHOST: { value: "1", operand: "GT" },
      },
      fields,
    );
    recordTest(
      "2.1 Config order, values trimmed, blanks and unknown keys dropped, a locked operand kept",
      { STATUS: "NE ' AU '", "ACCOUNT.NO": "LK", OPENED: "blank", GHOST: "not a filter" },
      sent,
      JSON.stringify(sent) ===
        JSON.stringify([
          { selectFieldName: "ACCOUNT.NO", selectFieldOperator: "LK", selectFieldValue: "1002345" },
          { selectFieldName: "STATUS", selectFieldOperator: "EQ", selectFieldValue: "AU" },
        ]),
    );

    const defaults = buildDefaultCriteria([...fields, field({ selectFieldName: "  " })]);
    recordTest(
      "2.2 Default criteria come from the config; a filter without a name is skipped",
      fields.map((f) => f.selectFieldName),
      defaults,
      Object.keys(defaults).join() === "ACCOUNT.NO,STATUS,OPENED" &&
        defaults.STATUS.value === "AU" &&
        defaults.STATUS.operand === "EQ",
    );
  }

  // ── 3. Server Query Composition ──
  console.log("\n── 3. Server Query Composition (composeInquiryQuery) ──");
  {
    const branchWise = inquiry(
      { showBranchWise: true, fixedSelection: "BRANCH.TYPE EQ URBAN" },
      fields,
    );
    const composed = composeInquiryQuery(
      branchWise,
      [
        { selectFieldName: "account.no", selectFieldOperator: "LK", selectFieldValue: "1002345" },
        { selectFieldName: "STATUS", selectFieldOperator: "EQ", selectFieldValue: "AU" },
      ],
      " JB0012 ",
    );
    recordTest(
      "3.1 Branch pin, then fixed selection, then the operator's filters (canonical names, config types)",
      { showBranchWise: true, fixed: "BRANCH.TYPE EQ URBAN", session: " JB0012 " },
      composed,
      composed.ok &&
        wire(composed.queryString) ===
          "branchCode EQ JB0012; BRANCH.TYPE EQ URBAN; ACCOUNT.NO LK 1002345; STATUS EQ AU" &&
        composed.queryString[3].selectFieldType === "select",
    );

    const global = composeInquiryQuery(
      inquiry({}, [field({ selectFieldName: "branchCode", selectFieldDisplay: "Branch" })]),
      [{ selectFieldName: "branchCode", selectFieldOperator: "EQ", selectFieldValue: "JB0099" }],
      "JB0012",
    );
    recordTest(
      "3.2 An inquiry that isn't branch-wise adds no pin, and a branch filter is an ordinary filter",
      { showBranchWise: false, filter: "branchCode EQ JB0099" },
      global,
      global.ok && wire(global.queryString) === "branchCode EQ JB0099",
    );

    const required = [
      { selectFieldName: "STATUS", selectFieldOperator: "EQ" as const, selectFieldValue: "AU" },
    ];
    const refusals = {
      unknown: composeInquiryQuery(
        branchWise,
        [
          ...required,
          { selectFieldName: "SALARY", selectFieldOperator: "GT", selectFieldValue: "0" },
        ],
        "JB0012",
      ),
      twice: composeInquiryQuery(branchWise, [...required, ...required], "JB0012"),
      fixedField: composeInquiryQuery(
        inquiry({ fixedSelection: "STATUS EQ AU" }, fields),
        required,
        "JB0012",
      ),
      branchField: composeInquiryQuery(
        inquiry({ showBranchWise: true }, [...fields, field({ selectFieldName: "branchCode" })]),
        [
          ...required,
          { selectFieldName: "branchCode", selectFieldOperator: "EQ", selectFieldValue: "JB0099" },
        ],
        "JB0012",
      ),
      lockedOperand: composeInquiryQuery(
        branchWise,
        [{ ...required[0], selectFieldOperator: "NE" }],
        "JB0012",
      ),
      patternOnDate: composeInquiryQuery(
        branchWise,
        [
          ...required,
          { selectFieldName: "OPENED", selectFieldOperator: "CT", selectFieldValue: "2026" },
        ],
        "JB0012",
      ),
      requiredMissing: composeInquiryQuery(branchWise, [], "JB0012"),
      invalidFixed: composeInquiryQuery(
        inquiry({ fixedSelection: 'recStatus EQ "AU' }, fields),
        required,
        "JB0012",
      ),
      fixedBranch: composeInquiryQuery(
        inquiry({ showBranchWise: true, fixedSelection: "branchCode EQ JB0099" }, fields),
        required,
        "JB0012",
      ),
      noSessionBranch: composeInquiryQuery(branchWise, required, "  "),
    };
    recordTest(
      "3.3 Anything that could widen the result is refused, never dropped",
      Object.keys(refusals),
      Object.fromEntries(Object.entries(refusals).map(([k, r]) => [k, r.ok ? "RAN" : r.error])),
      Object.values(refusals).every((r) => !r.ok),
    );
  }

  // ── 4. Grid Coordinates & Column Length Specifiers ──
  console.log(
    "\n── 4. Grid Coordinates & Column Length (parseColumnCoordinates, parseColumnLength) ──",
  );
  {
    const coords = [
      parseColumnCoordinates("2,5"),
      parseColumnCoordinates(undefined),
      parseColumnCoordinates("0,-3"),
    ];
    recordTest(
      "4.1 Coordinates parse, default to 1,1, and never go below 1",
      ["2,5", undefined, "0,-3"],
      coords,
      coords.map((c) => `${c.row},${c.col}`).join(" ") === "2,5 1,1 1,1" &&
        formatColumnCoordinates(3.7, 4) === "3,4",
    );

    const lengths = ["25,L", "15,R", "10,C", "-5,X", "abc"].map(parseColumnLength);
    recordTest(
      "4.2 Length and alignment parse; a non-positive or bad length falls back to 20,L",
      ["25,L", "15,R", "10,C", "-5,X", "abc"],
      lengths,
      lengths.map((l) => `${l.length},${l.alignCode}`).join(" ") === "25,L 15,R 10,C 20,L 20,L" &&
        formatColumnLength(35, "R") === "35,R" &&
        formatColumnLength(2.5) === "2,L",
    );
  }

  // ── 5. Presentation Column Metadata Derivation ──
  console.log("\n── 5. Presentation Column Metadata Derivation (deriveInquiryColumnMeta) ──");
  {
    const currency = deriveInquiryColumnMeta(column({ fieldLength: "20,L", fieldFunc: "AMT" }));
    recordTest(
      "5.1 An amount column is currency, right-aligned and monospaced even when configured left",
      "AMT, 20,L",
      currency,
      currency.format === "currency" && currency.align === "right" && currency.isMono,
    );

    const passable = deriveInquiryColumnMeta(column({ fieldLength: "12,L", dataPassable: true }));
    recordTest(
      "5.2 Passable drill-down flag, coordinates and width",
      "12,L passable",
      passable,
      passable.canPass && passable.row === 1 && passable.order === 1 && passable.width === "108px",
    );

    const formats = ["DATE.CONVERT", "CURRDATE", "D", "CURRENCY", "SUBSTRING,1,4", ""].map(
      (fieldFunc) => deriveInquiryColumnMeta(column({ fieldFunc, fieldLength: "10,R" })).format,
    );
    recordTest(
      "5.3 Routines match whole tokens and date wins (CURRDATE is a date); no routine + R is a number",
      ["DATE.CONVERT", "CURRDATE", "D", "CURRENCY", "SUBSTRING,1,4", ""],
      formats,
      formats.join() === "date,date,date,currency,number,number",
    );

    const status = deriveInquiryColumnMeta(
      column({ fieldDisplay: "  ", fieldRowCol: "2,1", fieldLength: "8,C" }),
    );
    recordTest(
      "5.4 A centered code column is monospaced; an empty header falls back to the field name",
      "COL, '  ', 2,1, 8,C",
      status,
      status.format === "text" &&
        status.align === "center" &&
        status.isMono &&
        status.label === "COL",
    );
  }

  // ── 6. Command Template Interpolation ──
  console.log("\n── 6. Command Template Interpolation (resolveCommandTemplate) ──");
  const sampleRow: InquiryRow = {
    recordId: "REC-9001",
    ACCOUNT_NUMBER: "1002345001",
    BRANCH_CODE: "0012",
    AMOUNT: 2500,
    NAME: "Abdul Karim",
    TAGS: ["A", "B"],
    BLANK: "  ",
  };
  {
    const templates = {
      id: resolveCommandTemplate("ACCOUNT,SEE S @ID", sampleRow),
      field: resolveCommandTemplate("FUNDS.TRANSFER,INP I ACCOUNT_NUMBER", sampleRow),
      multi: resolveCommandTemplate("BRANCH.REVIEW S BRANCH_CODE @id", sampleRow),
      number: resolveCommandTemplate("TXN S AMOUNT", sampleRow),
      caseless: resolveCommandTemplate("ACCOUNT S account_number", sampleRow),
    };
    recordTest(
      "6.1 @ID, named fields, several tokens, numbers and a case-insensitive fallback are interpolated",
      sampleRow,
      templates,
      templates.id === "ACCOUNT,SEE S REC-9001" &&
        templates.field === "FUNDS.TRANSFER,INP I 1002345001" &&
        templates.multi === "BRANCH.REVIEW S 0012 REC-9001" &&
        templates.number === "TXN S 2500" &&
        templates.caseless === "ACCOUNT S 1002345001",
    );

    const headSafe = resolveCommandTemplate("USERS I recordId", {
      ...sampleRow,
      USERS: "HIJACK",
      I: "X",
    });
    recordTest(
      "6.2 Screen and function tokens are never replaced by same-named row columns",
      { template: "USERS I recordId", row: { USERS: "HIJACK", I: "X" } },
      headSafe,
      headSafe === "USERS I REC-9001",
    );

    const closed = {
      prototype: resolveCommandTemplate("ACCOUNT S constructor", sampleRow),
      missing: resolveCommandTemplate("ACCOUNT S missingField", sampleRow),
      blank: resolveCommandTemplate("ACCOUNT S BLANK", sampleRow),
      spaces: resolveCommandTemplate("CUSTOMER S NAME", sampleRow),
      list: resolveCommandTemplate("ACCOUNT S TAGS", sampleRow),
      noKey: resolveCommandTemplate("ACCOUNT S @ID", { recordId: "" }),
      malformed: resolveCommandTemplate("ACCOUNT VIEW @ID", sampleRow),
    };
    recordTest(
      '6.3 Fails closed (""): prototype keys, missing/blank/spaced/list values, a row without a key, a non-RIDASHL function',
      Object.keys(closed),
      closed,
      Object.values(closed).every((v) => v === ""),
    );
  }

  // ── 7. Row Actions & Primary Command ──
  console.log("\n── 7. Row Actions & Primary Command (resolveRowActions, primaryRowCommand) ──");
  {
    const row: InquiryRow = { recordId: "ACC-5001", TXN_CMD: "USER.MGT,AUTH  A ACC-5001" };
    const commands: INQCmd[] = [
      { cmdButton: "Edit", cmdFor: "ACCOUNT I @ID" },
      { cmdButton: "View", cmdFor: "ACCOUNT S @ID" },
      { cmdButton: "Work", cmdFor: "" },
    ];

    recordTest(
      "7.1 The primary command is the first See (S) button, whatever the labels say",
      commands,
      primaryRowCommand(commands, row, false, ""),
      primaryRowCommand(commands, row, false, "") === "ACCOUNT S ACC-5001",
    );

    recordTest(
      "7.2 With a dynamic row command, double-click runs the row's own command (as sent, spaces normalized)",
      { cmdFromInternal: true, cmdFieldName: "TXN_CMD" },
      primaryRowCommand(commands, row, true, "TXN_CMD"),
      primaryRowCommand(commands, row, true, "TXN_CMD") === "USER.MGT,AUTH A ACC-5001",
    );

    const actions = resolveRowActions(commands, row, true, "TXN_CMD");
    recordTest(
      "7.3 Each button runs its own cmdFor; only a button without one runs the row command; the function decides the right",
      commands,
      actions,
      actions.map((a) => `${a.label}=${a.command}|${a.func}`).join(", ") ===
        "Edit=ACCOUNT I ACC-5001|I, View=ACCOUNT S ACC-5001|S, Work=USER.MGT,AUTH A ACC-5001|A",
    );

    const openOnly = resolveRowActions([], row, true, "TXN_CMD");
    const none = resolveRowActions([], { ...row, TXN_CMD: "not a command" }, true, "TXN_CMD");
    recordTest(
      "7.4 Without buttons the row command is a single Open action; a malformed row command offers nothing",
      { buttons: [], rowCommand: ["USER.MGT,AUTH A ACC-5001", "not a command"] },
      { openOnly, none },
      openOnly.length === 1 &&
        openOnly[0].label === "Open" &&
        openOnly[0].func === "A" &&
        none.length === 0,
    );

    const listRow = {
      ...row,
      eventAction: [{ cmdFor: "BRANCH I recordId", cmdButton: "EDIT" }],
    } as InquiryRow;
    recordTest(
      "7.5 A dynamic row command field that isn't text (the core's eventAction list) is never run",
      { cmdFieldName: "eventAction", value: listRow.eventAction },
      {
        rowCommand: rowCommandOf(listRow, true, "eventAction"),
        primary: primaryRowCommand(commands, listRow, true, "eventAction"),
      },
      rowCommandOf(listRow, true, "eventAction") === "" &&
        primaryRowCommand(commands, listRow, true, "eventAction") === "ACCOUNT S ACC-5001",
    );
  }

  // ── 8. Row Sorting ──
  console.log("\n── 8. Row Sorting (sortInquiryRows, nextInquirySort) ──");
  {
    const metas = [
      deriveInquiryColumnMeta(column({ fieldName: "AMT", fieldFunc: "AMT" })),
      deriveInquiryColumnMeta(column({ fieldName: "NAME" })),
      deriveInquiryColumnMeta(column({ fieldName: "OPENED", fieldFunc: "DATE.CONVERT" })),
    ];
    const rows: InquiryRow[] = ["10.25", "-5.00", "1,234.50", "", "999.00", "10.5", "3"].map(
      (AMT, i) => ({
        recordId: `R${i}`,
        AMT,
        NAME: ["b", "A", "a", "c", "B", "x", "y"][i],
        OPENED: [
          "2026-01-10",
          "2026-01-03",
          "2025-12-31",
          "2026-02-01",
          "2026-01-03",
          "",
          "2024-06-30",
        ][i],
      }),
    );
    const byAmount = sortInquiryRows(rows, { column: "AMT", direction: "asc" }, metas).map(
      (r) => r.AMT,
    );
    const byAmountDesc = sortInquiryRows(rows, { column: "AMT", direction: "desc" }, metas).map(
      (r) => r.AMT,
    );
    recordTest(
      "8.1 Amounts sort as numbers (thousands separators, decimals, negatives); empty cells last both ways",
      rows.map((r) => r.AMT),
      { asc: byAmount, desc: byAmountDesc },
      byAmount.join("|") === "-5.00|3|10.25|10.5|999.00|1,234.50|" &&
        byAmountDesc.join("|") === "1,234.50|999.00|10.5|10.25|3|-5.00|",
    );

    const byName = sortInquiryRows(rows, { column: "NAME", direction: "asc" }, metas).map(
      (r) => r.recordId,
    );
    const byDate = sortInquiryRows(rows, { column: "OPENED", direction: "asc" }, metas).map(
      (r) => r.OPENED,
    );
    recordTest(
      "8.2 Text ignores case and keeps equal rows in order (stable); ISO dates sort chronologically",
      { names: rows.map((r) => r.NAME), dates: rows.map((r) => r.OPENED) },
      { byName, byDate },
      byName.slice(0, 4).join() === "R1,R2,R0,R4" &&
        byDate.join("|") === "2024-06-30|2025-12-31|2026-01-03|2026-01-03|2026-01-10|2026-02-01|",
    );

    const cycle = [
      nextInquirySort(null, "AMT"),
      nextInquirySort({ column: "AMT", direction: "asc" }, "AMT"),
      nextInquirySort({ column: "AMT", direction: "desc" }, "AMT"),
      nextInquirySort({ column: "AMT", direction: "desc" }, "NAME"),
    ];
    recordTest(
      "8.3 A header click cycles ascending → descending → unsorted; another column starts ascending",
      "AMT ×3, then NAME",
      cycle,
      cycle[0]?.direction === "asc" &&
        cycle[1]?.direction === "desc" &&
        cycle[2] === null &&
        cycle[3]?.column === "NAME" &&
        cycle[3]?.direction === "asc",
    );
  }

  // ── 9. Operand Options & Page Size ──
  console.log("\n── 9. Operand Options & Page Size (INQUIRY_OPERAND_OPTIONS, inquiryPageSize) ──");
  {
    const optionValues = INQUIRY_OPERAND_OPTIONS.map((o) => o.value);
    const dateOps = operandOptionsFor("date").map((o) => o.value);
    recordTest(
      "9.1 The operand list matches the core's operands exactly; pattern operands are offered on text only",
      { operands: INQUIRY_OPERANDS, date: dateOps },
      optionValues,
      [...optionValues].sort().join() === [...INQUIRY_OPERANDS].sort().join() &&
        operandOptionsFor("text").length === INQUIRY_OPERANDS.length &&
        !dateOps.some((v) => ["CT", "SW", "EW", "LK"].includes(v)),
    );

    const sizes = ["50", "0", "-3", "2.5", "abc", ""].map((perpageItem) =>
      inquiryPageSize({ perpageItem }),
    );
    recordTest(
      "9.2 Page size is perpageItem when it is a positive whole number, otherwise 30",
      ["50", "0", "-3", "2.5", "abc", ""],
      sizes,
      sizes.join() === "50,30,30,30,30,30",
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

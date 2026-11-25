/**
 * Automated Verification Suite for CBS Form Spec & Compiler Engine (@/lib/cbs-form-spec)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/cbs-form-spec` with explicit Input and Output visualization:
 * 1. Semantic Width Mapping (defaultWidthForLength: xs, sm, md, lg, full)
 * 2. Model Preview Layout (buildFallbackSections: one card of every model field; MODEL.CONFIG preview only)
 * 3. Custom Layout Compilation & Model Rules Merging (compileFormSpec: preserves layout, enforces model constraints)
 * 4. Headless Value Validation (validateValues: required, numeric/digits, date, length, clean state,
 *    hidden fields, multi-value items, plain numbers, real calendar dates, repeating sets with no rows)
 * 10. Designer settings honoured by the engine (decimals, date offsets, ON_CHANGE, in / notIn lists,
 *    cascades, boolean wire values, trim on blur, root layout)
 * 11. Object groups: inner-field spec lookup by value key, and the designer's field tree
 *    (find / update / remove inner fields, model match by SN)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-cbs-form-spec.ts
 */

import {
  findFieldDeep,
  findModelPropDeep,
  updateFieldDeep,
} from "@/features/system/form-config/hooks/fc-field-tree";
import {
  applyFieldTransform,
  buildRenderBlocks,
  compileFormSpec,
  deleteFieldValue,
  deriveSemanticWidth,
  evaluateFieldCascade,
  evaluateFieldCondition,
  evaluateOnChangeRule,
  findFieldSpecByKey,
  getBlockGapSectionIndex,
  getFieldColSpanClass,
  getFieldValue,
  getGridColsClass,
  getInputWidthClass,
  isBooleanOn,
  isLiveTransform,
  normalizeRecordDates,
  resolveFieldDateRange,
  resolveWidgetType,
  setFieldValue,
  toBooleanValue,
  validateSingleField,
  validateValues,
} from "@/lib/cbs-form-spec";
import { offsetIsoDate, todayIso } from "@/lib/core-utils";
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
  AUTHLEVEL: 1,
  ASSOCIATES: [],
  _DEVBY: "SYSTEM",
  _DEVDATE: "2026-10-20",
  IDDEF: {
    IDPREFIX: "AC",
    IDPATTERN: "AC{YYYY}{SEQ:6}",
    SEQUENCELENGTH: 6,
    SEQUENCERESET: false,
    SEQRESETPERIOD: "",
  },
  PROPERTIES: [
    {
      SN: "1",
      NAME: "accountNumber",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 12,
      REQUIRED: true,
      MODELNAME: "",
    },
    {
      SN: "2",
      NAME: "accountTitle",
      TYPE: "String",
      STRUCTURE: "S",
      LENGTH: 50,
      REQUIRED: true,
      MODELNAME: "",
    },
    {
      SN: "3",
      NAME: "balance",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 10,
      REQUIRED: false,
      MODELNAME: "",
    },
    {
      SN: "4",
      NAME: "openingDate",
      TYPE: "Date",
      STRUCTURE: "S",
      LENGTH: 10,
      REQUIRED: false,
      MODELNAME: "",
    },
    {
      SN: "5",
      NAME: "nomineeShare",
      TYPE: "Number",
      STRUCTURE: "S",
      LENGTH: 3,
      REQUIRED: true,
      MODELNAME: "",
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
  console.log("\n── 1. Responsive Numerical & Semantic Width Mapping (deriveSemanticWidth) ──");
  const wShort = deriveSemanticWidth(undefined, 4, "String");
  recordTest(
    "1.1 Maps short field length (<= 6) to 'xs' semantic token",
    { length: 4 },
    { width: wShort },
    wShort === "xs",
  );

  const wLong = deriveSemanticWidth(undefined, 120, "String");
  recordTest(
    "1.2 Maps long field length (120) to 'xl' semantic token",
    { length: 120 },
    { width: wLong },
    wLong === "xl",
  );

  const wDate = deriveSemanticWidth(undefined, 10, "Date");
  recordTest(
    "1.3 Maps Date type to 'sm' semantic token regardless of length",
    { type: "Date", length: 10 },
    { width: wDate },
    wDate === "sm",
  );

  const wExplicitPreserved = deriveSemanticWidth("lg", 4, "String");
  const resolvedSelect = resolveWidgetType("String", {
    type: "O",
    data: [{ code: "A", label: "Active" }],
  });
  recordTest(
    "1.4 Canonical Formulas: deriveSemanticWidth preserves explicit token & resolveWidgetType infers lookup 'select'",
    { explicitInput: "lg", paramType: "O" },
    { derivedWidth: wExplicitPreserved, resolvedWidget: resolvedSelect },
    wExplicitPreserved === "lg" && resolvedSelect === "select",
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
      generatedFirstLabel: fallback.frmElements.sections[0]?.fields[0]?.LABEL,
    },
    fallback.title === "Customer Account Definition" &&
      fallback.frmElements.sections.length === 1 &&
      fallback.frmElements.sections[0]?.fields.length === testModel.PROPERTIES.length &&
      fallback.frmElements.sections[0]?.fields[0]?.LABEL === "Account Number",
  );

  // ── 3. Custom Layout Compilation & Model Rules Merging ──
  console.log("\n── 3. Custom Layout Composition & Model Constraints ──");
  const customLayout: FormConfigRecord = {
    title: "Account Custom Form",
    description: "Tailored view",
    authNumber: 1,
    frmRoutine: { rtnValidate: [], rtnBeforeAuth: [], rtnAfterAuth: [] },
    frmElements: {
      sections: [
        {
          id: "sec_custom",
          title: "Primary Info",
          containerType: "card",
          fields: [
            {
              SN: "1",
              NAME: "accountNumber",
              LABEL: "Bank A/C Number", // Custom label
              TYPE: "String",
              LENGTH: 0, // Fallback to model physical length (12)
              STRUCTURE: "S",
              REQUIRED: false, // Model constraint (true) must take precedence
              DISABLED: false,
              WIDTH: "md",
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

  const advancedLayout: FormConfigRecord = {
    title: "Advanced Layout",
    frmElements: {
      sections: [
        {
          id: "sec_adv",
          containerType: "card",
          fields: [
            {
              SN: "1",
              NAME: "accountNumber",
              LABEL: "A/C Number",
              TYPE: "String",
              STRUCTURE: "S",
              LENGTH: 12,
              TRANSFORM: "uppercase",
              CASCADE: [{ when: "SAVINGS", set: { balance: 500 } }],
              ON_CHANGE: { target: "accountTitle", action: "copy" },
              DISABLED_WHEN: { field: "USERDEFINEID", operator: "truthy" },
              RATE_CONFIG: { decimals: 4, suffix: "%" },
            },
          ],
        },
      ],
    },
  };
  const compiledAdv = compileFormSpec(testModel, advancedLayout);
  const advField = compiledAdv.frmElements.sections[0]?.fields[0];
  recordTest(
    "3.2 Preserves all advanced FormElement properties (CASCADE, TRANSFORM, RATE_CONFIG, ON_CHANGE, DISABLED_WHEN)",
    { fieldName: "accountNumber" },
    {
      transform: advField?.TRANSFORM,
      hasCascade: Boolean(advField?.CASCADE),
      hasOnChange: Boolean(advField?.ON_CHANGE),
      hasDisabledWhen: Boolean(advField?.DISABLED_WHEN),
      hasRateConfig: Boolean(advField?.RATE_CONFIG),
    },
    advField?.TRANSFORM === "uppercase" &&
      Array.isArray(advField?.CASCADE) &&
      advField?.ON_CHANGE?.target === "accountTitle" &&
      advField?.DISABLED_WHEN !== undefined &&
      advField?.RATE_CONFIG?.suffix === "%",
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
    numErrors.balance === "Balance must be a valid number" &&
      numErrors.nomineeShare === "Nominee Share cannot exceed 3 digits",
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
    dateErrors.openingDate === "Opening Date must be a valid date",
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

  const boolValid = validateSingleField(
    { required: false, length: 1, type: "Boolean", label: "User Define Id" },
    false,
  );
  recordTest(
    "4.6 Validates boolean fields (true/false) with length 1 without character length errors",
    { value: false, length: 1, type: "Boolean" },
    { error: boolValid },
    boolValid === null,
  );

  const timeValid = validateSingleField(
    { required: true, type: "Time", label: "Transaction Time" },
    "14:30",
  );
  const timeInvalid = validateSingleField(
    { required: true, type: "Time", label: "Transaction Time" },
    "invalid-time",
  );
  recordTest(
    "4.7 Validates Time format (HH:mm) accurately",
    { valid: "14:30", invalid: "invalid-time" },
    { validRes: timeValid, invalidRes: timeInvalid },
    timeValid === null && timeInvalid === "Transaction Time must be a valid time (HH:mm)",
  );

  const customRuleErrors = validateSingleField(
    {
      required: true,
      label: "Custom Code",
      type: "String",
      validation: {
        matches: "^[A-Z]{3}$",
        message: "Code must be exactly 3 uppercase letters",
      },
    },
    "abcd",
  );
  recordTest(
    "4.8 Evaluates custom validation matches regex with custom message",
    { value: "abcd", regex: "^[A-Z]{3}$" },
    { error: customRuleErrors },
    customRuleErrors === "Code must be exactly 3 uppercase letters",
  );

  const nestedObjSection = [
    {
      id: "sec_obj",
      containerType: "card" as const,
      fields: [
        {
          SN: "1",
          NAME: "AUDIT_DETAILS",
          TYPE: "Array" as const,
          STRUCTURE: "S" as const,
          LENGTH: 0,
          PROP: [
            {
              SN: "1.1",
              NAME: "reviewer",
              LABEL: "Reviewer Name",
              TYPE: "String" as const,
              STRUCTURE: "S" as const,
              LENGTH: 35,
              REQUIRED: true,
            },
          ],
        },
      ],
    },
  ];
  const nestedErrors = validateValues(nestedObjSection, {
    AUDIT_DETAILS: { reviewer: "" },
  });
  recordTest(
    "4.9 Recursively validates nested sub-properties (PROP) in object fields",
    { data: { AUDIT_DETAILS: { reviewer: "" } } },
    nestedErrors,
    nestedErrors["AUDIT_DETAILS.reviewer"] === "Reviewer Name is required",
  );

  const conditionalSection = [
    {
      id: "sec_cond",
      containerType: "card" as const,
      fields: [
        { SN: "1", NAME: "kind", TYPE: "String" as const, STRUCTURE: "S" as const, LENGTH: 1 },
        {
          SN: "2",
          NAME: "extra",
          LABEL: "Extra",
          TYPE: "String" as const,
          STRUCTURE: "S" as const,
          LENGTH: 10,
          REQUIRED: true,
          VISIBLE_WHEN: { field: "kind", operator: "eq" as const, value: "X" },
        },
      ],
    },
  ];
  const hiddenErrors = validateValues(conditionalSection, { kind: "Y" });
  const shownErrors = validateValues(conditionalSection, { kind: "X" });
  recordTest(
    "4.10 Skips a required field the screen hides (VISIBLE_WHEN false), checks it once shown",
    { hidden: { kind: "Y" }, shown: { kind: "X" } },
    { hiddenErrors, shownErrors },
    !hiddenErrors.extra && shownErrors.extra === "Extra is required",
  );

  const multiTooLong = validateSingleField({ type: "String", length: 3, label: "Code" }, [
    "ok",
    "toolong",
  ]);
  const multiDigits = validateSingleField({ type: "Number", length: 2, label: "Qty" }, ["1", "2"]);
  const multiNotNumber = validateSingleField({ type: "Number", length: 5, label: "Qty" }, ["abc"]);
  recordTest(
    "4.11 Checks every item of a multi-value field (length, number) without false digit errors",
    { tooLong: ["ok", "toolong"], digits: ["1", "2"], notNumber: ["abc"] },
    { multiTooLong, multiDigits, multiNotNumber },
    multiTooLong === "Code cannot exceed 3 characters" &&
      multiDigits === null &&
      multiNotNumber === "Qty must be a valid number",
  );

  const junkNumbers = ["Infinity", "0x10", "1e3"].map((v) =>
    validateSingleField({ type: "Number", length: 18, label: "Amount" }, v),
  );
  const plainNumbers = ["-5", "12.50", " 7 "].map((v) =>
    validateSingleField({ type: "Number", length: 18, label: "Amount" }, v),
  );
  recordTest(
    "4.12 Accepts only plain decimal numbers (rejects Infinity, hex, exponent)",
    { junk: ["Infinity", "0x10", "1e3"], plain: ["-5", "12.50", " 7 "] },
    { junkNumbers, plainNumbers },
    junkNumbers.every((e) => e === "Amount must be a valid number") &&
      plainNumbers.every((e) => e === null),
  );

  const impossibleDate = validateSingleField({ type: "Date", label: "Value Date" }, "2026-02-30");
  const leapDate = validateSingleField({ type: "Date", label: "Value Date" }, "2028-02-29");
  recordTest(
    "4.13 Rejects impossible calendar dates that Date.parse rolls over",
    { impossible: "2026-02-30", leap: "2028-02-29" },
    { impossibleDate, leapDate },
    impossibleDate === "Value Date must be a valid date" && leapDate === null,
  );

  const isoOnly = ["20250101", "01/05/2026", "Jan 5 2026"].map((v) =>
    validateSingleField({ type: "Date", label: "Open Date" }, v),
  );
  const isoDateTime = validateSingleField(
    { type: "DateTime", label: "At" },
    "2026-01-01T10:00:00+06:00",
  );
  const noOffset = validateSingleField({ type: "DateTime", label: "At" }, "2026-01-01T10:00:00");
  const padded = validateSingleField(
    { type: "String", label: "Swift Code", length: 11, validation: { matches: "^[A-Z]{11}$" } },
    "JANBBDDHIMA ",
  );
  const tooLong = validateSingleField(
    { type: "String", label: "Swift Code", length: 11 },
    "JANBBDDHIMAX",
  );
  recordTest(
    "4.14 Dates are ISO only (YYYYMMDD, slashes, words, offset-less date-times rejected); padding ignored",
    {
      nonIso: ["20250101", "01/05/2026", "Jan 5 2026"],
      padded: "JANBBDDHIMA ",
      tooLong: "JANBBDDHIMAX",
    },
    { isoOnly, isoDateTime, noOffset, padded, tooLong },
    isoOnly.every((e) => e === "Open Date must be a valid date") &&
      isoDateTime === null &&
      noOffset === "At must be a valid date and time" &&
      padded === null &&
      tooLong === "Swift Code cannot exceed 11 characters",
  );

  const loadedSpec = {
    title: "T",
    frmElements: {
      sections: [
        {
          id: "s",
          containerType: "card" as const,
          fields: [
            {
              SN: "1",
              NAME: "openDate",
              TYPE: "Date" as const,
              STRUCTURE: "S" as const,
              LENGTH: 10,
            },
            {
              SN: "2",
              NAME: "postedAt",
              TYPE: "DateTime" as const,
              STRUCTURE: "S" as const,
              LENGTH: 19,
            },
            { SN: "3", NAME: "refNo", TYPE: "String" as const, STRUCTURE: "S" as const, LENGTH: 8 },
            {
              SN: "4",
              NAME: "rows",
              TYPE: "Array" as const,
              STRUCTURE: "M" as const,
              LENGTH: 0,
              PROP: [
                {
                  SN: "1",
                  NAME: "valueDate",
                  TYPE: "Date" as const,
                  STRUCTURE: "S" as const,
                  LENGTH: 10,
                },
              ],
            },
          ],
        },
      ],
    },
  };
  const loaded = normalizeRecordDates(loadedSpec, {
    openDate: "2025-01-01",
    postedAt: "2026-10-27T11:22:52+06:00",
    refNo: "20250101",
    rows: [{ valueDate: "2025-01-02" }],
  });
  recordTest(
    "4.15 A loaded record's Date / DateTime fields (nested rows too) preserve ISO; other fields untouched",
    { openDate: "2025-01-01", postedAt: "2026-10-27T11:22:52+06:00", refNo: "20250101" },
    loaded,
    loaded.openDate === "2025-01-01" &&
      loaded.postedAt === "2026-10-27T11:22:52+06:00" &&
      loaded.refNo === "20250101" &&
      (loaded.rows as Array<{ valueDate: string }>)[0].valueDate === "2025-01-02",
  );

  const repeatingSection = [
    {
      id: "sec_rows",
      containerType: "card" as const,
      fields: [
        {
          SN: "1",
          NAME: "nominees",
          TYPE: "Array" as const,
          STRUCTURE: "M" as const,
          LENGTH: 0,
          PROP: [
            {
              SN: "1_1",
              NAME: "nomineeName",
              LABEL: "Nominee Name",
              TYPE: "String" as const,
              STRUCTURE: "S" as const,
              LENGTH: 100,
              REQUIRED: true,
            },
          ],
        },
      ],
    },
  ];
  const noRowErrors = validateValues(repeatingSection, {});
  const emptyRowErrors = validateValues(repeatingSection, { nominees: [{ nomineeName: "A" }, {}] });
  const filledRowErrors = validateValues(repeatingSection, { nominees: [{ nomineeName: "A" }] });
  recordTest(
    "4.16 An optional repeating set with no rows has no inner errors; each started row is checked",
    { none: {}, secondRowEmpty: [{ nomineeName: "A" }, {}], filled: [{ nomineeName: "A" }] },
    { noRowErrors, emptyRowErrors, filledRowErrors },
    Object.keys(noRowErrors).length === 0 &&
      emptyRowErrors["nominees.1.nomineeName"] === "Nominee Name is required" &&
      Object.keys(emptyRowErrors).length === 1 &&
      Object.keys(filledRowErrors).length === 0,
  );

  // ── 5. Reactive Field Condition Evaluation (evaluateFieldCondition) ──
  console.log("\n── 5. Reactive Field Condition Evaluation (evaluateFieldCondition) ──");

  const condEqPass = evaluateFieldCondition(
    { field: "TYPE", operator: "eq", value: "Boolean" },
    { TYPE: "Boolean" },
  );
  recordTest(
    "5.1 Matches single field equality ('eq') correctly",
    { condition: { field: "TYPE", operator: "eq", value: "Boolean" }, values: { TYPE: "Boolean" } },
    { result: condEqPass },
    condEqPass === true,
  );

  const condInPass = evaluateFieldCondition(
    { field: "TYPE", operator: "in", value: ["Array", "Object", "Date", "Boolean"] },
    { TYPE: "Array" },
  );
  const condInFail = evaluateFieldCondition(
    { field: "TYPE", operator: "in", value: ["Array", "Object", "Date", "Boolean"] },
    { TYPE: "String" },
  );
  recordTest(
    "5.2 Matches single field inclusion ('in') and non-inclusion correctly",
    { targetIn: "Array", targetNotIn: "String" },
    { inMatches: condInPass, notInFails: !condInFail },
    condInPass === true && condInFail === false,
  );

  const condCompoundPass = evaluateFieldCondition(
    {
      and: [
        { field: "TYPE", operator: "eq", value: "Number" },
        { field: "balance", operator: "gt", value: 1000 },
      ],
    },
    { TYPE: "Number", balance: 5000 },
  );
  recordTest(
    "5.3 Evaluates compound 'and' condition accurately",
    { TYPE: "Number", balance: 5000 },
    { result: condCompoundPass },
    condCompoundPass === true,
  );

  const condHiddenPass = evaluateFieldCondition(
    { field: "USERDEFINEID", operator: "truthy" },
    { USERDEFINEID: true },
  );
  recordTest(
    "5.4 Evaluates truthy condition accurately",
    { USERDEFINEID: true },
    { result: condHiddenPass },
    condHiddenPass === true,
  );

  // ── 6. Declarative Field Value Transforms & Cascades (applyFieldTransform & evaluateFieldCascade) ──
  console.log("\n── 6. Declarative Field Value Transforms & Cascades ──");

  const transformedStrip = applyFieldTransform("stripWhitespace", "  account Number 123  ");
  recordTest(
    "6.1 Strips all whitespace with 'stripWhitespace' transform",
    "  account Number 123  ",
    transformedStrip,
    transformedStrip === "accountNumber123",
  );

  const transformedUpper = applyFieldTransform("uppercase", "test_column");
  recordTest(
    "6.2 Converts string to uppercase with 'uppercase' transform",
    "test_column",
    transformedUpper,
    transformedUpper === "TEST_COLUMN",
  );

  const cascadeRules = [
    { when: "Date", set: { LENGTH: 10, PROP: undefined } },
    { when: "Boolean", set: { LENGTH: 1, STRUCTURE: "S" } },
    { when: ["Array", "Object"], set: { LENGTH: 0, PROP: [] } },
  ];

  const cascadeBoolean = evaluateFieldCascade(cascadeRules, "Boolean");
  recordTest(
    "6.3 Evaluates single value cascade correctly",
    { targetType: "Boolean" },
    cascadeBoolean,
    cascadeBoolean?.LENGTH === 1 && cascadeBoolean?.STRUCTURE === "S",
  );

  const cascadeJson = evaluateFieldCascade(cascadeRules, "Array");
  recordTest(
    "6.4 Evaluates multi-match array cascade correctly",
    { targetType: "Array" },
    cascadeJson,
    cascadeJson?.LENGTH === 0 && Array.isArray(cascadeJson?.PROP),
  );

  // ── 7. Render Block Clustering & Layout Navigation ──
  console.log("\n── 7. Render Block Clustering & Layout Navigation ──");

  const layoutSections = [
    { id: "sec_card1", containerType: "card" as const, fields: [] },
    { id: "sec_tab1", containerType: "tab" as const, groupId: "grp_tabs", fields: [] },
    { id: "sec_tab2", containerType: "tab" as const, groupId: "grp_tabs", fields: [] },
    { id: "sec_card2", containerType: "card" as const, fields: [] },
  ];
  const clusteredBlocks = buildRenderBlocks(layoutSections);
  recordTest(
    "7.1 Clusters contiguous tabs into tab-group block and keeps cards separate",
    { totalSections: layoutSections.length },
    { totalBlocks: clusteredBlocks.length, blockTypes: clusteredBlocks.map((b) => b.type) },
    clusteredBlocks.length === 3 &&
      clusteredBlocks[0]?.type === "single" &&
      clusteredBlocks[1]?.type === "tab-group" &&
      clusteredBlocks[1]?.tabSections.length === 2 &&
      clusteredBlocks[2]?.type === "single",
  );

  const gapIdx = getBlockGapSectionIndex(clusteredBlocks, layoutSections, 2);
  recordTest(
    "7.2 Resolves raw section insertion index from block gap correctly",
    { targetBlockGap: 2 },
    { sectionIndex: gapIdx },
    gapIdx === 3,
  );

  // ── 8. Layout Grid & Input Width Classes ──
  console.log("\n── 8. Layout Grid & Input Width Classes ──");

  const inputWidthSwitch = getInputWidthClass(undefined, undefined, "Boolean", "switch");
  const inputWidthTime = getInputWidthClass(undefined, undefined, "Time", "time");
  const inputWidthTextMd = getInputWidthClass("md", 35, "String", "text");
  recordTest(
    "8.1 Resolves specialized input widths for boolean, time, and standard semantic tokens",
    { switch: "switch", time: "time", textMd: "md" },
    { switchWidth: inputWidthSwitch, timeWidth: inputWidthTime, textWidth: inputWidthTextMd },
    inputWidthSwitch === "w-auto" &&
      inputWidthTime === "w-full sm:max-w-36" &&
      inputWidthTextMd === "w-full sm:max-w-72",
  );

  const gridCols12 = getGridColsClass(12);
  const gridCols2 = getGridColsClass(2);
  recordTest(
    "8.2 Maps grid column configuration to responsive grid CSS classes",
    { cols12: 12, cols2: 2 },
    { css12: gridCols12, css2: gridCols2 },
    gridCols12 === "grid-cols-12" && gridCols2 === "grid-cols-1 md:grid-cols-2",
  );

  const colSpanSingle = getFieldColSpanClass(1, "md", 35, "String");
  const colSpan12Md = getFieldColSpanClass(12, "md", 35, "String");
  recordTest(
    "8.3 Computes field cell column spans across single-col and 12-col grids",
    { cols1: 1, cols12: 12 },
    { span1: colSpanSingle, span12: colSpan12Md },
    colSpanSingle === "w-full col-span-1" && colSpan12Md === "col-span-12 md:col-span-4",
  );

  // ── 9. Path Utilities (getFieldValue, setFieldValue, deleteFieldValue) ──
  console.log("\n── 9. Path Utilities (getFieldValue, setFieldValue, deleteFieldValue) ──");

  const initialRecord = {
    accountNumber: "AC1001",
    CUSTOMER: {
      profile: {
        name: "Jane Doe",
      },
      tags: ["vip", "retail"],
    },
    "FLAT.KEY": "DirectValue",
  };

  const directHit = getFieldValue(initialRecord, "FLAT.KEY");
  const nestedHit = getFieldValue(initialRecord, "CUSTOMER.profile.name");
  const missingHit = getFieldValue(initialRecord, "CUSTOMER.profile.missing");
  recordTest(
    "9.1 Safely reads direct flattened keys and deeply nested dot-paths",
    { directPath: "FLAT.KEY", nestedPath: "CUSTOMER.profile.name" },
    { directHit, nestedHit, missingHit },
    directHit === "DirectValue" && nestedHit === "Jane Doe" && missingHit === undefined,
  );

  const updatedRecord = setFieldValue(initialRecord, "CUSTOMER.profile.name", "John Smith");
  const addedArrayElem = setFieldValue(updatedRecord, "CUSTOMER.tags.2", "priority");
  recordTest(
    "9.2 Immutably sets nested object and array values without mutating source record",
    { updatedPath: "CUSTOMER.profile.name", addedPath: "CUSTOMER.tags.2" },
    {
      originalName: initialRecord.CUSTOMER.profile.name,
      updatedName: updatedRecord.CUSTOMER.profile.name,
      newTag: addedArrayElem.CUSTOMER.tags[2],
    },
    initialRecord.CUSTOMER.profile.name === "Jane Doe" &&
      updatedRecord.CUSTOMER.profile.name === "John Smith" &&
      addedArrayElem.CUSTOMER.tags[2] === "priority",
  );

  const deletedRecord = deleteFieldValue(addedArrayElem, "CUSTOMER.profile.name");
  recordTest(
    "9.3 Immutably deletes nested keys without mutating source record",
    { deletePath: "CUSTOMER.profile.name" },
    {
      deletedResult: getFieldValue(deletedRecord, "CUSTOMER.profile.name"),
      priorResult: getFieldValue(addedArrayElem, "CUSTOMER.profile.name"),
    },
    getFieldValue(deletedRecord, "CUSTOMER.profile.name") === undefined &&
      getFieldValue(addedArrayElem, "CUSTOMER.profile.name") === "John Smith",
  );

  // ── 10. Designer Settings Honoured by the Engine (FORM.CONFIG 1:1) ──
  console.log("\n── 10. Designer Settings Honoured by the Engine ──");

  const dec = {
    ok: validateSingleField({ type: "Number", label: "Amt", decimals: 2 }, "10.25"),
    tooMany: validateSingleField({ type: "Number", label: "Amt", decimals: 2 }, "10.255"),
    whole: validateSingleField({ type: "Number", label: "Qty", decimals: 0 }, "3.5"),
  };
  recordTest(
    "10.1 Enforces NUMBER_CONFIG / RATE_CONFIG decimal places",
    { decimals: [2, 2, 0], values: ["10.25", "10.255", "3.5"] },
    dec,
    dec.ok === null &&
      dec.tooMany === "Amt allows at most 2 decimal places" &&
      dec.whole === "Qty must be a whole number",
  );

  const range = resolveFieldDateRange({
    NAME: "valueDate",
    TYPE: "Date",
    DATE_CONFIG: { minDateOffset: -2, maxDateOffset: 0 },
  } as never);
  const dateRule = {
    range,
    before: validateSingleField(
      { type: "Date", label: "Value Date", dateRange: range },
      offsetIsoDate(-3),
    ),
    inside: validateSingleField(
      { type: "Date", label: "Value Date", dateRange: range },
      offsetIsoDate(-1),
    ),
    dateTimeAfter: validateSingleField(
      { type: "DateTime", label: "At", dateRange: range },
      `${offsetIsoDate(1)}T09:00:00+06:00`,
    ),
  };
  recordTest(
    "10.2 Turns DATE_CONFIG day offsets into an ISO range and validates the calendar day",
    { minDateOffset: -2, maxDateOffset: 0 },
    dateRule,
    range.min === offsetIsoDate(-2) &&
      range.max === todayIso() &&
      dateRule.before === `Value Date cannot be before ${offsetIsoDate(-2)}` &&
      dateRule.inside === null &&
      dateRule.dateTimeAfter === `At cannot be after ${todayIso()}`,
  );

  const onChange = {
    copy: evaluateOnChangeRule("copy", "ABC"),
    clear: evaluateOnChangeRule("clear", "ABC"),
    join: evaluateOnChangeRule("join", ["A", "", "B"], "-"),
  };
  recordTest(
    "10.3 ON_CHANGE copies, clears and joins into the target",
    { value: "ABC", list: ["A", "", "B"] },
    onChange,
    onChange.copy === "ABC" && onChange.clear === "" && onChange.join === "A-B",
  );

  const lists = {
    inComma: evaluateFieldCondition(
      { field: "type", operator: "in", value: "SAV, CUR" },
      { type: "CUR" },
    ),
    notInComma: evaluateFieldCondition(
      { field: "type", operator: "notIn", value: "SAV,CUR" },
      { type: "FD" },
    ),
    inArray: evaluateFieldCondition(
      { field: "type", operator: "in", value: ["SAV"] },
      { type: "CUR" },
    ),
  };
  recordTest(
    "10.4 in / notIn accept the designer's comma-separated list or an array",
    { inComma: "SAV, CUR", notInComma: "SAV,CUR", inArray: ["SAV"] },
    lists,
    lists.inComma === true && lists.notInComma === true && lists.inArray === false,
  );

  const merged = evaluateFieldCascade(
    [
      { when: "SAV", set: { rate: 3.5 } },
      { when: ["SAV", "FD"], set: { term: 12 } },
      { when: "CUR", set: { rate: 0 } },
    ],
    "SAV",
  );
  recordTest(
    "10.5 CASCADE applies every matching rule (one designer row each)",
    { value: "SAV" },
    merged,
    merged?.rate === 3.5 && merged?.term === 12 && Object.keys(merged ?? {}).length === 2,
  );

  const yn = { trueValue: "Y", falseValue: "N" };
  const bool = {
    onY: isBooleanOn("Y", yn),
    onN: isBooleanOn("N", yn),
    plainN: isBooleanOn("N"),
    wireOn: toBooleanValue(true, yn),
    wireOff: toBooleanValue(false, yn),
    plainOn: toBooleanValue(true),
  };
  recordTest(
    "10.6 BOOLEAN_CONFIG wire values are read and written (else true / false)",
    { config: yn },
    bool,
    bool.onY &&
      !bool.onN &&
      !bool.plainN &&
      bool.wireOn === "Y" &&
      bool.wireOff === "N" &&
      bool.plainOn === true,
  );

  recordTest(
    "10.7 TRANSFORM trim waits for blur; case and no-spaces apply as typed",
    { transforms: ["trim", "uppercase", "stripWhitespace", "none"] },
    {
      trim: isLiveTransform("trim"),
      uppercase: isLiveTransform("uppercase"),
      stripWhitespace: isLiveTransform("stripWhitespace"),
      none: isLiveTransform("none"),
    },
    !isLiveTransform("trim") &&
      isLiveTransform("uppercase") &&
      isLiveTransform("stripWhitespace") &&
      !isLiveTransform("none"),
  );

  const stackedSpec = compileFormSpec(testModel, {
    title: "Stacked",
    frmElements: {
      layout: "stacked",
      sections: [{ id: "sec_s", containerType: "card", fields: [] }],
    },
  } as FormConfigRecord);
  recordTest(
    "10.8 Compiled form keeps the designer's root layout (horizontal / stacked)",
    { layout: "stacked" },
    { layout: stackedSpec.frmElements.layout },
    stackedSpec.frmElements.layout === "stacked",
  );

  const fieldErrors = validateValues(
    [
      {
        id: "sec_v",
        containerType: "card",
        fields: [
          {
            SN: "1",
            NAME: "amt",
            TYPE: "Number",
            STRUCTURE: "S",
            LENGTH: 15,
            NUMBER_CONFIG: { decimals: 2 },
          },
          {
            SN: "2",
            NAME: "due",
            TYPE: "Date",
            STRUCTURE: "S",
            LENGTH: 10,
            DATE_CONFIG: { maxDateOffset: 0 },
          },
        ],
      },
    ],
    { amt: "1.234", due: offsetIsoDate(1) },
  );
  recordTest(
    "10.9 validateValues applies a field's decimals and date range from its settings",
    { amt: "1.234", due: "tomorrow" },
    fieldErrors,
    Boolean(fieldErrors.amt) && Boolean(fieldErrors.due),
  );

  // ── 11. Object Groups: Inner Fields (engine lookup + designer tree) ──
  console.log("\n── 11. Object Groups: Inner Fields ──");

  const groupSections = [
    {
      id: "sec_g",
      containerType: "card" as const,
      fields: [
        { SN: "1", NAME: "code", TYPE: "String" as const, STRUCTURE: "S" as const, LENGTH: 5 },
        {
          SN: "5",
          NAME: "addr",
          TYPE: "Array" as const,
          STRUCTURE: "S" as const,
          LENGTH: 0,
          PROP: [
            {
              SN: "5_1",
              NAME: "code",
              TYPE: "String" as const,
              STRUCTURE: "S" as const,
              LENGTH: 5,
            },
            {
              SN: "5_2",
              NAME: "city",
              TYPE: "String" as const,
              STRUCTURE: "S" as const,
              LENGTH: 30,
              TRANSFORM: "uppercase" as const,
            },
          ],
        },
      ],
    },
  ];

  const specs = {
    top: findFieldSpecByKey(groupSections, "code")?.SN,
    single: findFieldSpecByKey(groupSections, "addr.city")?.TRANSFORM,
    repeatingRow: findFieldSpecByKey(groupSections, "addr.0.city")?.SN,
    missing: findFieldSpecByKey(groupSections, "addr.nope"),
  };
  recordTest(
    "11.1 findFieldSpecByKey resolves top-level, inner and repeating-row keys (so inner TRANSFORM / CASCADE / ON_CHANGE run)",
    { keys: ["code", "addr.city", "addr.0.city", "addr.nope"] },
    specs,
    specs.top === "1" &&
      specs.single === "uppercase" &&
      specs.repeatingRow === "5_2" &&
      specs.missing === undefined,
  );

  const located = findFieldDeep(groupSections, "5_2");
  recordTest(
    "11.2 Designer finds an inner field by SN, with its group; a bare NAME still means the top-level field",
    { ids: ["5_2", "code"] },
    {
      inner: located?.field.NAME,
      parent: located?.parent?.NAME,
      path: located?.path,
      byName: findFieldDeep(groupSections, "code")?.field.SN,
    },
    located?.field.NAME === "city" &&
      located?.parent?.NAME === "addr" &&
      JSON.stringify(located?.path) === "[1,1]" &&
      findFieldDeep(groupSections, "code")?.field.SN === "1",
  );

  const relabelled = updateFieldDeep(groupSections, "5_2", (f) => ({ ...f, LABEL: "Town" }));
  const pruned = updateFieldDeep(groupSections, "5_1", () => null);
  recordTest(
    "11.3 Designer updates and removes inner fields immutably, leaving other fields untouched",
    { update: "5_2 → LABEL Town", remove: "5_1" },
    {
      innerLabel: relabelled[0].fields[1].PROP?.[1].LABEL,
      topLabel: relabelled[0].fields[0].LABEL,
      innerAfterRemove: pruned[0].fields[1].PROP?.map((f) => f.NAME),
      sourceUnchanged: groupSections[0].fields[1].PROP?.length,
    },
    relabelled[0].fields[1].PROP?.[1].LABEL === "Town" &&
      relabelled[0].fields[0].LABEL === undefined &&
      JSON.stringify(pruned[0].fields[1].PROP?.map((f) => f.NAME)) === '["city"]' &&
      groupSections[0].fields[1].PROP?.length === 2,
  );

  const innerModelProp = findModelPropDeep(
    [
      { SN: "1", NAME: "city", TYPE: "String", STRUCTURE: "S", LENGTH: 10 },
      {
        SN: "5",
        NAME: "addr",
        TYPE: "Array",
        STRUCTURE: "S",
        LENGTH: 0,
        PROP: [{ SN: "5_2", NAME: "city", TYPE: "String", STRUCTURE: "S", LENGTH: 30 }],
      },
    ] as ModelConfigRecord["PROPERTIES"],
    { SN: "5_2", NAME: "city" },
  );
  recordTest(
    "11.4 Inspector matches an inner field to its own model property (by SN, not a same-named top-level one)",
    { field: { SN: "5_2", NAME: "city" } },
    { matchedSn: innerModelProp?.SN, length: innerModelProp?.LENGTH },
    innerModelProp?.SN === "5_2" && innerModelProp?.LENGTH === 30,
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

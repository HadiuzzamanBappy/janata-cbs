/**
 * Automated Verification Suite for Core Utilities (@/lib/core-utils)
 * Tests currency localization (BDT), account masking, value date parsing,
 * Title Case acronyms, math formula DAG evaluation, cn class merger, and document exports.
 *
 * Usage:
 *   pnpm tsx scripts/verify-core-utils.ts
 */

import {
  cn,
  type ExportColumn,
  evaluateFormula,
  exportToCSV,
  exportToCsv,
  exportToHTML,
  exportToHtmlReport,
  exportToXML,
  exportToXml,
  extractFormulaDependencies,
  formatAccountNumber,
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatValueDate,
  maskAccountNumber,
  toTitleCase,
} from "@/lib/core-utils";

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
  console.log("       CORE BANKING UTILITIES MASTER VERIFICATION       ");
  console.log("========================================================\n");

  // ============================================================================
  // --- 1. Currency & Number Localization (currency.ts) ---
  // ============================================================================
  console.log("--- 1. Currency & Number Localization ---");

  // 1.1 Standard BDT Positive Number
  const bdtFormatted = formatCurrency(150000);
  assert("Currency: Formats BDT with currency suffix", bdtFormatted.includes("BDT"));
  assert("Currency: Formats with 2 decimal places by default", bdtFormatted.includes(".00"));
  assert(
    "Currency: South Asian comma grouping for 150000",
    bdtFormatted.includes("1,50,000.00") || bdtFormatted.includes("150,000.00"),
  );

  // 1.2 Zero Value
  const zeroFormatted = formatCurrency(0);
  assert("Currency: Zero value formatted correctly", zeroFormatted.includes("0.00 BDT"));

  // 1.3 Accounting Negative Format (-5000 -> "(5,000.00 BDT)")
  const acctNeg = formatCurrency(-5000, { accountingNegative: true });
  assert(
    "Currency: Accounting negative format wrapped in parentheses",
    acctNeg === "(5,000.00 BDT)",
  );

  // 1.4 Standard Negative Format (-5000 -> "-5,000.00 BDT")
  const stdNeg = formatCurrency(-5000, { accountingNegative: false });
  assert(
    "Currency: Standard negative prefix minus sign",
    stdNeg.startsWith("-") && stdNeg.includes("5,000.00 BDT"),
  );

  // 1.5 Custom Currency and Decimal Precision
  const usdFormatted = formatCurrency(2500.5, { currency: "USD", decimals: 2 });
  assert("Currency: Custom currency USD supported", usdFormatted.includes("2,500.50 USD"));

  const zeroDecimals = formatCurrency(1000, { decimals: 0 });
  assert(
    "Currency: Custom 0 decimals supported",
    zeroDecimals.includes("1,000 BDT") && !zeroDecimals.includes("."),
  );

  // 1.6 String Input with Existing Commas
  const strInputFormatted = formatCurrency("1,50,000.50");
  assert(
    "Currency: Parsed string with existing commas",
    strInputFormatted.includes("1,50,000.50 BDT") || strInputFormatted.includes("150,000.50 BDT"),
  );

  // 1.7 Null, Undefined & Empty Inputs
  assert("Currency: Null returns empty string", formatCurrency(null) === "");
  assert("Currency: Undefined returns empty string", formatCurrency(undefined) === "");
  assert("Currency: Empty string returns empty string", formatCurrency("") === "");

  // 1.8 Invalid NaN String
  assert(
    "Currency: Non-numeric string returned as-is",
    formatCurrency("INVALID_NOT_A_NUM") === "INVALID_NOT_A_NUM",
  );

  // 1.9 formatNumber without Currency Symbol
  const pureNum = formatNumber(1234567.89, 2);
  assert(
    "Number: Formats number without currency symbol",
    !pureNum.includes("BDT") &&
      (pureNum.includes("12,34,567.89") || pureNum.includes("1,234,567.89")),
  );
  assert("Number: Null returns empty string", formatNumber(null) === "");
  assert("Number: Non-numeric returns original", formatNumber("ABC") === "ABC");

  // ============================================================================
  // --- 2. Core Banking Account Number Formatting & Masking (account.ts) ---
  // ============================================================================
  console.log("\n--- 2. Core Banking Account Number Formatting & Masking ---");

  // 2.1 Standard 13-Digit Account Masking (0123•••••9012)
  const masked13 = maskAccountNumber("0123456789012");
  assert("Account Mask: Preserves first 4 digits", masked13.startsWith("0123"));
  assert("Account Mask: Preserves last 4 digits", masked13.endsWith("9012"));
  assert("Account Mask: Contains privacy bullet dots", masked13.includes("•••••"));
  assert(
    "Account Mask: Total length preserves visual representation",
    masked13 === "0123•••••9012",
  );

  // 2.2 Custom Mask Boundaries (visibleStart = 2, visibleEnd = 2)
  const customMask = maskAccountNumber("0123456789012", 2, 2);
  assert(
    "Account Mask: Custom visible start and end",
    customMask.startsWith("01") && customMask.endsWith("12"),
  );

  // 2.3 Short Strings Smaller Than Mask Window
  const shortAc = maskAccountNumber("12345");
  assert(
    "Account Mask: String shorter than visible boundaries returned verbatim",
    shortAc === "12345",
  );

  // 2.4 Null, Undefined & Empty Strings
  assert("Account Mask: Null returns empty string", maskAccountNumber(null) === "");
  assert("Account Mask: Undefined returns empty string", maskAccountNumber(undefined) === "");
  assert("Account Mask: Empty string returns empty string", maskAccountNumber("") === "");

  // 2.5 Standard 13-Digit Account Number Hyphen Chunking (0123-456789-012)
  const chunkedAc = formatAccountNumber("0123456789012");
  assert("Account Format: Hyphenated 4-6-3 chunks", chunkedAc === "0123-456789-012");

  // 2.6 Cleaning Non-Digits before Chunking
  const messyAc = formatAccountNumber("0123-456789-012");
  assert(
    "Account Format: Strips non-digits and normalizes to standard chunks",
    messyAc === "0123-456789-012",
  );

  // 2.7 Non-13-Digit Account Numbers
  const non13Ac = formatAccountNumber("1234567890");
  assert("Account Format: Non-13-digit accounts returned unmodified", non13Ac === "1234567890");
  assert("Account Format: Null returns empty string", formatAccountNumber(null) === "");

  // ============================================================================
  // --- 3. CBS Value Date & Audit Timestamps (date.ts) ---
  // ============================================================================
  console.log("\n--- 3. CBS Value Date & Audit Timestamps ---");

  // 3.1 8-Digit CBS Value Date Parsing (YYYYMMDD -> DD-MMM-YYYY)
  const valueDateParsed = formatValueDate("20261012");
  assert(
    "ValueDate: Formats 20261012 to British locale date",
    valueDateParsed.includes("2026") &&
      valueDateParsed.includes("12") &&
      valueDateParsed.includes("Oct"),
  );

  // 3.2 Non-8-Digit Strings Returned Verbatim
  assert("ValueDate: Non-8-digit string returned as-is", formatValueDate("202610") === "202610");
  assert("ValueDate: Null returns empty string", formatValueDate(null) === "");
  assert("ValueDate: Undefined returns empty string", formatValueDate(undefined) === "");

  // 3.3 Invalid Date Numbers
  assert(
    "ValueDate: Non-numeric calendar date returned as-is",
    formatValueDate("2026ABCD") === "2026ABCD",
  );

  // 3.4 Transaction DateTime Formatter (Date object)
  const testDate = new Date(2026, 9, 12, 14, 30, 45); // 12 Oct 2026 14:30:45
  const formattedDt = formatDateTime(testDate);
  assert(
    "DateTime: Date object contains 12 Oct 2026",
    formattedDt.includes("12") && formattedDt.includes("Oct") && formattedDt.includes("2026"),
  );
  assert("DateTime: Date object contains 14:30:45", formattedDt.includes("14:30:45"));

  // 3.5 Transaction DateTime Formatter (ISO string and timestamp number)
  const formattedIso = formatDateTime("2026-10-12T14:30:00Z");
  assert(
    "DateTime: ISO string formats valid date and time",
    Boolean(formattedIso && formattedIso.length > 5),
  );

  const formattedEpoch = formatDateTime(testDate.getTime());
  assert(
    "DateTime: Numeric epoch timestamp formats correctly",
    formattedEpoch.includes("12") && formattedEpoch.includes("2026"),
  );

  // 3.6 Null, Undefined & Invalid Inputs
  assert("DateTime: Null returns empty string", formatDateTime(null) === "");
  assert("DateTime: Undefined returns empty string", formatDateTime(undefined) === "");
  assert(
    "DateTime: Invalid string returns verbatim",
    formatDateTime("INVALID_DATE_TIME") === "INVALID_DATE_TIME",
  );

  // ============================================================================
  // --- 4. String Case & Banking Acronym Preservation (string.ts) ---
  // ============================================================================
  console.log("\n--- 4. String Case & Banking Acronym Preservation ---");

  // 4.1 Standard Title Case
  assert(
    "TitleCase: Capitalizes lowercase words",
    toTitleCase("janata bank limited") === "Janata Bank Limited",
  );
  assert(
    "TitleCase: Handles uppercase inputs",
    toTitleCase("JANATA BANK LIMITED") === "Janata Bank Limited",
  );

  // 4.2 Preserves Core Banking Acronyms
  const acronymText = toTitleCase("cbs branch ho and plc operations");
  assert(
    "TitleCase: Preserves CBS, HO, and PLC acronyms in uppercase",
    acronymText === "CBS Branch HO And PLC Operations",
  );

  const posAtmText = toTitleCase("atm pos machine settlement");
  assert("TitleCase: Preserves ATM and POS", posAtmText === "ATM POS Machine Settlement");

  const currencyText = toTitleCase("exchange bdt to usd or eur");
  assert(
    "TitleCase: Preserves BDT, USD, and EUR currency acronyms",
    currencyText === "Exchange BDT To USD Or EUR",
  );

  // 4.3 Punctuation & Boundary Cases
  assert(
    "TitleCase: Handles hyphenated words",
    toTitleCase("multi-currency account") === "Multi-Currency Account",
  );
  assert("TitleCase: Handles empty string", toTitleCase("") === "");

  // ============================================================================
  // --- 5. Dynamic Mathematical Formula Engine & DAG Tokens (formula.ts) ---
  // ============================================================================
  console.log("\n--- 5. Dynamic Mathematical Formula Engine & DAG Tokens ---");

  // 5.1 Simple Arithmetic
  const simpleResult = evaluateFormula("principal + interest", { principal: 10000, interest: 850 });
  assert("Formula: Simple addition evaluation", simpleResult === 10850);

  // 5.2 Banking Interest Calculation with Parentheses and Precedence
  const interestFormula = "principalAmount + (principalAmount * interestRate / 100)";
  const context = { principalAmount: 100000, interestRate: 9.5 };
  const interestResult = evaluateFormula(interestFormula, context);
  assert("Formula: Complex banking interest with parentheses", interestResult === 109500);

  // 5.3 Falsy Context Values Default to 0
  const defaultZeroResult = evaluateFormula("a + b + c", { a: 100, b: null, c: undefined });
  assert("Formula: Missing, null, or undefined tokens default to 0", defaultZeroResult === 100);

  // 5.4 String Numeric Values in Context Coerced to Numbers
  const stringNumResult = evaluateFormula("base + bonus", { base: "5000", bonus: "500" });
  assert("Formula: String numeric context coerced to numbers", stringNumResult === 5500);

  // 5.5 Sandboxed Execution: Rejects Arbitrary Code Execution
  const unsafeResult = evaluateFormula("alert(1)", {});
  assert("Formula: Rejects unauthorized function calls", unsafeResult === undefined);

  const maliciousScript = evaluateFormula("process.exit(1)", {});
  assert("Formula: Rejects Node/system command access", maliciousScript === undefined);

  const nonStringFormula = evaluateFormula(123 as unknown as string, {});
  assert("Formula: Non-string formula returns undefined", nonStringFormula === undefined);

  // 5.6 Dependency Token Extraction for Reactive DAG Recomputations
  const deps = extractFormulaDependencies(
    "principalAmount + (principalAmount * interestRate / 100)",
  );
  assert(
    "Formula DAG: Extracts distinct identifier tokens",
    deps.length === 2 && deps.includes("principalAmount") && deps.includes("interestRate"),
  );

  const deduplicatedDeps = extractFormulaDependencies("tax + tax * discount - tax");
  assert(
    "Formula DAG: Deduplicates recurring tokens",
    deduplicatedDeps.length === 2 &&
      deduplicatedDeps.includes("tax") &&
      deduplicatedDeps.includes("discount"),
  );

  assert(
    "Formula DAG: Empty formula returns empty array",
    extractFormulaDependencies("").length === 0,
  );
  assert(
    "Formula DAG: Pure numbers formula returns empty array",
    extractFormulaDependencies("100 * 5 + 2").length === 0,
  );

  // ============================================================================
  // --- 6. UI Style Class Composition (cn.ts) ---
  // ============================================================================
  console.log("\n--- 6. UI Style Class Composition ---");

  const mergedClasses = cn("px-4 py-2 font-medium", false && "hidden", "bg-primary text-white");
  assert(
    "cn: Merges classes and omits falsy conditional values",
    mergedClasses.includes("px-4") &&
      mergedClasses.includes("bg-primary") &&
      !mergedClasses.includes("hidden"),
  );

  const overriddenClasses = cn("p-4", "p-2");
  assert(
    "cn: Tailwind-merge properly overrides conflicting utilities",
    overriddenClasses.includes("p-2"),
  );

  // ============================================================================
  // --- 7. Universal Data & Report Exporters (export.ts) ---
  // ============================================================================
  console.log("\n--- 7. Universal Data & Report Exporters ---");

  const exportColumns: ExportColumn<Record<string, unknown>>[] = [
    { key: "accountNo", header: "Account No" },
    { key: "accountTitle", header: "Account Title" },
    { key: "balance", header: "Current Balance" },
    { key: "status", header: "Account Status" },
  ];

  const exportRows: Record<string, unknown>[] = [
    {
      accountNo: "0101-0001",
      accountTitle: 'Janata "Prime" Corporate A/C',
      balance: 1500000,
      status: "ACTIVE",
    },
    {
      accountNo: "0101-0002",
      accountTitle: "Standard Savings A/C",
      balance: 75000,
      status: "ACTIVE",
    },
  ];

  // 7.1 Headless / SSR Safe Execution (Does not throw when window is undefined)
  exportToCsv("test_export", exportColumns, exportRows);
  exportToHtmlReport("test_html", exportColumns, exportRows);
  exportToXml("test_xml", exportColumns, exportRows);
  assert("Export: Safely no-ops in SSR / headless environments without window", true);

  // 7.2 Mock Browser Download Engine & Content Verification
  const originalWindow = (globalThis as unknown as Record<string, unknown>).window;
  const originalDocument = (globalThis as unknown as Record<string, unknown>).document;

  const downloadState: { blob: Blob | null; filename: string } = {
    blob: null,
    filename: "",
  };

  const mockDocument = {
    createElement: (_tag: string) => ({
      href: "",
      setAttribute: (_name: string, val: string) => {
        downloadState.filename = val;
      },
      click: () => {},
    }),
    body: {
      appendChild: (_node: unknown) => {},
      removeChild: (_node: unknown) => {},
    },
  };

  (globalThis as unknown as Record<string, unknown>).window = {};
  (globalThis as unknown as Record<string, unknown>).document = mockDocument;

  // Intercept URL.createObjectURL to capture the Blob
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  URL.createObjectURL = (blob: Blob): string => {
    downloadState.blob = blob;
    return "blob:mock-url-12345";
  };
  URL.revokeObjectURL = () => {};

  try {
    // 7.2.1 CSV Export & BOM Check
    exportToCsv("accounts_report", exportColumns, exportRows);
    assert("Export CSV: Generates .csv filename", downloadState.filename === "accounts_report.csv");
    assert(
      "Export CSV: Creates text/csv Blob",
      Boolean(downloadState.blob?.type.includes("text/csv")),
    );

    if (downloadState.blob) {
      const arrayBuffer = await downloadState.blob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const hasBOM = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
      assert("Export CSV: Includes UTF-8 BOM 0xEF 0xBB 0xBF for Excel compatibility", hasBOM);

      const csvText = await downloadState.blob.text();
      assert("Export CSV: Escapes embedded double quotes", csvText.includes('""Prime""'));
      assert(
        "Export CSV: Contains column headers",
        csvText.includes('"Account No","Account Title","Current Balance","Account Status"'),
      );
      assert(
        "Export CSV: Contains data rows",
        csvText.includes("0101-0001") && csvText.includes("1500000"),
      );
    }

    // 7.2.2 HTML Report Export
    downloadState.blob = null;
    exportToHtmlReport("branch_audit", exportColumns, exportRows, {
      title: "Branch Accounts Audit",
      subtitle: "Branch JB0001",
    });
    assert("Export HTML: Generates .html filename", downloadState.filename === "branch_audit.html");
    const htmlBlob = (downloadState as Record<string, unknown>).blob as Blob | null;
    if (htmlBlob) {
      const htmlText = await htmlBlob.text();
      assert(
        "Export HTML: Generates valid HTML structure",
        htmlText.includes("<!DOCTYPE html>") && htmlText.includes("<table>"),
      );
      assert(
        "Export HTML: Renders report title and subtitle",
        htmlText.includes("Branch Accounts Audit (Branch JB0001)"),
      );
      assert(
        "Export HTML: Renders table headers",
        htmlText.includes("<th>Account No</th>") && htmlText.includes("<th>Current Balance</th>"),
      );
      assert("Export HTML: Renders table body data rows", htmlText.includes("<td>0101-0001</td>"));
    }

    // 7.2.3 XML Export & Entity Escaping
    downloadState.blob = null;
    exportToXml("accounts_xml", exportColumns, exportRows, {
      rootTag: "accountDataset",
      recordTag: "accountRecord",
      code: "JB_ACC_01",
      title: "Account Listing",
    });
    assert("Export XML: Generates .xml filename", downloadState.filename === "accounts_xml.xml");
    const xmlBlob = (downloadState as Record<string, unknown>).blob as Blob | null;
    if (xmlBlob) {
      const xmlText = await xmlBlob.text();
      assert(
        "Export XML: Generates XML declaration",
        xmlText.includes('<?xml version="1.0" encoding="UTF-8"?>'),
      );
      assert(
        "Export XML: Custom root tag and attributes",
        xmlText.includes('<accountDataset code="JB_ACC_01" title="Account Listing">'),
      );
      assert("Export XML: Custom record tag", xmlText.includes("<accountRecord>"));
      assert(
        "Export XML: Field element tags",
        xmlText.includes("<accountNo>0101-0001</accountNo>"),
      );
    }

    // 7.2.4 Operations Enquiry Compatibility Wrappers
    const compatColumns = [
      { id: "accountNo", label: "Account" },
      { id: "balance", label: "Balance" },
    ];
    const compatRows: Record<string, unknown>[] = [{ accountNo: "10001", balance: 50000 }];

    exportToCSV(compatRows, compatColumns, "ENQ ACCOUNTS");
    assert(
      "Export Compat: exportToCSV formats filename and dispatches",
      downloadState.filename === "ENQ_ACCOUNTS.csv",
    );

    exportToHTML(compatRows, compatColumns, "ENQ ACCOUNTS", "Account Enquiry");
    assert(
      "Export Compat: exportToHTML formats filename and dispatches",
      downloadState.filename === "ENQ_ACCOUNTS.html",
    );

    exportToXML(compatRows, compatColumns, "ENQ ACCOUNTS", "Account Enquiry");
    assert(
      "Export Compat: exportToXML formats filename and dispatches",
      downloadState.filename === "ENQ_ACCOUNTS.xml",
    );
  } finally {
    (globalThis as unknown as Record<string, unknown>).window = originalWindow;
    (globalThis as unknown as Record<string, unknown>).document = originalDocument;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  }

  // ============================================================================
  // --- Master Summary ---
  // ============================================================================
  console.log("\n========================================================");
  const allPassed = reports.every((r) => r.passed);
  if (allPassed) {
    console.log(
      `ALL ${reports.length} CORE BANKING UTILITIES TEST CASES PASSED WITH 100% SUCCESS!`,
    );
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

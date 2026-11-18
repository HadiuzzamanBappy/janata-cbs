/**
 * Automated Verification Suite for CBS Core Utilities (@/lib/core-utils)
 *
 * Compact, Deterministic & Transparent: Tests a single focused example of EVERY
 * capability exposed by `@/lib/core-utils` with explicit Input and Output visualization:
 * 1. Tailwind Class Merger (cn: dedupes conflicting tailwind utilities)
 * 2. Currency Formatting (formatCurrency: BDT locale, decimals, accounting negative)
 * 3. Dates (ISO contract: boundary conversion of legacy core formats, strict checks, bank-time display)
 * 4. Title Case with Acronyms (toTitleCase: preserves HO, PLC, ATM, BDT)
 * 5. Ephemeral UI Client Token (generateClientToken: format and prefix check)
 * 6. Document Export Utilities (CSV, HTML, XML byte encoding and safety)
 * 7. Web Storage Gateway (cbsStorage: SSR-safe, JSON + schema validated, failure tolerant)
 *
 * Usage:
 *   pnpm tsx scripts/verify/verify-core-utils.ts
 */

import { z } from "zod";
import {
  cbsStorage,
  cn,
  exportToCsv,
  exportToHtmlReport,
  exportToXml,
  formatCurrency,
  formatDate,
  formatDateTime,
  generateClientToken,
  generateIdempotencyKey,
  isIsoDate,
  isIsoDateTime,
  isoDateTimeToLocalInput,
  normalizeAuditTimes,
  todayIso,
  toIsoDate,
  toIsoDateTime,
  toTitleCase,
} from "@/lib/core-utils";

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
  console.log("             CBS CORE UTILITIES & LOCALIZATION VERIFICATION                     ");
  console.log("================================================================================");
  console.log(" Architecture : Pure Standard Library (@/lib/core-utils)");
  console.log(" Pattern      : Single Unique Test per Utility Function with Visible IO");
  console.log("================================================================================");

  // ── 1. Tailwind Class Merger (cn) ──
  console.log("\n── 1. Tailwind Class Merger (cn) ──");
  const mergedClasses = cn("px-2 py-1 bg-red-500", "bg-primary text-white", false && "hidden");
  recordTest(
    "1.1 Merges conditional classes and resolves conflicting Tailwind utilities",
    { input: ["px-2 py-1 bg-red-500", "bg-primary text-white", false] },
    { mergedClasses },
    mergedClasses.includes("bg-primary") && !mergedClasses.includes("bg-red-500"),
  );

  // ── 2. Currency Formatting ──
  console.log("\n── 2. Currency Formatting (formatCurrency) ──");
  const bdtFormatted = formatCurrency(150000);
  recordTest(
    "2.1 Localizes numbers into BDT currency string with 2 decimals",
    { value: 150000 },
    { bdtFormatted },
    bdtFormatted.includes("BDT") && bdtFormatted.includes(".00"),
  );

  const accountingNegative = formatCurrency(-5000, { accountingNegative: true });
  recordTest(
    "2.2 Formats negative values in accounting parenthetical format",
    { value: -5000, accountingNegative: true },
    { accountingNegative },
    accountingNegative === "(5,000.00 BDT)",
  );

  // ── 3. Dates: ISO inside the system, legacy core formats converted at the boundary ──
  console.log("\n── 3. Dates (ISO contract, boundary conversion, bank-time display) ──");
  const inbound = {
    compactDate: toIsoDate("20250101"),
    isoDate: toIsoDate("2025-01-01"),
    dateTimeInDateField: toIsoDate("2025-01-01T23:30:00Z"),
    spacedDateTime: toIsoDateTime("2026-10-27 11:22:52"),
    localDateTime: toIsoDateTime("2026-10-27T11:22"),
    isoDateTime: toIsoDateTime("2026-10-27T05:22:52Z"),
    notADate: toIsoDate("12345"),
  };
  recordTest(
    "3.1 Inbound dates become ISO (legacy YYYYMMDD and spaced date-times included); other text untouched",
    { compact: "20250101", spaced: "2026-10-27 11:22:52", local: "2026-10-27T11:22" },
    inbound,
    inbound.compactDate === "2025-01-01" &&
      inbound.isoDate === "2025-01-01" &&
      inbound.dateTimeInDateField === "2025-01-02" &&
      inbound.spacedDateTime === "2026-10-27T11:22:52+06:00" &&
      inbound.localDateTime === "2026-10-27T11:22:00+06:00" &&
      inbound.isoDateTime === "2026-10-27T05:22:52Z" &&
      inbound.notADate === "12345",
  );

  const checks = {
    isoDate: isIsoDate("2025-01-01"),
    impossibleDay: isIsoDate("2026-02-30"),
    compactIsNotIso: isIsoDate("20250101"),
    offsetDateTime: isIsoDateTime("2026-10-27T11:22:52+06:00"),
    noOffset: isIsoDateTime("2026-10-27T11:22:52"),
  };
  recordTest(
    "3.2 isIsoDate / isIsoDateTime: strict ISO, real calendar days, date-times need an offset",
    { checks: Object.keys(checks) },
    checks,
    checks.isoDate &&
      !checks.impossibleDay &&
      !checks.compactIsNotIso &&
      checks.offsetDateTime &&
      !checks.noOffset,
  );

  const audit = normalizeAuditTimes({
    records: [
      { recordId: "A1", auditData: { recInputTime: "2026-10-27 11:22:52", recAuthTime: "" } },
    ],
  });
  const display = {
    date: formatDate("2025-01-01"),
    dateTime: formatDateTime("2026-10-27T05:22:52Z"),
    localInput: isoDateTimeToLocalInput("2026-10-27T05:22:52Z"),
    today: todayIso(),
  };
  recordTest(
    "3.3 Audit times converted in place; display and inputs use bank time (Asia/Dhaka)",
    { audit: "2026-10-27 11:22:52", utc: "2026-10-27T05:22:52Z" },
    { audit: audit.records[0].auditData, display },
    audit.records[0].auditData.recInputTime === "2026-10-27T11:22:52+06:00" &&
      audit.records[0].auditData.recAuthTime === "" &&
      display.date === "01 Jan 2025" &&
      display.dateTime === "27 Oct 2026 11:22:52" &&
      display.localInput === "2026-10-27T11:22:52" &&
      /^\d{4}-\d{2}-\d{2}$/.test(display.today),
  );

  // ── 4. Title Case with Acronyms ──
  console.log("\n── 4. Title Case with Acronyms (toTitleCase) ──");
  const titleResult = toTitleCase("JANATA BANK HO PLC ATM BRANCH");
  recordTest(
    "4.1 Converts to Title Case while strictly preserving known CBS acronyms (HO, PLC, ATM)",
    { input: "JANATA BANK HO PLC ATM BRANCH" },
    { titleResult },
    titleResult === "Janata Bank HO PLC ATM Branch",
  );

  // ── 5. Ephemeral UI Client Token & UUID Idempotency Key ──
  console.log("\n── 5. Ephemeral UI Client Token & UUID Idempotency Key ──");
  const token = generateClientToken("rtn");
  recordTest(
    "5.1 Generates non-cryptographic short token with specified prefix",
    { prefix: "rtn" },
    { token },
    token.startsWith("rtn_") && token.length >= 10,
  );

  const idemKey = generateIdempotencyKey();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  recordTest(
    "5.2 Generates pure RFC 4122 UUIDv4 idempotencyKey",
    "generateIdempotencyKey()",
    { idemKey },
    uuidRegex.test(idemKey),
  );

  // ── 6. Document Export Utilities ──
  console.log("\n── 6. Document Export Utilities (CSV, HTML, XML) ──");
  // In Node/tsx test environment, browser window is undefined so exports cleanly no-op
  const exportCols = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
  ];
  const exportRows = [{ id: "101", name: "Corporate Account" }];

  let noCrash = true;
  try {
    exportToCsv("test.csv", exportCols, exportRows);
    exportToHtmlReport("test.html", exportCols, exportRows);
    exportToXml("test.xml", exportCols, exportRows);
  } catch {
    noCrash = false;
  }
  recordTest(
    "6.1 Export functions execute safely in headless environments without DOM crashes",
    { columns: exportCols, rows: exportRows },
    { headlessSafe: noCrash },
    noCrash === true,
  );

  // 6.2 Exported content is safe: captured through a stubbed browser download
  const files: Blob[] = [];
  const browser = globalThis as unknown as { window?: unknown; document?: unknown };
  const realCreateObjectURL = URL.createObjectURL;
  const realRevokeObjectURL = URL.revokeObjectURL;
  browser.window = {};
  browser.document = {
    createElement: () => ({ setAttribute() {}, click() {} }),
    body: { appendChild() {}, removeChild() {} },
  };
  URL.createObjectURL = (blob: Blob) => {
    files.push(blob);
    return "blob:test";
  };
  URL.revokeObjectURL = () => {};
  try {
    const hostileRows = [
      {
        title: "<img src=x onerror=alert(1)>",
        note: '=HYPERLINK("http://x","pay")',
        amount: "-5",
        actions: [{ cmdFor: "BRANCH S recordId" }],
      },
    ];
    const hostileCols = [
      { key: "title", header: "Title" },
      { key: "note", header: "Note" },
      { key: "amount", header: "Amount" },
      { key: "actions", header: "Actions" },
    ];
    exportToCsv("t", hostileCols, hostileRows);
    exportToHtmlReport("t", hostileCols, hostileRows, { title: "Report <b>x</b>" });
    exportToXml("t", hostileCols, hostileRows, { title: 'a"b', code: "X" });
    const [csv, html, xml] = await Promise.all(files.map((f) => f.text()));
    recordTest(
      "6.2 Exports escape HTML/XML, neutralise CSV formulas, keep -5 a number, write nested values as JSON",
      hostileRows[0],
      {
        csvRow: csv.split("\r\n")[1],
        htmlHasTag: html.includes("<img "),
        xmlRoot: xml.split("\n")[1],
      },
      csv.includes(`"'=HYPERLINK(""http://x"",""pay"")"`) &&
        csv.includes('"-5"') &&
        !csv.includes("[object Object]") &&
        csv.includes("cmdFor") &&
        !html.includes("<img ") &&
        html.includes("&lt;img") &&
        !html.includes("<b>x</b>") &&
        xml.includes('title="a&quot;b"'),
    );
  } finally {
    delete browser.window;
    delete browser.document;
    URL.createObjectURL = realCreateObjectURL;
    URL.revokeObjectURL = realRevokeObjectURL;
  }

  // ----------------------------------------------------------------------------
  // 7. Web Storage Gateway
  // ----------------------------------------------------------------------------
  const ssrSafe =
    cbsStorage.get("local", "k") === null && cbsStorage.readJson("session", "k") === null;
  cbsStorage.set("local", "k", "v"); // must be a silent no-op without window
  recordTest(
    "7. cbsStorage is SSR-safe: reads return null and writes no-op without a window",
    { window: typeof globalThis.window },
    { ssrSafe },
    ssrSafe,
  );

  const backing = new Map<string, string>();
  const fakeArea = {
    getItem: (k: string) => backing.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (k === "quota") throw new Error("QuotaExceededError");
      backing.set(k, v);
    },
    removeItem: (k: string) => backing.delete(k),
  };
  const g = globalThis as unknown as { window?: unknown };
  g.window = { localStorage: fakeArea, sessionStorage: fakeArea };
  try {
    const schema = z.object({ value: z.string() });
    cbsStorage.writeJson("session", "crit", { value: "AU" });
    backing.set("bad", "{not json");
    backing.set("wrongShape", JSON.stringify({ value: 42 }));
    const roundTrip = cbsStorage.readJson("session", "crit", schema);
    const badJson = cbsStorage.readJson("session", "bad");
    const wrongShape = cbsStorage.readJson("session", "wrongShape", schema);
    let quotaThrew = false;
    try {
      cbsStorage.set("local", "quota", "x");
    } catch {
      quotaThrew = true;
    }
    cbsStorage.remove("session", "crit", "bad");
    const removed = !backing.has("crit") && !backing.has("bad");

    recordTest(
      "7.1 cbsStorage round-trips JSON, rejects corrupt/invalid data and absorbs quota errors",
      { written: { value: "AU" } },
      { roundTrip, badJson, wrongShape, quotaThrew, removed },
      roundTrip?.value === "AU" &&
        badJson === null &&
        wrongShape === null &&
        !quotaThrew &&
        removed,
    );
  } finally {
    delete g.window;
  }

  // Consolidated Summary
  const passedTests = testCases.filter((t) => t.passed).length;
  const failedTests = testCases.filter((t) => !t.passed).length;

  console.log("\n================================================================================");
  if (failedTests === 0) {
    console.log(
      `>>> SUCCESS: ALL ${passedTests} CORE UTILITIES CAPABILITIES VALIDATED 100% CLEAN! <<<`,
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

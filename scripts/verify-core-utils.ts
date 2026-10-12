/**
 * Automated Verification Suite for Core Utils (@/lib/core-utils)
 * Tests currency formatting (BDT), date parsers, account number masking, and string helpers.
 *
 * Usage:
 *   pnpm tsx scripts/verify-core-utils.ts
 */

import {
  formatAccountNumber,
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatValueDate,
  maskAccountNumber,
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

console.log("\n========================================================");
console.log("       CORE BANKING UTILITIES VERIFICATION SUITE        ");
console.log("========================================================\n");

// 1. Currency Formatting (BDT)
const formattedBDT = formatCurrency(150000);
assert("formatCurrency(150000) includes 'BDT'", formattedBDT.includes("BDT"));
assert("formatCurrency(150000) has decimal places .00", formattedBDT.includes(".00"));

const formattedNegative = formatCurrency(-5000, { accountingNegative: true });
assert(
  "formatCurrency(-5000) accounting format (5,000.00 BDT)",
  formattedNegative.includes("(5,000.00 BDT)"),
);

const formattedZero = formatCurrency(0);
assert("formatCurrency(0) returns '0.00 BDT'", formattedZero.includes("0.00 BDT"));

// 2. Pure Number Formatting (en-IN South Asian Lakh/Crore grouping)
const numStr = formatNumber(1234567.89, 2);
assert(
  "formatNumber(1234567.89) formats with South Asian / standard grouping",
  numStr === "12,34,567.89" || numStr === "1,234,567.89",
);

// 3. Account Number Masking & Formatting
const maskedAc = maskAccountNumber("0123456789012");
assert(
  "maskAccountNumber preserves start 4 and end 4 digits",
  maskedAc.startsWith("0123") && maskedAc.endsWith("9012"),
);
assert("maskAccountNumber inserts mask dots", maskedAc.includes("••••"));

const formattedAc = formatAccountNumber("0123456789012");
assert(
  "formatAccountNumber chunks account number",
  formattedAc === "0123-456789-012" || formattedAc.length === 15,
);

// 4. Value Date & Transaction Timestamps
const valueDate = formatValueDate("20261012");
assert(
  "formatValueDate('20261012') formats valid date",
  valueDate.includes("2026") && valueDate.includes("12"),
);

const dateTime = formatDateTime(new Date("2026-10-12T14:30:00Z"));
assert("formatDateTime formats non-empty string", Boolean(dateTime && dateTime.length > 5));

console.log("\n========================================================");
const allPassed = reports.every((r) => r.passed);
if (allPassed) {
  console.log(`ALL ${reports.length} CORE UTILS TEST CASES PASSED WITH 100% SUCCESS!`);
} else {
  console.error("SOME CORE UTILS TESTS FAILED!");
  process.exit(1);
}
console.log("========================================================\n");

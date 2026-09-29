/**
 * Core Banking Currency & Number Formatting Utilities
 */

export interface CurrencyFormatOptions {
  currency?: string;
  decimals?: number;
  accountingNegative?: boolean; // Formats -100 as (100.00)
}

/**
 * Format a number or numeric string into localized currency (default BDT / Bangladeshi Taka).
 */
export function formatCurrency(
  value: number | string | null | undefined,
  options: CurrencyFormatOptions = {},
): string {
  if (value === null || value === undefined || value === "") return "";

  const num = typeof value === "string" ? Number.parseFloat(value.replace(/,/g, "")) : value;
  if (Number.isNaN(num)) return String(value);

  const { currency = "BDT", decimals = 2, accountingNegative = false } = options;

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formattedAbs = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absNum);

  if (isNegative && accountingNegative) {
    return `(${formattedAbs} ${currency})`;
  }

  const sign = isNegative ? "-" : "";
  return `${sign}${formattedAbs} ${currency}`;
}

/**
 * Formats a raw number string with thousands separators without currency symbol.
 */
export function formatNumber(
  value: number | string | null | undefined,
  decimals: number = 2,
): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? Number.parseFloat(value.replace(/,/g, "")) : value;
  if (Number.isNaN(num)) return String(value);

  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

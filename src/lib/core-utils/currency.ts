import { clientConfig } from "@/lib/core-config";

/**
 * Core Banking Currency Formatting Utilities
 */

export interface CurrencyFormatOptions {
  currency?: string;
  decimals?: number;
  accountingNegative?: boolean; // Formats -100 as (100.00 BDT)
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

  const {
    currency = clientConfig.format.currency,
    decimals = 2,
    accountingNegative = false,
  } = options;

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formattedAbs = new Intl.NumberFormat(clientConfig.format.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(absNum);

  if (isNegative && accountingNegative) {
    return `(${formattedAbs} ${currency})`;
  }

  const sign = isNegative ? "-" : "";
  return `${sign}${formattedAbs} ${currency}`;
}

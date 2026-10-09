import type { CurrencyFormatOptions } from "./types";

/**
 * Standard CBS Currency & Number Formatter.
 * Formats monetary amounts with banking precision.
 */
export function formatCbsCurrency(
  amount: number | string | null | undefined,
  options: CurrencyFormatOptions = {},
): string {
  if (amount === null || amount === undefined || amount === "") return "";

  const num = typeof amount === "number" ? amount : Number.parseFloat(String(amount).replace(/,/g, ""));
  if (Number.isNaN(num)) return String(amount);

  const { currencyCode, decimals = 2, locale = "en-US" } = options;

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  return currencyCode ? `${currencyCode} ${formattedNumber}` : formattedNumber;
}

/**
 * Masks sensitive account numbers (e.g. "1002345678" -> "******5678").
 */
export function maskAccountNumber(acc: string | null | undefined, visibleTail = 4): string {
  if (!acc) return "";
  const str = acc.trim();
  if (str.length <= visibleTail) return str;
  return `${"*".repeat(str.length - visibleTail)}${str.slice(-visibleTail)}`;
}

/**
 * Formats account strings with dash grouping (e.g. "01001234567" -> "010-0123-4567").
 */
export function formatCbsAccount(acc: string | null | undefined): string {
  if (!acc) return "";
  const cleaned = acc.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  return acc;
}

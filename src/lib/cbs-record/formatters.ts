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

  const num =
    typeof amount === "number" ? amount : Number.parseFloat(String(amount).replace(/,/g, ""));
  if (Number.isNaN(num)) return String(amount);

  const { currencyCode, decimals = 2, locale = "en-US" } = options;

  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);

  return currencyCode ? `${currencyCode} ${formattedNumber}` : formattedNumber;
}

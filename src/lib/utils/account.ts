/**
 * Core Banking Account Number & Sensitive Field Formatting / Masking Utilities
 */

/**
 * Masks an account number for privacy (e.g. "0123456789012" -> "0123•••••9012").
 */
export function maskAccountNumber(
  accountNo: string | null | undefined,
  visibleStart = 4,
  visibleEnd = 4,
): string {
  if (!accountNo) return "";
  const str = String(accountNo).trim();
  if (str.length <= visibleStart + visibleEnd) return str;

  const start = str.slice(0, visibleStart);
  const end = str.slice(-visibleEnd);
  const maskedCount = Math.max(str.length - (visibleStart + visibleEnd), 4);
  const dots = "•".repeat(maskedCount);

  return `${start}${dots}${end}`;
}

/**
 * Formats a raw account number into standard hyphenated chunks (e.g. "0123-456789-012").
 */
export function formatAccountNumber(accountNo: string | null | undefined): string {
  if (!accountNo) return "";
  const cleaned = String(accountNo).replace(/\D/g, "");
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 10)}-${cleaned.slice(10)}`;
  }
  return accountNo;
}

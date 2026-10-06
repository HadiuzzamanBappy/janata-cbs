import { appConfig } from "@/lib/config";

/**
 * Core Banking Date & Julian / Value Date Formatting Utilities
 */

/**
 * Parses CBS YYYYMMDD string (e.g. "20260929") into standard formatted date (e.g. "29 Sep 2026").
 */
export function formatValueDate(valueDateStr: string | null | undefined): string {
  if (valueDateStr?.length !== 8) return valueDateStr || "";

  const year = valueDateStr.substring(0, 4);
  const month = valueDateStr.substring(4, 6);
  const day = valueDateStr.substring(6, 8);

  const date = new Date(
    Number.parseInt(year, 10),
    Number.parseInt(month, 10) - 1,
    Number.parseInt(day, 10),
  );
  if (Number.isNaN(date.getTime())) return valueDateStr;

  return date.toLocaleDateString(appConfig.format.dateLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Formats a Date object or ISO string into standard transaction timestamp ("DD-MMM-YYYY HH:mm:ss").
 */
export function formatDateTime(dateInput: Date | string | number | null | undefined): string {
  if (!dateInput) return "";

  const date = typeof dateInput === "object" ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return String(dateInput);

  const d = date.toLocaleDateString(appConfig.format.dateLocale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const t = date.toLocaleTimeString(appConfig.format.dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${d} ${t}`;
}

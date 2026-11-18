import { clientConfig } from "@/lib/core-config";

/**
 * The CBS date and time contract, in one place. Inside the system every date is ISO
 * (`YYYY-MM-DD`) and every date-time is ISO with an explicit offset
 * (`YYYY-MM-DDTHH:mm:ss+06:00`). Bank time is Asia/Dhaka, which has no daylight saving.
 *
 * Inbound data is converted once, at the boundary, by `toIsoDate` / `toIsoDateTime`.
 * They are the only code that knows the core's legacy formats.
 */

export const CBS_TIME_ZONE = "Asia/Dhaka";
const CBS_UTC_OFFSET = "+06:00";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(:\d{2}(\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;
/** ISO date-time with no offset (what an `<input type="datetime-local">` emits). */
const LOCAL_DATE_TIME = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(:\d{2})?$/;

// LEGACY (temporary): formats the core sends today. Delete with the two branches below once
// the core sends ISO. Nothing outside this file may know these formats.
const LEGACY_COMPACT_DATE = /^(\d{4})(\d{2})(\d{2})$/;
const LEGACY_SPACED_DATE_TIME = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(:\d{2})?$/;

const isString = (v: unknown): v is string => typeof v === "string";

/** A real calendar day (rejects 2026-02-30, which Date.parse rolls over to March). */
function isCalendarDay(isoDate: string): boolean {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** `YYYY-MM-DD` and a real calendar day. */
export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value) && isCalendarDay(value);
}

/** ISO date-time with an explicit offset (`…+06:00` or `…Z`) on a real calendar day. */
export function isIsoDateTime(value: string): boolean {
  const parts = ISO_DATE_TIME.exec(value);
  return Boolean(parts && isCalendarDay(parts[1]) && !Number.isNaN(Date.parse(value)));
}

/**
 * Inbound date → ISO `YYYY-MM-DD`. Accepts ISO, and (legacy) the core's compact `YYYYMMDD`.
 * Anything else is returned unchanged, so validation can report it.
 */
export function toIsoDate(value: unknown): unknown {
  if (!isString(value)) return value;
  const text = value.trim();
  if (ISO_DATE.test(text)) return text;
  // An ISO date-time in a date field keeps its bank-time calendar day
  if (isIsoDateTime(text)) return isoDateTimeToLocalInput(text).slice(0, 10);
  const legacy = LEGACY_COMPACT_DATE.exec(text);
  if (legacy) return `${legacy[1]}-${legacy[2]}-${legacy[3]}`;
  return value;
}

/**
 * Inbound date-time → ISO with an offset. A time with no offset is bank time (+06:00).
 * Accepts ISO, and (legacy) the core's `YYYY-MM-DD HH:mm:ss`. Anything else is unchanged.
 */
export function toIsoDateTime(value: unknown): unknown {
  if (!isString(value)) return value;
  const text = value.trim();
  if (ISO_DATE_TIME.test(text)) return text;
  const local = LOCAL_DATE_TIME.exec(text) ?? LEGACY_SPACED_DATE_TIME.exec(text);
  if (local) return `${local[1]}T${local[2]}${local[3] ?? ":00"}${CBS_UTC_OFFSET}`;
  return value;
}

/**
 * Inbound value for a date column whose kind isn't declared (inquiry columns): a value with a time
 * part goes through `toIsoDateTime`, a bare date through `toIsoDate`.
 */
export function toIsoTemporal(value: unknown): unknown {
  return isString(value) && value.includes(":") ? toIsoDateTime(value) : toIsoDate(value);
}

/** ISO date-time → the value an `<input type="datetime-local">` shows (bank time, no offset). */
export function isoDateTimeToLocalInput(value: string): string {
  if (!isIsoDateTime(value)) return value;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: CBS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
}

/** Today in bank time, as ISO `YYYY-MM-DD` (never the UTC date). */
export function todayIso(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CBS_TIME_ZONE }).format(new Date());
}

/** Now in bank time, as ISO date-time with the +06:00 offset. */
export function nowIsoDateTime(): string {
  return toIsoDateTime(isoDateTimeToLocalInput(new Date().toISOString())) as string;
}

/** Audit timestamps every CBS record carries. */
const AUDIT_TIME_KEYS = ["recInputTime", "recAuthTime"] as const;

/**
 * Converts the audit timestamps of every `auditData` block in a core response (records, lists,
 * nested rows) to ISO date-times. Returns the same object when nothing changed.
 */
export function normalizeAuditTimes<T>(value: T): T {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const out = normalizeAuditTimes(item);
      changed ||= out !== item;
      return out;
    });
    return (changed ? next : value) as T;
  }
  if (!value || typeof value !== "object") return value;

  const obj = value as Record<string, unknown>;
  let result: Record<string, unknown> | null = null;
  for (const [key, child] of Object.entries(obj)) {
    let next: unknown = normalizeAuditTimes(child);
    if (key === "auditData" && next && typeof next === "object" && !Array.isArray(next)) {
      const audit = next as Record<string, unknown>;
      for (const timeKey of AUDIT_TIME_KEYS) {
        const iso = toIsoDateTime(audit[timeKey]);
        if (iso !== audit[timeKey]) next = { ...(next as object), [timeKey]: iso };
      }
    }
    if (next !== child) {
      result ??= { ...obj };
      result[key] = next;
    }
  }
  return (result ?? obj) as T;
}

/** ISO date → display date in the bank's locale (e.g. "01 Jan 2025"). Other values as-is. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  if (!isIsoDate(value)) return value;
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(clientConfig.format.dateLocale, {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * ISO date-time (or a Date) → display timestamp in bank time ("01 Jan 2025 10:00:00").
 * An ISO date alone is shown as a date. Other values are returned as-is.
 */
export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "";
  if (isString(value)) {
    if (isIsoDate(value)) return formatDate(value);
    if (!isIsoDateTime(value)) return value;
  }
  const date = isString(value) ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return String(value);
  const locale = clientConfig.format.dateLocale;
  const d = date.toLocaleDateString(locale, {
    timeZone: CBS_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const t = date.toLocaleTimeString(locale, {
    timeZone: CBS_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${d} ${t}`;
}

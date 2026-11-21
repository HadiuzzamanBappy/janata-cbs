"use client";

import type { ColumnFormat } from "@/lib/cbs-inquiry-spec";
import { clientConfig } from "@/lib/core-config";
import { cn, formatCurrency, formatDateTime } from "@/lib/core-utils";

export interface CellFormatterProps {
  value: unknown;
  format: ColumnFormat;
  isMono: boolean;
  routine?: string;
}

/** One formatter for every number cell, in the system locale (not the browser's). */
const numberFormat = new Intl.NumberFormat(clientConfig.format.locale, {
  maximumFractionDigits: 4,
});

function applyRoutineTransformation(val: string, routine?: string): string {
  if (!routine) return val;
  const upper = routine.trim().toUpperCase();

  // 1. SUBSTRING,start,length (CBS 1-indexed) e.g. SUBSTRING,1,4
  if (upper.startsWith("SUBSTRING") || upper.startsWith("SUBSTR")) {
    const parts = upper.split(",");
    const start = Math.max(0, (Number.parseInt(parts[1]?.trim() || "1", 10) || 1) - 1);
    const len = Number.parseInt(parts[2]?.trim() || "0", 10);
    return len > 0 ? val.substring(start, start + len) : val.substring(start);
  }

  // 2. MASK / MASK.ACCOUNT e.g. ****1234
  if (upper.includes("MASK")) {
    return val.length > 4 ? `****${val.slice(-4)}` : val;
  }

  // 3. UPPER / UPPERCASE
  if (upper === "UPPER" || upper === "UPPERCASE") {
    return val.toUpperCase();
  }

  // 4. LOWER / LOWERCASE
  if (upper === "LOWER" || upper === "LOWERCASE") {
    return val.toLowerCase();
  }

  return val;
}

function toNumber(value: unknown, text: string): number {
  return typeof value === "number" ? value : Number.parseFloat(text.replace(/,/g, ""));
}

export function CellFormatter({ value, format, isMono, routine }: CellFormatterProps) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-muted-foreground/30 font-mono text-3xs">-</span>;
  }

  const strVal = applyRoutineTransformation(String(value), routine);
  const mono = cn("text-2xs", isMono && "font-mono tabular-nums");

  switch (format) {
    case "currency": {
      const numVal = toNumber(value, strVal);
      if (Number.isNaN(numVal)) return <span className={mono}>{strVal}</span>;
      return <span className={cn(mono, "font-medium")}>{formatCurrency(numVal)}</span>;
    }

    case "number": {
      const numVal = toNumber(value, strVal);
      return (
        <span className={mono}>{Number.isNaN(numVal) ? strVal : numberFormat.format(numVal)}</span>
      );
    }

    case "date":
      // Rows are ISO by now (runInquiry); formatDateTime shows a date or a timestamp
      return <span className={mono}>{formatDateTime(strVal) || strVal}</span>;

    default:
      return <span className={mono}>{strVal}</span>;
  }
}

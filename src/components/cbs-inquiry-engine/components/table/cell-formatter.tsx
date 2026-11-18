"use client";

import { formatCurrency, formatDateTime } from "@/lib/core-utils";

export type CellFormatType = "text" | "currency" | "date" | "number";

export interface CellFormatterProps {
  value: unknown;
  format?: CellFormatType;
  currencyCode?: string;
  isMono?: boolean;
  routine?: string;
}

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

export function CellFormatter({
  value,
  format = "text",
  currencyCode,
  isMono = true,
  routine,
}: CellFormatterProps) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-muted-foreground/30 font-mono text-3xs">-</span>;
  }

  const rawStr = String(value);
  const strVal = routine ? applyRoutineTransformation(rawStr, routine) : rawStr;

  switch (format) {
    case "currency": {
      const numVal =
        typeof value === "number" ? value : Number.parseFloat(strVal.replace(/[^0-9.-]+/g, ""));
      if (Number.isNaN(numVal)) return <span className="font-mono text-2xs">{strVal}</span>;
      return (
        <span className="font-mono text-2xs font-medium tabular-nums">
          {formatCurrency(numVal, { currency: currencyCode || "BDT" })}
        </span>
      );
    }

    case "number": {
      const numVal = typeof value === "number" ? value : Number.parseFloat(strVal);
      if (Number.isNaN(numVal)) return <span className="font-mono text-2xs">{strVal}</span>;
      return (
        <span className="font-mono text-2xs tabular-nums">
          {numVal.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      );
    }

    case "date": {
      // Rows are ISO by now (runInquiry); formatDateTime shows a date or a timestamp
      return (
        <span className="font-mono text-2xs tabular-nums">{formatDateTime(strVal) || strVal}</span>
      );
    }

    default:
      return <span className={isMono ? "font-mono text-2xs" : "text-2xs"}>{strVal}</span>;
  }
}

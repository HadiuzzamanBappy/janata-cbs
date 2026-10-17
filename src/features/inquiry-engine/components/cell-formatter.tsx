"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/core-utils";

export type CellFormatType = "text" | "currency" | "date" | "account" | "badge" | "number";

export interface CellFormatterProps {
  value: unknown;
  format?: CellFormatType;
  currencyCode?: string;
  isMono?: boolean;
}

export function CellFormatter({
  value,
  format = "text",
  currencyCode,
  isMono,
}: CellFormatterProps) {
  if (value === undefined || value === null || value === "") {
    return <span className="text-muted-foreground/40 font-mono text-[11px]">-</span>;
  }

  const strVal = String(value);

  switch (format) {
    case "currency": {
      const numVal =
        typeof value === "number" ? value : Number.parseFloat(strVal.replace(/[^0-9.-]+/g, ""));
      if (Number.isNaN(numVal)) return <span className="font-mono text-xs">{strVal}</span>;
      return (
        <span className="font-mono text-xs font-medium tabular-nums">
          {formatCurrency(numVal, { currency: currencyCode || "BDT" })}
        </span>
      );
    }

    case "number": {
      const numVal = typeof value === "number" ? value : Number.parseFloat(strVal);
      if (Number.isNaN(numVal)) return <span className="font-mono text-xs">{strVal}</span>;
      return (
        <span className="font-mono text-xs tabular-nums">
          {numVal.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      );
    }

    case "date": {
      const formatted = formatDateTime(strVal);
      return <span className="font-mono text-xs tabular-nums">{formatted || strVal}</span>;
    }

    case "account": {
      return (
        <span className="font-mono text-xs font-semibold tracking-wider text-primary/90">
          {strVal}
        </span>
      );
    }

    case "badge": {
      const upper = strVal.toUpperCase();
      const isPositive =
        upper === "ACTIVE" || upper === "AUTHORIZED" || upper === "SUCCESS" || upper === "APPROVED";
      const isNegative =
        upper === "REJECTED" || upper === "CLOSED" || upper === "FAILED" || upper === "BLOCKED";

      return (
        <Badge
          variant={isPositive ? "default" : isNegative ? "destructive" : "secondary"}
          className="text-[10px] font-mono px-1.5 py-0 h-4.5 rounded uppercase tracking-wider"
        >
          {strVal}
        </Badge>
      );
    }

    default:
      return <span className={isMono ? "font-mono text-xs" : "text-xs"}>{strVal}</span>;
  }
}

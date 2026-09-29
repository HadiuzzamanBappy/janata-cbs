"use client";

import { Download, Filter, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EnquiryHeaderProps {
  title: string;
  commandCode: string;
  step: "SELECTION" | "RESULTS";
  rowCount?: number;
  onBackToSelection?: () => void;
  onRefresh?: () => void;
  onExportCSV?: () => void;
}

export function EnquiryHeader({
  title,
  commandCode,
  step,
  rowCount,
  onBackToSelection,
  onRefresh,
  onExportCSV,
}: EnquiryHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
      {/* Left Title & Command Code Block */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Search className="size-3.5" />
        </div>
        <div className="flex flex-col justify-center min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-xs">
              {title}
            </h2>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                step === "SELECTION"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {step === "SELECTION" ? "Selection" : `Results (${rowCount ?? 0})`}
            </span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
            {commandCode}
          </span>
        </div>
      </div>

      {/* Right Action Toolbar for Results Screen */}
      <div className="flex items-center gap-1.5 shrink-0">
        {step === "RESULTS" && (
          <>
            {onBackToSelection && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onBackToSelection}
                className="h-8 text-xs gap-1.5 px-2.5 font-medium"
              >
                <Filter className="size-3.5 text-primary" />
                <span>Refilter Criteria</span>
              </Button>
            )}

            {onRefresh && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRefresh}
                className="h-8 text-xs gap-1.5 px-2.5"
              >
                <RefreshCw className="size-3.5 text-muted-foreground" />
                <span>Refresh</span>
              </Button>
            )}

            {onExportCSV && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onExportCSV}
                className="h-8 text-xs gap-1.5 px-2.5 font-mono"
              >
                <Download className="size-3.5" />
                <span>Export CSV</span>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

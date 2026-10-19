"use client";

import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import type { FormLayoutIssue } from "@/lib/cbs-form-spec";

export interface FcStaleLayoutBannerProps {
  issues: FormLayoutIssue[];
  targetModel?: string;
}

export function FcStaleLayoutBanner({ issues, targetModel }: FcStaleLayoutBannerProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (!issues || issues.length === 0) return null;

  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-2 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="size-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-amber-600 dark:text-amber-400">
            Model Schema Drift Detected
          </span>
          <span className="text-muted-foreground truncate">
            Form layout does not fully match model &ldquo;{targetModel || "UNKNOWN"}&rdquo;
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {errorCount > 0 && (
              <Badge variant="destructive" className="text-[10px] h-4 px-1.5 font-mono">
                {errorCount} error{errorCount > 1 ? "s" : ""}
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] h-4 px-1.5 font-mono bg-amber-500/20 text-amber-700 dark:text-amber-300"
              >
                {warningCount} warning{warningCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-1 shrink-0 font-medium cursor-pointer"
        >
          <span>{expanded ? "Hide Details" : "View Details"}</span>
          {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-2 pt-2 border-t border-amber-500/20 space-y-1.5 max-h-36 overflow-y-auto">
          {issues.map((issue) => (
            <div
              key={`${issue.code}-${issue.fieldKey || issue.sectionId || issue.message}`}
              className="flex items-start gap-2 text-[11px] text-foreground/90 font-mono"
            >
              <span
                className={
                  issue.severity === "error"
                    ? "text-destructive font-bold"
                    : "text-amber-600 dark:text-amber-400 font-bold"
                }
              >
                [{issue.code}]
              </span>
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

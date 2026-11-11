"use client";

import * as React from "react";
import { computeLineDiff } from "@/lib/cbs-record";
import { cn } from "@/lib/core-utils";
import { JsonDiffView } from "./json-diff-view";
import { renderJsonLine } from "./json-tokenizer";
import { type JsonViewerMode, JsonViewerToolbar } from "./json-viewer-toolbar";

export interface CbsJsonViewerTabProps {
  /** Output/Working sanitized JSON */
  data: unknown;
  /** Baseline or original uncommitted data to compare against */
  baseline?: unknown;
  /** Untouched raw JSON directly received from the database/API */
  raw?: unknown;
  wireTag?: string;
  title?: string;
  filename?: string;
  className?: string;
}

export function CbsJsonViewerTab({
  data,
  baseline,
  raw,
  title = "Database Wire Output Payload",
  filename = "payload.json",
  className = "",
}: CbsJsonViewerTabProps) {
  const [copied, setCopied] = React.useState(false);

  // Raw JSON String directly from DB
  const rawJsonString = React.useMemo(() => {
    if (raw === undefined || raw === null) return null;
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }, [raw]);

  // Output/Working sanitized JSON String
  const outputJsonString = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  // Baseline JSON String (compares against parsed baseline snapshot, fallback to raw)
  const baselineJsonString = React.useMemo(() => {
    const base = baseline ?? raw;
    if (base === undefined || base === null) return null;
    try {
      return JSON.stringify(base, null, 2);
    } catch {
      return String(base);
    }
  }, [baseline, raw]);

  // Compute diff between baseline (or raw DB) and output
  const diffSummary = React.useMemo(() => {
    if (baselineJsonString === null) return null;
    return computeLineDiff(baselineJsonString, outputJsonString);
  }, [baselineJsonString, outputJsonString]);

  const hasDiff = Boolean(diffSummary && (diffSummary.additions > 0 || diffSummary.deletions > 0));

  // View mode: "raw" (original DB) | "diff" (GitHub style differences) | "output" (sanitized wire payload)
  const [viewMode, setViewMode] = React.useState<JsonViewerMode>(() => {
    if (rawJsonString !== null && hasDiff) return "diff";
    return "output";
  });

  // Auto-switch to diff if user makes changes while on the screen
  React.useEffect(() => {
    if (hasDiff) {
      setViewMode("diff");
    }
  }, [hasDiff]);

  // The active JSON string to display in standard/formatted mode
  const displayedJsonString =
    viewMode === "raw" && rawJsonString !== null ? rawJsonString : outputJsonString;

  const lines = React.useMemo(
    () =>
      displayedJsonString
        .split("\n")
        .map((text, idx) => ({ id: `L${idx + 1}`, num: idx + 1, text })),
    [displayedJsonString],
  );
  const linesCount = lines.length;
  const sizeBytes = React.useMemo(
    () => new TextEncoder().encode(displayedJsonString).length,
    [displayedJsonString],
  );

  // Derive active content to copy or download
  const activeExportContent = React.useMemo(() => {
    if (viewMode === "diff" && diffSummary && hasDiff) {
      return diffSummary.items
        .map((it) => {
          const prefix = it.type === "insert" ? "+ " : it.type === "delete" ? "- " : "  ";
          return `${prefix}${it.text}`;
        })
        .join("\n");
    }
    return displayedJsonString;
  }, [viewMode, diffSummary, hasDiff, displayedJsonString]);

  const activeExportFilename = React.useMemo(() => {
    if (viewMode === "diff" && hasDiff) {
      return filename.replace(/\.json$/i, ".diff.txt");
    }
    if (viewMode === "raw") {
      return filename.replace(/\.json$/i, ".raw.json");
    }
    return filename;
  }, [viewMode, hasDiff, filename]);

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(activeExportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeExportContent]);

  const handleDownload = React.useCallback(() => {
    const isDiff = viewMode === "diff" && hasDiff;
    const blob = new Blob([activeExportContent], {
      type: isDiff ? "text/plain" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeExportFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [activeExportContent, activeExportFilename, viewMode, hasDiff]);

  return (
    <div
      className={cn("flex-1 flex flex-col min-h-0 bg-background overflow-hidden p-0", className)}
    >
      <div className="flex-1 rounded-md border border-border/80 bg-card flex flex-col overflow-hidden shadow-2xs min-h-0">
        <JsonViewerToolbar
          title={title}
          linesCount={linesCount}
          sizeBytes={sizeBytes}
          baselineJsonString={baselineJsonString}
          rawJsonString={rawJsonString}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasDiff={hasDiff}
          diffSummary={diffSummary}
          copied={copied}
          onCopy={handleCopy}
          onDownload={handleDownload}
        />

        {/* Display Area: Either GitHub Diff or Standard JSON */}
        {viewMode === "diff" && diffSummary ? (
          <JsonDiffView diffSummary={diffSummary} hasDiff={hasDiff} />
        ) : (
          /* Standard Formatted JSON */
          <div className="flex-1 overflow-auto min-h-0 bg-muted/15 p-3 font-mono text-[11.5px] select-text transition-colors selection:bg-primary/20 selection:text-primary">
            <div className="flex min-w-full">
              {/* Line numbers gutter */}
              <div className="select-none text-right pr-3.5 text-muted-foreground/50 font-mono text-[11px] border-r border-border/60 mr-3.5 shrink-0">
                {lines.map((line) => (
                  <div key={`gutter-${line.id}`} className="leading-5">
                    {line.num}
                  </div>
                ))}
              </div>

              {/* Syntax highlighted code */}
              <div className="flex-1 font-mono overflow-x-auto text-foreground">
                {lines.map((line) => renderJsonLine(line.text, line.num))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

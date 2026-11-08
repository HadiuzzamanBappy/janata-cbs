"use client";

import { Check, Copy, Database, Download, FileCode, GitCompare, Layers } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { computeLineDiff } from "@/lib/cbs-record";
import { cn } from "@/lib/core-utils";

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

// ---------------------------------------------------------------------------
// Pure-React JSON Syntax Highlighting Tokenizer (Semantic Tokens)
// ---------------------------------------------------------------------------
const JSON_TOKEN_REGEX =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:)|("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;

function renderHighlightedTokens(content: string, lineIndex: number | string): React.ReactNode {
  const tokenRegex = new RegExp(JSON_TOKEN_REGEX.source, "g");

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = tokenRegex.exec(content);

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const [, keyMatch, stringMatch, boolMatch, numberMatch, punctMatch] = match;

    if (keyMatch) {
      const colonIndex = keyMatch.lastIndexOf(":");
      const keyStr = keyMatch.slice(0, colonIndex);
      parts.push(
        <span key={`${lineIndex}-k-${match.index}`} className="text-primary font-medium">
          {keyStr}
        </span>,
      );
      parts.push(
        <span key={`${lineIndex}-c-${match.index}`} className="text-muted-foreground/60">
          :
        </span>,
      );
    } else if (stringMatch) {
      parts.push(
        <span key={`${lineIndex}-s-${match.index}`} className="text-foreground font-normal">
          {stringMatch}
        </span>,
      );
    } else if (boolMatch) {
      if (boolMatch === "null") {
        parts.push(
          <span
            key={`${lineIndex}-n-${match.index}`}
            className="text-destructive italic font-medium"
          >
            {boolMatch}
          </span>,
        );
      } else {
        parts.push(
          <span key={`${lineIndex}-b-${match.index}`} className="text-primary/90 font-semibold">
            {boolMatch}
          </span>,
        );
      }
    } else if (numberMatch) {
      parts.push(
        <span key={`${lineIndex}-num-${match.index}`} className="text-foreground/90 font-semibold">
          {numberMatch}
        </span>,
      );
    } else if (punctMatch) {
      parts.push(
        <span key={`${lineIndex}-p-${match.index}`} className="text-muted-foreground">
          {punctMatch}
        </span>,
      );
    }

    lastIndex = tokenRegex.lastIndex;
    match = tokenRegex.exec(content);
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return parts;
}

function renderJsonLine(line: string, lineIndex: number): React.ReactNode {
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "";
  const content = line.slice(indent.length);

  if (!content) {
    return (
      <div key={lineIndex} className="leading-5 h-5">
        &nbsp;
      </div>
    );
  }

  return (
    <div key={lineIndex} className="leading-5 whitespace-pre">
      {indent}
      {renderHighlightedTokens(content, lineIndex)}
    </div>
  );
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

  // Baseline JSON String (defaults to raw if baseline not provided)
  const baselineJsonString = React.useMemo(() => {
    const base = raw ?? baseline;
    if (base === undefined || base === null) return null;
    try {
      return JSON.stringify(base, null, 2);
    } catch {
      return String(base);
    }
  }, [raw, baseline]);

  // Compute diff between baseline (or raw DB) and output
  const diffSummary = React.useMemo(() => {
    if (baselineJsonString === null) return null;
    return computeLineDiff(baselineJsonString, outputJsonString);
  }, [baselineJsonString, outputJsonString]);

  const hasDiff = Boolean(diffSummary && (diffSummary.additions > 0 || diffSummary.deletions > 0));

  // View mode: "raw" (original DB) | "diff" (GitHub style differences) | "output" (sanitized wire payload)
  const [viewMode, setViewMode] = React.useState<"raw" | "diff" | "output">(() => {
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
        {/* Toolbar Header */}
        <div className="px-3 py-1.5 border-b border-border/70 flex flex-wrap items-center justify-between gap-2 bg-muted/20 shrink-0 min-w-0">
          {/* Title & Wire Tag */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-5 rounded-xs bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileCode className="size-3" />
            </div>
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide truncate">
                {title}
              </span>
            </div>
          </div>

          {/* Action Tools & Stats */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Metrics Badge */}
            <Badge
              variant="outline"
              className="font-mono text-[10px] h-6 rounded-xs px-1.5 text-muted-foreground hidden sm:inline-flex"
            >
              {linesCount}L • {(sizeBytes / 1024).toFixed(1)}KB
            </Badge>

            {/* View Mode Toggle: Raw (DB) | Changes (Diff) | Output (Payload) - Icons Only */}
            {baselineJsonString !== null && (
              <div className="inline-flex items-center rounded border border-border/80 bg-muted/40 p-0.5 gap-0.5">
                {rawJsonString !== null && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <button
                          type="button"
                          onClick={() => setViewMode("raw")}
                          className={cn(
                            "p-1 rounded-xs transition-colors cursor-pointer",
                            viewMode === "raw"
                              ? "bg-background text-foreground shadow-2xs font-semibold"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                          aria-label="View original database payload"
                        >
                          <Database className="size-3.5 text-cyan-400" />
                        </button>
                      }
                    />
                    <TooltipContent side="top" className="text-xs">
                      Raw DB Payload
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => setViewMode("diff")}
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 rounded-xs transition-colors cursor-pointer",
                          viewMode === "diff"
                            ? "bg-background text-foreground shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        aria-label="View differences"
                      >
                        <GitCompare className="size-3.5 text-amber-400" />
                        {hasDiff && diffSummary && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono leading-none">
                            {diffSummary.additions > 0 && (
                              <span className="text-emerald-500 font-semibold">
                                +{diffSummary.additions}
                              </span>
                            )}
                            {diffSummary.deletions > 0 && (
                              <span className="text-destructive font-semibold">
                                -{diffSummary.deletions}
                              </span>
                            )}
                          </span>
                        )}
                      </button>
                    }
                  />
                  <TooltipContent side="top" className="text-xs">
                    {hasDiff && diffSummary
                      ? `Changes (+${diffSummary.additions} / -${diffSummary.deletions})`
                      : "Changes Diff"}
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => setViewMode("output")}
                        className={cn(
                          "p-1 rounded-xs transition-colors cursor-pointer",
                          viewMode === "output"
                            ? "bg-background text-foreground shadow-2xs font-semibold"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                        aria-label="View clean output wire payload"
                      >
                        <Layers className="size-3.5 text-primary" />
                      </button>
                    }
                  />
                  <TooltipContent side="top" className="text-xs">
                    Clean Wire Output
                  </TooltipContent>
                </Tooltip>
              </div>
            )}

            {/* Copy Button (Clean minimal icon button) */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={handleCopy}
                    className="size-6.5 border-border/80 text-muted-foreground hover:text-foreground"
                    aria-label="Copy JSON"
                  >
                    {copied ? (
                      <Check className="size-3.5 text-primary" />
                    ) : (
                      <Copy className="size-3.5" />
                    )}
                  </Button>
                }
              />
              <TooltipContent side="bottom" className="text-xs">
                {copied ? "Copied to clipboard!" : "Copy JSON"}
              </TooltipContent>
            </Tooltip>

            {/* Download Button (Clean minimal icon button) */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-xs"
                    onClick={handleDownload}
                    className="size-6.5 border-border/80 text-muted-foreground hover:text-foreground"
                    aria-label="Download JSON"
                  >
                    <Download className="size-3.5" />
                  </Button>
                }
              />
              <TooltipContent side="bottom" className="text-xs">
                Download JSON file
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Display Area: Either GitHub Diff or Standard JSON */}
        {viewMode === "diff" && diffSummary ? (
          <div className="flex-1 overflow-auto min-h-0 bg-muted/10 font-mono text-[11.5px] select-text">
            {!hasDiff ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <GitCompare className="size-8 opacity-30 mb-2" />
                <div className="text-xs font-medium">No Changes Detected</div>
                <div className="text-[11px] text-muted-foreground/75 mt-0.5">
                  The working draft is identical to the baseline database record.
                </div>
              </div>
            ) : (
              <div className="min-w-full divide-y divide-border/20">
                {diffSummary.items.map((item) => {
                  const isAdd = item.type === "insert";
                  const isDel = item.type === "delete";
                  const indentMatch = item.text.match(/^(\s*)/);
                  const indent = indentMatch ? indentMatch[1] : "";
                  const content = item.text.slice(indent.length);

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-stretch leading-5 group",
                        isAdd && "bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-300",
                        isDel && "bg-destructive/10 hover:bg-destructive/15 text-destructive",
                        !isAdd && !isDel && "hover:bg-muted/30 text-foreground",
                      )}
                    >
                      {/* Old Line Number Gutter */}
                      <div className="w-11 select-none text-right pr-2 text-[10.5px] font-mono text-muted-foreground/40 border-r border-border/40 shrink-0">
                        {item.oldLineNumber ?? ""}
                      </div>

                      {/* New Line Number Gutter */}
                      <div className="w-11 select-none text-right pr-2 text-[10.5px] font-mono text-muted-foreground/40 border-r border-border/40 shrink-0">
                        {item.newLineNumber ?? ""}
                      </div>

                      {/* Git Marker (+, -, space) */}
                      <div
                        className={cn(
                          "w-6 select-none text-center font-mono font-bold text-xs shrink-0",
                          isAdd && "text-emerald-400",
                          isDel && "text-destructive",
                          !isAdd && !isDel && "text-transparent",
                        )}
                      >
                        {isAdd ? "+" : isDel ? "-" : " "}
                      </div>

                      {/* Line Content */}
                      <div className="flex-1 px-1.5 whitespace-pre overflow-x-auto">
                        {indent}
                        {isAdd || isDel ? content : renderHighlightedTokens(content, item.id)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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

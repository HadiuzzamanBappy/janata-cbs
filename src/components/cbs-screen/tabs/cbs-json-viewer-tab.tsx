"use client";

import { Check, Copy, Download, FileCode, GitCompare, Layers } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { computeLineDiff } from "@/lib/cbs-record";
import { cn } from "@/lib/core-utils";

export interface CbsJsonViewerTabProps {
  data: unknown;
  /** Baseline or original uncommitted data to compare against */
  baseline?: unknown;
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
  wireTag,
  title = "Database Wire Output Payload",
  filename = "payload.json",
  className = "",
}: CbsJsonViewerTabProps) {
  const [copied, setCopied] = React.useState(false);

  const jsonString = React.useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  const baselineJsonString = React.useMemo(() => {
    if (baseline === undefined || baseline === null) return null;
    try {
      return JSON.stringify(baseline, null, 2);
    } catch {
      return String(baseline);
    }
  }, [baseline]);

  // Compute diff if baseline is present
  const diffSummary = React.useMemo(() => {
    if (baselineJsonString === null) return null;
    return computeLineDiff(baselineJsonString, jsonString);
  }, [baselineJsonString, jsonString]);

  const hasDiff = Boolean(diffSummary && (diffSummary.additions > 0 || diffSummary.deletions > 0));

  // View mode: "formatted" (standard JSON view) or "diff" (GitHub style)
  const [viewMode, setViewMode] = React.useState<"formatted" | "diff">(() =>
    hasDiff ? "diff" : "formatted",
  );

  // Auto-switch to diff if user makes changes while on the screen
  React.useEffect(() => {
    if (hasDiff) {
      setViewMode("diff");
    }
  }, [hasDiff]);

  const lines = React.useMemo(
    () => jsonString.split("\n").map((text, idx) => ({ id: `L${idx + 1}`, num: idx + 1, text })),
    [jsonString],
  );
  const linesCount = lines.length;
  const sizeBytes = React.useMemo(() => new TextEncoder().encode(jsonString).length, [jsonString]);

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [jsonString]);

  const handleDownload = React.useCallback(() => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filename, jsonString]);

  return (
    <div
      className={cn("flex-1 flex flex-col min-h-0 bg-background overflow-hidden p-0", className)}
    >
      <div className="flex-1 rounded-md border border-border/80 bg-card flex flex-col overflow-hidden shadow-2xs min-h-0">
        {/* Toolbar Header */}
        <div className="p-2 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded-sm bg-primary/10 text-primary flex items-center justify-center">
              <FileCode className="size-3" />
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                {title}
              </span>
              {wireTag && (
                <span className="text-[10px] text-muted-foreground font-mono ml-2">
                  ({wireTag})
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle when Diff Available */}
            {baselineJsonString !== null && (
              <div className="flex items-center rounded border border-border/80 bg-muted/40 p-0.5 mr-1">
                <button
                  type="button"
                  onClick={() => setViewMode("formatted")}
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-xs transition-colors",
                    viewMode === "formatted"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Layers className="size-3" />
                  <span>Payload</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("diff")}
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded-xs transition-colors",
                    viewMode === "diff"
                      ? "bg-background text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <GitCompare className="size-3" />
                  <span>Changes</span>
                  {hasDiff && diffSummary && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono">
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
              </div>
            )}

            <Badge
              variant="outline"
              className="font-mono text-[10px] h-5 rounded-xs px-1.5 text-muted-foreground"
            >
              {linesCount} lines • {(sizeBytes / 1024).toFixed(1)} KB
            </Badge>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-6.5 text-[11px] gap-1 px-2 border-border/80"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-primary" />
                  <span className="text-primary font-medium">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="size-3" />
                  <span>Copy JSON</span>
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-6.5 text-[11px] gap-1 px-2 border-border/80"
            >
              <Download className="size-3" />
              <span>Download</span>
            </Button>
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

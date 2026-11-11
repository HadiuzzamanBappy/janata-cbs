import { Check, Copy, Database, Download, FileCode, GitCompare, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DiffSummary } from "@/lib/cbs-record";
import { cn } from "@/lib/core-utils";

export type JsonViewerMode = "raw" | "diff" | "output";

export interface JsonViewerToolbarProps {
  title: string;
  linesCount: number;
  sizeBytes: number;
  baselineJsonString: string | null;
  rawJsonString: string | null;
  viewMode: JsonViewerMode;
  onViewModeChange: (mode: JsonViewerMode) => void;
  hasDiff: boolean;
  diffSummary: DiffSummary | null;
  copied: boolean;
  onCopy: () => void;
  onDownload: () => void;
}

export function JsonViewerToolbar({
  title,
  linesCount,
  sizeBytes,
  baselineJsonString,
  rawJsonString,
  viewMode,
  onViewModeChange,
  hasDiff,
  diffSummary,
  copied,
  onCopy,
  onDownload,
}: JsonViewerToolbarProps) {
  return (
    <div className="px-3 py-1.5 border-b border-border/70 flex flex-wrap items-center justify-between gap-2 bg-muted/20 shrink-0 min-w-0">
      {/* Title */}
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
        <Badge
          variant="outline"
          className="font-mono text-[10px] h-6 rounded-xs px-1.5 text-muted-foreground hidden sm:inline-flex"
        >
          {linesCount}L • {(sizeBytes / 1024).toFixed(1)}KB
        </Badge>

        {/* View Mode Toggle: Raw (DB) | Changes (Diff) | Output (Payload) */}
        {baselineJsonString !== null && (
          <div className="inline-flex items-center rounded border border-border/80 bg-muted/40 p-0.5 gap-0.5">
            {rawJsonString !== null && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      onClick={() => onViewModeChange("raw")}
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
                    onClick={() => onViewModeChange("diff")}
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
                    onClick={() => onViewModeChange("output")}
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

        {/* Copy Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={onCopy}
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

        {/* Download Button */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-xs"
                onClick={onDownload}
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
  );
}

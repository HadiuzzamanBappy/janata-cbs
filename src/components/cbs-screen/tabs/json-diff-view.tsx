import { GitCompare } from "lucide-react";
import type { DiffSummary } from "@/lib/cbs-record";
import { cn } from "@/lib/core-utils";
import { renderHighlightedTokens } from "./json-tokenizer";

export interface JsonDiffViewProps {
  diffSummary: DiffSummary;
  hasDiff: boolean;
}

export function JsonDiffView({ diffSummary, hasDiff }: JsonDiffViewProps) {
  if (!hasDiff) {
    return (
      <div className="flex-1 overflow-auto min-h-0 bg-muted/10 font-mono text-[11.5px] select-text">
        <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <GitCompare className="size-8 opacity-30 mb-2" />
          <div className="text-xs font-medium">No Changes Detected</div>
          <div className="text-[11px] text-muted-foreground/75 mt-0.5">
            The working draft is identical to the baseline database record.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto min-h-0 bg-muted/10 font-mono text-[11.5px] select-text">
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
    </div>
  );
}

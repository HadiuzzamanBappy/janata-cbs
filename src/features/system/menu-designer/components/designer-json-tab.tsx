"use client";

import { Check, Copy, Download, FileCode } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serializeMenuTreeToWireJson } from "@/lib/parsers";
import type { MenuTreeRecord } from "@/lib/schemas/menu-designer-schema";

interface DesignerJsonTabProps {
  formData: MenuTreeRecord;
}

export function DesignerJsonTab({ formData }: DesignerJsonTabProps) {
  const [copied, setCopied] = React.useState(false);

  const wirePayload = React.useMemo(() => {
    return serializeMenuTreeToWireJson(formData);
  }, [formData]);

  const jsonString = React.useMemo(() => {
    return JSON.stringify(wirePayload, null, 2);
  }, [wirePayload]);

  const handleCopy = React.useCallback(() => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [jsonString]);

  const handleDownload = React.useCallback(() => {
    const filename = `MENU_TREE_${formData.recordId || "tree"}.json`;
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [formData.recordId, jsonString]);

  const linesCount = jsonString.split("\n").length;
  const sizeBytes = new Blob([jsonString]).size;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden p-2">
      <div className="flex-1 rounded border border-border/80 bg-card flex flex-col overflow-hidden shadow-2xs min-h-0">
        {/* Toolbar Header */}
        <div className="p-2 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary/10 text-primary flex items-center justify-center">
              <FileCode className="size-3" />
            </div>
            <div>
              <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Database Wire Output Payload
              </span>
              <span className="text-[10px] text-muted-foreground font-mono ml-2">
                (SYS_MENU_TREE)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] h-5 rounded px-1.5 text-muted-foreground">
              {linesCount} lines • {(sizeBytes / 1024).toFixed(1)} KB
            </Badge>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="h-6.5 text-[11px] gap-1 px-2 rounded border-border/80"
            >
              {copied ? (
                <>
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">Copied</span>
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
              className="h-6.5 text-[11px] gap-1 px-2 rounded border-border/80"
            >
              <Download className="size-3" />
              <span>Download</span>
            </Button>
          </div>
        </div>

        {/* Code Display Area */}
        <div className="flex-1 overflow-auto min-h-0 bg-muted/10 p-3 font-mono text-[11px] leading-relaxed select-text">
          <pre className="text-foreground/90 whitespace-pre">{jsonString}</pre>
        </div>
      </div>
    </div>
  );
}

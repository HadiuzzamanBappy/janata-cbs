"use client";

import { Check, Copy, Download, FileCode } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface CbsJsonViewerTabProps {
  data: unknown;
  wireTag?: string;
  title?: string;
  filename?: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Pure-React JSON Syntax Highlighting Tokenizer
// ---------------------------------------------------------------------------
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

  // Regex to match:
  // 1. JSON Property key followed by colon: ("key":)
  // 2. String literal value: ("...")
  // 3. Boolean/Null literal: (true|false|null)
  // 4. Number literal: (-?\d+(\.\d+)?)
  // 5. Brackets & punctuation: ({, }, [, ], ,)
  const tokenRegex =
    /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"\s*:)|("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;

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
        <span
          key={`${lineIndex}-k-${match.index}`}
          className="text-blue-700 dark:text-sky-400 font-medium"
        >
          {keyStr}
        </span>,
      );
      parts.push(
        <span key={`${lineIndex}-c-${match.index}`} className="text-zinc-400 dark:text-zinc-500">
          :
        </span>,
      );
    } else if (stringMatch) {
      parts.push(
        <span
          key={`${lineIndex}-s-${match.index}`}
          className="text-emerald-700 dark:text-emerald-400"
        >
          {stringMatch}
        </span>,
      );
    } else if (boolMatch) {
      if (boolMatch === "null") {
        parts.push(
          <span
            key={`${lineIndex}-n-${match.index}`}
            className="text-rose-600 dark:text-rose-400 italic font-semibold"
          >
            {boolMatch}
          </span>,
        );
      } else {
        parts.push(
          <span
            key={`${lineIndex}-b-${match.index}`}
            className="text-purple-700 dark:text-purple-400 font-semibold"
          >
            {boolMatch}
          </span>,
        );
      }
    } else if (numberMatch) {
      parts.push(
        <span
          key={`${lineIndex}-num-${match.index}`}
          className="text-amber-800 dark:text-amber-400 font-semibold"
        >
          {numberMatch}
        </span>,
      );
    } else if (punctMatch) {
      parts.push(
        <span key={`${lineIndex}-p-${match.index}`} className="text-zinc-500 dark:text-zinc-400">
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

  return (
    <div key={lineIndex} className="leading-5 whitespace-pre">
      {indent}
      {parts}
    </div>
  );
}

export function CbsJsonViewerTab({
  data,
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

  const lineObjects = React.useMemo(
    () => jsonString.split("\n").map((text, idx) => ({ num: idx + 1, text })),
    [jsonString],
  );
  const linesCount = lineObjects.length;
  const sizeBytes = React.useMemo(() => new Blob([jsonString]).size, [jsonString]);

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
    <div className={`flex-1 flex flex-col min-h-0 bg-background overflow-hidden p-0 ${className}`}>
      <div className="flex-1 rounded border border-border/80 bg-card flex flex-col overflow-hidden shadow-2xs min-h-0">
        {/* Toolbar Header */}
        <div className="p-2 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary/10 text-primary flex items-center justify-center">
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
            <Badge
              variant="outline"
              className="font-mono text-[10px] h-5 rounded px-1.5 text-muted-foreground"
            >
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

        {/* Code Display Area with Theme-Aware Syntax Highlighting & Line Gutter */}
        <div className="flex-1 overflow-auto min-h-0 bg-zinc-50 dark:bg-zinc-950 p-3 font-mono text-[11.5px] select-text transition-colors selection:bg-primary/20 selection:text-primary dark:selection:bg-primary/30 dark:selection:text-primary">
          <div className="flex min-w-full">
            {/* Line numbers gutter */}
            <div className="select-none text-right pr-3.5 text-zinc-400 dark:text-zinc-600 font-mono text-[11px] border-r border-zinc-200 dark:border-zinc-800/80 mr-3.5 shrink-0">
              {lineObjects.map((line) => (
                <div key={`gutter-${line.num}`} className="leading-5">
                  {line.num}
                </div>
              ))}
            </div>

            {/* Syntax highlighted code */}
            <div className="flex-1 font-mono overflow-x-auto text-zinc-800 dark:text-zinc-200">
              {lineObjects.map((line) => renderJsonLine(line.text, line.num))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

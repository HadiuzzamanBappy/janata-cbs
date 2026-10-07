"use client";

import { Check, Copy, Download, FileCode } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { serializeUserGroupToWireJson } from "@/lib/parsers";
import type { UserGroupRecord } from "@/lib/schemas/user-group-schema";

interface UserGroupJsonTabProps {
  formData: UserGroupRecord;
}

export function UserGroupJsonTab({ formData }: UserGroupJsonTabProps) {
  const [copied, setCopied] = React.useState(false);

  const jsonString = React.useMemo(() => {
    const wire = serializeUserGroupToWireJson(formData);
    return JSON.stringify(wire, null, 2);
  }, [formData]);

  const lineCount = React.useMemo(() => {
    return jsonString.split("\n").length;
  }, [jsonString]);

  const byteSize = React.useMemo(() => {
    return new Blob([jsonString]).size;
  }, [jsonString]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-group-${formData.recordId || "draft"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-card/60 border border-border/80 rounded-lg overflow-hidden m-2">
      {/* JSON Viewer Toolbar */}
      <div className="p-2 border-b border-border/70 flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">
            Canonical Wire Payload
          </span>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
            SYS_USER_GROUP
          </Badge>
          <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0 text-muted-foreground">
            {lineCount} lines • {byteSize} B
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-6 text-[10px] px-2 gap-1 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="size-3 text-emerald-500" />
                <span className="text-emerald-500">Copied</span>
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
            className="h-6 text-[10px] px-2 gap-1 cursor-pointer"
          >
            <Download className="size-3" />
            <span>Download</span>
          </Button>
        </div>
      </div>

      {/* JSON Code Area */}
      <div className="flex-1 overflow-auto p-3 bg-muted/20 font-mono text-xs leading-relaxed text-foreground select-text">
        <pre className="m-0 font-mono">{jsonString}</pre>
      </div>
    </div>
  );
}

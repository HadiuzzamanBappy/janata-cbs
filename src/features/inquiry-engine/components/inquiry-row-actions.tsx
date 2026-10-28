"use client";

import { Eye, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EnquiryRow, INQCmd } from "@/lib/data-schemas/inquiry-config-schema";
import { executeInquiryCommand } from "../utils/command-resolver";

export interface InquiryRowActionsProps {
  commands: INQCmd[];
  row: EnquiryRow;
}

export function InquiryRowActions({ commands, row }: InquiryRowActionsProps) {
  if (!commands || commands.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {commands.map((cmd) => {
        const isView =
          cmd.cmdButton.toLowerCase().includes("view") ||
          cmd.cmdButton.toLowerCase().includes("see");
        return (
          <Button
            key={`${cmd.cmdButton}:${cmd.cmdFor}`}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-[11px] font-medium gap-1 hover:bg-primary/10 hover:text-primary hover:border-primary/40"
            onClick={() => executeInquiryCommand(cmd, row)}
            title={cmd.cmdFor}
          >
            {isView ? <Eye className="size-3" /> : <Play className="size-3" />}
            <span>{cmd.cmdButton}</span>
          </Button>
        );
      })}
    </div>
  );
}

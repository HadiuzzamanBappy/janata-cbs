"use client";

import { Eye, Play } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { EnquiryRow, INQCmd } from "@/lib/data-schemas/inquiry-config-schema";
import { executeInquiryCommand } from "../utils/command-resolver";

export interface InquiryRowActionsProps {
  commands: INQCmd[];
  row: EnquiryRow;
}

export function InquiryRowActions({ commands, row }: InquiryRowActionsProps) {
  if (!commands || commands.length === 0) return null;

  return (
    <div className="flex items-center gap-1 justify-center">
      {commands.map((cmd) => {
        const isView =
          cmd.cmdButton.toLowerCase().includes("view") ||
          cmd.cmdButton.toLowerCase().includes("see") ||
          cmd.cmdButton.toLowerCase().includes("show");

        return (
          <Tooltip key={`${cmd.cmdButton}:${cmd.cmdFor}`}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => executeInquiryCommand(cmd, row)}
                  title={`${cmd.cmdButton} (${cmd.cmdFor})`}
                  className="inline-flex items-center justify-center size-5.5 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {isView ? <Eye className="size-3" /> : <Play className="size-3" />}
                </button>
              }
            />
            <TooltipContent className="text-xs font-mono">
              {cmd.cmdButton} ({cmd.cmdFor})
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

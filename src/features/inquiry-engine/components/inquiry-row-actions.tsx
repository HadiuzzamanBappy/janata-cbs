"use client";

import { Eye, Pencil, Play, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { EnquiryRow, INQCmd } from "@/lib/data-schemas/inquiry-config-schema";
import { executeInquiryCommand, resolveCommandTemplate } from "../utils/command-resolver";

export interface InquiryRowActionsProps {
  commands: INQCmd[];
  row: EnquiryRow;
}

export function InquiryRowActions({ commands, row }: InquiryRowActionsProps) {
  if (!commands || commands.length === 0) return null;

  return (
    <div className="flex items-center gap-1 justify-center">
      {commands.map((cmd) => {
        const btnLower = cmd.cmdButton.toLowerCase();
        const isView =
          btnLower.includes("view") || btnLower.includes("see") || btnLower.includes("show");
        const isEdit =
          btnLower.includes("edit") || btnLower.includes("input") || btnLower.includes("modify");
        const isAuth =
          btnLower.includes("auth") || btnLower.includes("check") || btnLower.includes("approve");

        const icon = isView ? (
          <Eye className="size-3" />
        ) : isEdit ? (
          <Pencil className="size-3" />
        ) : isAuth ? (
          <ShieldCheck className="size-3 text-amber-500" />
        ) : (
          <Play className="size-3" />
        );

        const executable = resolveCommandTemplate(cmd.cmdFor, row);

        return (
          <Tooltip key={`${cmd.cmdButton}:${cmd.cmdFor}`}>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  onClick={() => executeInquiryCommand(cmd, row)}
                  data-cbs-command={executable}
                  className="inline-flex items-center justify-center size-5.5 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                >
                  {icon}
                </button>
              }
            />
            <TooltipContent className="text-xs font-medium">{cmd.cmdButton}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
}

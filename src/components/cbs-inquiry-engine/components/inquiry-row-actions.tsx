"use client";

import { Eye, Pencil, Play, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { executeInquiryCommand, resolveCommandTemplate } from "@/lib/cbs-inquiry-spec";
import type { EnquiryRow, INQCmd } from "@/lib/data-schemas";

export interface InquiryRowActionsProps {
  commands: INQCmd[];
  row: EnquiryRow;
  cmdFromInternal?: boolean;
  cmdFieldName?: string;
}

export function InquiryRowActions({
  commands,
  row,
  cmdFromInternal = false,
  cmdFieldName = "",
}: InquiryRowActionsProps) {
  const hasInternalCmd = Boolean(cmdFromInternal && cmdFieldName && row[cmdFieldName]);

  if ((!commands || commands.length === 0) && !hasInternalCmd) return null;

  if (commands.length === 0 && hasInternalCmd) {
    const rawCmd = String(row[cmdFieldName]).trim();
    const executable = resolveCommandTemplate(rawCmd, row);

    return (
      <div className="flex items-center gap-1 justify-center">
        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                onClick={() =>
                  executeInquiryCommand(
                    { cmdButton: "Open", cmdFor: rawCmd },
                    row,
                    cmdFromInternal,
                    cmdFieldName,
                  )
                }
                data-cbs-command={executable}
                data-cbs-link-handled="true"
                className="inline-flex items-center justify-center size-5.5 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <Play className="size-3 text-primary" />
              </button>
            }
          />
          <TooltipContent className="text-xs font-medium">
            Open: {executable || rawCmd}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

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
                  onClick={() => executeInquiryCommand(cmd, row, cmdFromInternal, cmdFieldName)}
                  data-cbs-command={executable}
                  data-cbs-link-handled="true"
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

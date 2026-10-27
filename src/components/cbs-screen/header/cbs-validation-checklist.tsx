"use client";

import { AlertTriangle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CbsScreenValidationError } from "@/lib/cbs-screen";
import { focusFormField } from "@/lib/cbs-screen";

export interface CbsValidationChecklistProps<TTab extends string = string> {
  errors: CbsScreenValidationError<TTab>[];
  onSelectTab?: (tab: TTab) => void;
}

export function CbsValidationChecklist<TTab extends string = string>({
  errors,
  onSelectTab,
}: CbsValidationChecklistProps<TTab>) {
  if (errors.length === 0) return null;

  const jumpToError = (err: CbsScreenValidationError<TTab>) => {
    if (err.tab) onSelectTab?.(err.tab);
    focusFormField(err.fieldKey, err.nodeId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 font-semibold animate-pulse shadow-xs cursor-pointer shrink-0"
          >
            <AlertTriangle className="size-3.5 shrink-0" />
            <span>
              {errors.length} Issue{errors.length > 1 ? "s" : ""}
            </span>
            <ChevronDown className="size-3 opacity-75 shrink-0" />
          </Button>
        }
      />
      <DropdownMenuContent
        align="end"
        className="w-84 p-1 shadow-lg bg-popover border border-destructive/30"
      >
        <div className="text-xs font-semibold px-2 py-1.5 flex items-center justify-between text-destructive bg-destructive/5 rounded-t-sm">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-destructive" />
            <span>Validation Checklist</span>
            <Badge
              variant="destructive"
              className="text-[10px] h-4 px-1 rounded-xs font-mono ml-0.5"
            >
              {errors.length}
            </Badge>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              jumpToError(errors[0]);
            }}
            className="h-5 px-1.5 text-[10px] font-semibold shadow-none cursor-pointer"
          >
            Fix First →
          </Button>
        </div>
        <DropdownMenuSeparator className="my-1" />
        <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
          {errors.map((err) => (
            <DropdownMenuItem
              key={err.id}
              onClick={() => jumpToError(err)}
              className="px-2 py-1.5 text-xs cursor-pointer flex flex-col items-start gap-0.5 rounded-sm hover:bg-destructive/10"
            >
              <div className="flex items-center gap-1.5 w-full">
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono h-4 px-1 rounded-xs uppercase tracking-wider text-muted-foreground border-border/80"
                >
                  {err.tab}
                </Badge>
                <span className="font-semibold text-foreground text-[11px] truncate flex-1">
                  {err.fieldKey}
                </span>
              </div>
              <span className="text-[11px] text-destructive leading-tight">{err.message}</span>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

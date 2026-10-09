"use client";

import { AlertTriangle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CbsScreenValidationError } from "../types";

export interface CbsValidationChecklistProps<TTab extends string = string> {
  errors: CbsScreenValidationError<TTab>[];
  onSelectTab: (tab: TTab) => void;
}

export function CbsValidationChecklist<TTab extends string = string>({
  errors,
  onSelectTab,
}: CbsValidationChecklistProps<TTab>) {
  if (errors.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-7 px-2.5 text-xs gap-1.5 rounded font-semibold animate-pulse shadow-xs cursor-pointer shrink-0"
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
        className="w-84 rounded-md p-1 shadow-lg bg-popover border border-destructive/30"
      >
        <DropdownMenuLabel className="text-xs font-semibold px-2 py-1.5 flex items-center justify-between text-destructive bg-destructive/5 rounded-t">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-3.5 text-destructive" />
            <span>Validation Checklist</span>
            <Badge variant="destructive" className="text-[10px] h-4 px-1 rounded font-mono ml-0.5">
              {errors.length}
            </Badge>
          </div>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => {
              const first = errors[0];
              if (first) {
                if (first.tab) onSelectTab?.(first.tab);
                const el =
                  document.getElementById(first.fieldKey) ||
                  document.querySelector(`[name="${first.fieldKey}"]`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  (el as HTMLElement).focus?.();
                }
              }
            }}
            className="h-5 px-1.5 text-[10px] font-semibold rounded shadow-none cursor-pointer"
          >
            Fix First →
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        <div className="max-h-64 overflow-y-auto divide-y divide-border/40">
          {errors.map((err) => (
            <DropdownMenuItem
              key={err.id}
              onClick={() => {
                if (err.tab) onSelectTab?.(err.tab);
                const el =
                  document.getElementById(err.fieldKey) ||
                  document.querySelector(`[name="${err.fieldKey}"]`);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  (el as HTMLElement).focus?.();
                }
              }}
              className="px-2 py-1.5 text-xs cursor-pointer flex flex-col items-start gap-0.5 rounded hover:bg-destructive/10"
            >
              <div className="flex items-center gap-1.5 w-full">
                <Badge
                  variant="outline"
                  className="text-[9px] font-mono h-4 px-1 rounded uppercase tracking-wider text-muted-foreground border-border/80"
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

"use client";

import { ChevronDown, Plus, X } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/core-utils";

export interface RecordLookupBarProps {
  inputVal: string;
  onInputChange: (val: string) => void;
  onClear: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  onSelectRecord: (id: string) => void;
  onCreateNew?: () => void;
  matchingItems: Array<{ id: string; label?: string; details?: string }>;
  isDropdownOpen: boolean;
  onDropdownOpenChange: (open: boolean) => void;
  hasSearched: boolean;
  submitting?: boolean;
  loadingItems?: boolean;
  canCreate?: boolean;
}

/**
 * Record ID lookup bar with inline autocomplete dropdown and create-new (+) button.
 */
export function RecordLookupBar({
  inputVal,
  onInputChange,
  onClear,
  onSubmit,
  onSelectRecord,
  onCreateNew,
  matchingItems,
  isDropdownOpen,
  onDropdownOpenChange,
  hasSearched,
  submitting = false,
  loadingItems = false,
  canCreate = true,
}: RecordLookupBarProps) {
  return (
    <div className="flex items-center gap-1">
      <form onSubmit={onSubmit} className="relative flex items-center">
        <Input
          type="text"
          placeholder="Record ID..."
          value={inputVal}
          onChange={(e) => onInputChange(e.target.value)}
          className={cn(
            "h-7 w-36 sm:w-48 text-xs font-mono rounded bg-background border-border/80 focus-visible:bg-background",
            inputVal ? "pr-7" : "pr-2",
          )}
        />

        {inputVal && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="absolute right-1.5 inset-y-0 my-auto size-5 flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/60 transition-colors rounded cursor-pointer z-10"
            aria-label="Clear input"
          >
            <X className="size-3" />
          </button>
        )}
      </form>

      <DropdownMenu open={isDropdownOpen} onOpenChange={onDropdownOpenChange}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-7 rounded bg-background border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/50 shadow-xs shrink-0 cursor-pointer"
              aria-label="Toggle matching records"
            >
              <ChevronDown className="size-3.5" />
            </Button>
          }
        />

        <DropdownMenuContent
          side="bottom"
          align="end"
          sideOffset={8}
          alignOffset={-4}
          className="w-56 max-h-56 overflow-auto text-xs p-1 rounded shadow-lg border border-border/80 bg-popover"
        >
          <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/40 mb-1 flex items-center justify-between">
            <span>Matching IDs ({matchingItems.length})</span>
            {loadingItems && (
              <span className="animate-pulse text-[9px] lowercase font-normal">fetching...</span>
            )}
          </div>
          {loadingItems && matchingItems.length === 0 ? (
            <div className="p-2.5 text-muted-foreground font-mono text-center text-xs animate-pulse">
              Loading records...
            </div>
          ) : matchingItems.length === 0 ? (
            <div className="p-2 text-muted-foreground font-mono text-center text-xs">
              {hasSearched ? "No matching records" : "Type to filter"}
            </div>
          ) : (
            matchingItems.map((item) => (
              <DropdownMenuItem
                key={item.id}
                onClick={() => onSelectRecord(item.id)}
                className="font-mono text-xs py-1.5 px-2 cursor-pointer hover:bg-muted/80 rounded flex items-center font-semibold text-foreground"
              >
                {item.id}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <TooltipProvider delay={150}>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="default"
                size="icon-sm"
                onClick={() => onCreateNew?.()}
                disabled={!onCreateNew || submitting || !canCreate}
                className="size-7 rounded shadow-xs shrink-0"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
              </Button>
            }
          />
          <TooltipContent className="text-xs">
            {!canCreate ? "Requires Input ('I') permission" : "Create New Record (+)"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

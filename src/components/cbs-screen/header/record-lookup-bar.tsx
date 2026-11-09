"use client";

import { ChevronDown, Loader2, Plus, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { RecordLookupItem } from "@/lib/cbs-screen";
import { cn } from "@/lib/core-utils";
import { ActionBtn } from "./action-btn";

export interface RecordLookupBarProps {
  inputVal: string;
  onInputChange: (val: string) => void;
  onClear: () => void;
  onSubmit: (e?: React.FormEvent) => void;
  onSelectRecord: (id: string) => void;
  onCreateNew?: () => void;
  matchingItems: RecordLookupItem[];
  isDropdownOpen: boolean;
  onDropdownOpenChange: (open: boolean) => void;
  hasSearched: boolean;
  submitting?: boolean;
  loadingItems?: boolean;
  generatingId?: boolean;
  canCreate?: boolean;
}

/**
 * Record ID lookup bar with inline autocomplete dropdown and create-new (+) button.
 * Enforces CBS 3-Action Workflow:
 * 1. Enter key -> Triggers Mode 'I' search/load.
 * 2. Chevron down -> Requests sorted SBI record ID list from backend. Selecting an item sets input field and awaits user prompt.
 * 3. '+' Button -> Requests Next Sequence ID ('GNI') and opens in Mode 'I'.
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
  generatingId = false,
  canCreate = true,
}: RecordLookupBarProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const canExecuteCreate = Boolean(onCreateNew && !submitting && !generatingId && canCreate);

  return (
    <div className="flex items-center gap-1">
      {/* Action 1: Text Input with Enter-to-Submit */}
      <form onSubmit={onSubmit} className="relative flex items-center">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Record ID..."
          value={inputVal}
          onChange={(e) => onInputChange(e.target.value)}
          className={cn(
            "h-7 w-36 sm:w-48 text-xs font-mono bg-background border-border/80 focus-visible:bg-background",
            inputVal ? "pr-7" : "pr-2",
          )}
        />

        {inputVal && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClear();
            }}
            className="absolute right-1 inset-y-0 my-auto size-5 text-muted-foreground hover:text-foreground z-10"
            aria-label="Clear input"
          >
            <X className="size-3" />
          </Button>
        )}
      </form>

      {/* Action 2: Dropdown Trigger & Sorted Record List */}
      <DropdownMenu open={isDropdownOpen} onOpenChange={onDropdownOpenChange}>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="size-7 bg-background border-border/80 text-muted-foreground hover:text-foreground shadow-xs shrink-0 cursor-pointer"
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
          className="w-56 max-h-56 overflow-auto text-xs p-1 shadow-lg border border-border/80 bg-popover"
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
                onClick={() => {
                  onSelectRecord(item.id);
                  inputRef.current?.focus();
                }}
                className="font-mono text-xs py-1.5 px-2 cursor-pointer hover:bg-muted/80 flex items-center font-semibold text-foreground"
              >
                {item.id}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action 3: New Record (+) Button via canonical ActionBtn */}
      <ActionBtn
        onClick={onCreateNew}
        enabled={canExecuteCreate}
        reason={
          generatingId
            ? "Allocating Sequence (N)..."
            : !canCreate
              ? "Requires Input ('I') permission"
              : undefined
        }
        defaultTooltip="Create New Record (N / +)"
        className="size-7"
      >
        {generatingId ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Plus className="size-3.5 stroke-[2.5]" />
        )}
      </ActionBtn>
    </div>
  );
}

"use client";

import { ChevronDown, Lock, Plus, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserRights } from "@/hooks";
import { cn } from "@/lib/utils";
import { ActionButtons } from "./action-buttons";
import { ActionMoreMenu, type MoreActionItem } from "./action-more-menu";

export type { MoreActionItem };

export interface CbsFormHeaderProps {
  title: string;
  commandCode?: string;
  recordId?: string;
  onRecordIdChange?: (id: string) => void;
  onRecordSearch?: (id: string) => void;
  onReset?: () => void;
  onSubmit?: () => void;
  onHold?: () => void;
  onDelete?: () => void;
  onValidate?: () => void;
  onAmend?: () => void;
  onView?: () => void;
  onPerformAction?: () => void;
  onAuthorizeReverse?: () => void;
  onProcessAction?: () => void;
  onReturnToSearch?: () => void;
  onCreateNew?: () => void;
  mode?: "IDLE" | "CREATE" | "EDIT" | "VIEW";
  submitting?: boolean;
  moreActions?: MoreActionItem[];
  availableItems?: Array<{ id: string; label?: string; details?: string }>;
  className?: string;
}

export function CbsFormHeader({
  title,
  commandCode,
  recordId = "",
  onRecordIdChange,
  onRecordSearch,
  onReset,
  onSubmit,
  onHold,
  onDelete,
  onValidate,
  onAmend,
  onView,
  onPerformAction,
  onAuthorizeReverse,
  onProcessAction,
  onReturnToSearch,
  onCreateNew,
  mode = "IDLE",
  submitting = false,
  moreActions = [],
  availableItems = [],
  className = "",
}: CbsFormHeaderProps) {
  const rights = useUserRights();
  const [inputVal, setInputVal] = React.useState(recordId);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<
    Array<{ id: string; label?: string; details?: string }>
  >([]);
  const [hasSearched, setHasSearched] = React.useState(false);

  React.useEffect(() => {
    setInputVal(recordId);
  }, [recordId]);

  // Demo fallback items if availableItems isn't provided by parent
  const demoItems = React.useMemo(() => {
    if (availableItems.length > 0) return availableItems;
    const prefix = commandCode || "REC";
    return [
      { id: `${prefix}-1001`, label: "Primary Active Record", details: "Status: Live | Auth: YES" },
      {
        id: `${prefix}-1002`,
        label: "Corporate Account Holder",
        details: "Status: Live | Auth: YES",
      },
      { id: `${prefix}-1003`, label: "Retail Term Deposit", details: "Status: Pending | Auth: NO" },
      {
        id: `${prefix}-1004`,
        label: "Special Clearing Facility",
        details: "Status: Closed | Auth: YES",
      },
    ];
  }, [availableItems, commandCode]);

  const handlePerformSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputVal.trim().toLowerCase();

    const matches = query
      ? demoItems.filter(
          (item) =>
            item.id.toLowerCase().includes(query) ||
            item.label?.toLowerCase().includes(query) ||
            item.details?.toLowerCase().includes(query),
        )
      : demoItems;

    setSearchResults(matches);
    setHasSearched(true);
    setIsDropdownOpen(true);
  };

  const handleSelectRecord = (id: string) => {
    setInputVal(id);
    setIsDropdownOpen(false);
    if (onRecordIdChange) onRecordIdChange(id);
    if (onRecordSearch) onRecordSearch(id);
  };

  const handleClearRecord = () => {
    setInputVal("");
    setSearchResults([]);
    setHasSearched(false);
    if (onRecordIdChange) onRecordIdChange("");
    if (onReset) onReset();
  };

  const handleInputChange = (val: string) => {
    setInputVal(val);
    if (onRecordIdChange) onRecordIdChange(val);
  };

  const matchingItemsToDisplay = hasSearched
    ? searchResults
    : inputVal.trim()
      ? demoItems.filter((item) => item.id.toLowerCase().includes(inputVal.trim().toLowerCase()))
      : demoItems;

  return (
    <TooltipProvider delay={150}>
      <header
        className={`sticky top-0 z-20 bg-muted/40 border-b border-border/80 select-none ${className}`}
      >
        {/* ROW 1: Minimalist CBS Action Toolbar */}
        <div className="flex items-center gap-1.5 px-2 py-1 border-b border-border/50 bg-background/90 text-xs">
          {/* Action Icons Toolbar (Edit, View, Perform, Commit, Reverse, etc.) */}
          <ActionButtons
            mode={mode}
            searchVal={inputVal}
            onSearchChange={handleInputChange}
            onSearchSubmit={handlePerformSearch}
            onSelectRecord={handleSelectRecord}
            matchingItems={matchingItemsToDisplay}
            isDropdownOpen={isDropdownOpen}
            onDropdownOpenChange={setIsDropdownOpen}
            hasSearched={hasSearched}
            submitting={submitting}
            onCreateNew={onCreateNew}
            onAmend={onAmend}
            onView={onView}
            onPerformAction={onPerformAction}
            onSubmit={onSubmit}
            onValidate={onValidate}
            onHold={onHold}
            onDelete={onDelete}
            onAuthorizeReverse={onAuthorizeReverse}
            onProcessAction={onProcessAction}
            onReturnToSearch={onReturnToSearch}
            onReset={onReset}
          />

          <span className="h-4 w-px bg-border/60 mx-1" />

          {/* More Actions Dropdown & Dedicated CTA */}
          <div className="flex items-center gap-1">
            <ActionMoreMenu moreActions={moreActions} submitting={submitting} onSubmit={onSubmit} />
          </div>
        </div>

        {/* ROW 2: CBS Record Header: Label + Record ID Field + Add Button */}
        <div className="flex items-center gap-2 px-2.5 py-1 text-xs bg-muted/20">
          <span className="font-semibold text-foreground/90 text-xs tracking-tight shrink-0 whitespace-nowrap">
            {title || "Basic Details"}
          </span>

          {/* Record Key Box / Input */}
          {mode === "IDLE" ? (
            <div className="flex items-center gap-1">
              <div className="relative flex items-center">
                <form onSubmit={handlePerformSearch} className="relative flex items-center">
                  <Input
                    type="text"
                    placeholder="Record ID..."
                    value={inputVal}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className={cn(
                      "h-7 w-36 sm:w-48 text-xs font-mono rounded bg-background border-border/80 focus-visible:bg-background",
                      inputVal ? "pr-12" : "pr-6",
                    )}
                  />

                  {/* Clear Input Button (visible when input has text) */}
                  {inputVal && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearRecord();
                      }}
                      className="absolute right-5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors p-0.5 rounded cursor-pointer z-10"
                      aria-label="Clear input"
                    >
                      <X className="size-3" />
                    </button>
                  )}

                  {/* Dropdown Menu attached cleanly to the Chevron button */}
                  <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          className="absolute right-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors p-0.5 rounded cursor-pointer z-10"
                          aria-label="Toggle matching records"
                        >
                          <ChevronDown className="size-3" />
                        </button>
                      }
                    />

                    <DropdownMenuContent
                      side="bottom"
                      align="end"
                      sideOffset={8}
                      alignOffset={-4}
                      className="w-48 max-h-56 overflow-auto text-xs p-1 shadow-lg border border-border/80"
                    >
                      <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40 mb-1">
                        Matching IDs ({matchingItemsToDisplay.length})
                      </div>
                      {matchingItemsToDisplay.length === 0 ? (
                        <div className="p-2 text-muted-foreground font-mono text-center text-xs">
                          {hasSearched ? "No matching records" : "Type to filter"}
                        </div>
                      ) : (
                        matchingItemsToDisplay.map((item) => (
                          <DropdownMenuItem
                            key={item.id}
                            onClick={() => handleSelectRecord(item.id)}
                            className="font-mono text-xs font-semibold py-1.5 px-2 cursor-pointer hover:bg-muted/80 rounded"
                          >
                            {item.id}
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </form>
              </div>

              {/* Add / Create New Record (+) button matching row 1 button styling */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="default"
                      size="icon-sm"
                      onClick={() => onCreateNew?.()}
                      disabled={!onCreateNew || submitting || !rights.canInput}
                      className="size-7 rounded shadow-xs shrink-0"
                    >
                      <Plus className="size-3.5 stroke-[2.5]" />
                    </Button>
                  }
                />
                <TooltipContent className="text-xs">
                  {!rights.canInput ? "Requires Input ('I') permission" : "Create New Record (+)"}
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            /* Active Mode (CREATE / EDIT / VIEW): Locked Record ID Badge */
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-border bg-background text-foreground shrink-0 shadow-2xs flex items-center gap-1.5">
                <Lock className="size-3 text-muted-foreground" />
                {inputVal.trim() ||
                  (mode === "CREATE" ? "NEW" : commandCode ? `[${commandCode}]` : "---")}
              </span>
              <span className="text-[9px] font-mono px-1 py-0 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 font-medium">
                {mode}
              </span>
            </div>
          )}

          {commandCode && (
            <span className="text-[10px] font-mono text-muted-foreground uppercase ml-auto">
              {commandCode}
            </span>
          )}
        </div>
      </header>
    </TooltipProvider>
  );
}

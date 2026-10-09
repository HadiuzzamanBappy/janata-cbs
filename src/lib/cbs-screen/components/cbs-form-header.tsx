"use client";

import { Lock } from "lucide-react";
import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useUserRights } from "@/hooks";
import type { CbsScreenMode, CbsScreenValidationError } from "../types";
import { ActionButtons } from "./action-buttons";
import { ActionMoreMenu, type MoreActionItem } from "./action-more-menu";
import { CbsValidationChecklist } from "./cbs-validation-checklist";
import { RecordLookupBar } from "./record-lookup-bar";

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
  mode?: CbsScreenMode;
  submitting?: boolean;
  moreActions?: MoreActionItem[];
  availableItems?: Array<{ id: string; label?: string; details?: string }>;
  validationErrors?: CbsScreenValidationError[];
  onSelectValidationTab?: (tab: string) => void;
  className?: string;
}

/**
 * Standard header toolbar for Core Banking forms.
 * Manages action triggers, record search bar, and validation drawer.
 */
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
  validationErrors = [],
  onSelectValidationTab,
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
    if (query && onRecordSearch) {
      onRecordSearch(query.toUpperCase());
    }
  };

  const handleSelectRecord = (id: string) => {
    setInputVal(id);
    setIsDropdownOpen(false);
    if (onRecordIdChange) onRecordIdChange(id);
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
          <ActionButtons
            mode={mode}
            searchVal={inputVal}
            submitting={submitting}
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
          />

          <span className="h-4 w-px bg-border/60 mx-1" />

          {/* More Actions Dropdown & Dedicated CTA */}
          <div className="flex items-center gap-1">
            <ActionMoreMenu moreActions={moreActions} submitting={submitting} onSubmit={onSubmit} />
          </div>

          {/* Validation Checklist Indicator & Drawer */}
          {validationErrors.length > 0 && (
            <>
              <span className="h-4 w-px bg-border/60 mx-1" />
              <CbsValidationChecklist
                errors={validationErrors}
                onSelectTab={(tab) => onSelectValidationTab?.(tab)}
              />
            </>
          )}
        </div>

        {/* ROW 2: CBS Record Header: Label + Record ID Field + Add Button */}
        <div className="flex items-center gap-2 px-2.5 py-1 text-xs bg-muted/20">
          <span className="font-semibold text-foreground/90 text-xs tracking-tight shrink-0 whitespace-nowrap">
            {title || "Basic Details"}
          </span>

          {mode === "IDLE" ? (
            <RecordLookupBar
              inputVal={inputVal}
              onInputChange={handleInputChange}
              onClear={handleClearRecord}
              onSubmit={handlePerformSearch}
              onSelectRecord={handleSelectRecord}
              onCreateNew={onCreateNew}
              matchingItems={matchingItemsToDisplay}
              isDropdownOpen={isDropdownOpen}
              onDropdownOpenChange={setIsDropdownOpen}
              hasSearched={hasSearched}
              submitting={submitting}
              canCreate={rights.canInput}
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border border-border bg-background text-foreground shrink-0 shadow-2xs flex items-center gap-1.5">
                <Lock className="size-3 text-muted-foreground" />
                {inputVal.trim() ||
                  (mode === "I" && !inputVal.trim()
                    ? "NEW"
                    : commandCode
                      ? `[${commandCode}]`
                      : "---")}
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

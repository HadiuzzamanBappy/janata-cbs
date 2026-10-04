"use client";

import { FileText } from "lucide-react";
import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ActionButtons } from "./actions/action-buttons";
import { ActionMoreMenu, type MoreActionItem } from "./actions/action-more-menu";

export type { MoreActionItem };

export interface FormHeaderProps {
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

export function FormHeader({
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
}: FormHeaderProps) {
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

  // 1. User inputs any ID, then presses search button / submits search (or clicks chevron down)
  const handlePerformSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputVal.trim().toLowerCase();

    // If query is present, filter matching entries. If empty, show all available items.
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

    if (onRecordSearch && query) {
      onRecordSearch(query);
    }
  };

  // 2. User selects a record from the matching results:
  // ONLY stages the selected ID into the input field without immediate execution.
  const handleSelectRecord = (id: string) => {
    setInputVal(id);
    if (onRecordIdChange) onRecordIdChange(id);
    setIsDropdownOpen(false);
  };

  // 3. User types manually:
  const handleInputChange = (val: string) => {
    setInputVal(val);
    if (onRecordIdChange) onRecordIdChange(val);
  };

  // When dropdown is triggered: display matched items if user queried, or all items if field is empty
  const matchingItemsToDisplay = hasSearched
    ? searchResults
    : inputVal.trim()
      ? demoItems.filter((item) => item.id.toLowerCase().includes(inputVal.trim().toLowerCase()))
      : demoItems;

  return (
    <TooltipProvider delay={150}>
      <div
        className={`sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0 ${className}`}
      >
        {/* Left Title & Command Code Block (Mirrors Enquiry Header Layout) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FileText className="size-3.5" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-xs sm:text-sm font-bold tracking-tight text-foreground whitespace-nowrap leading-tight">
              {title}
            </h2>
            {commandCode && (
              <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
                {commandCode}
              </span>
            )}
          </div>
        </div>

        {/* Right Section: All Actions + More Actions presented together on the right */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          {/* Action Buttons Toolbar (Switches between State 1: IDLE and State 2: ACTIVE) */}
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

          <div className="h-4 w-px bg-border/60 mx-0.5" />

          {/* More Actions Dropdown & Dedicated CTA */}
          <div className="flex items-center gap-1.5">
            <ActionMoreMenu moreActions={moreActions} submitting={submitting} onSubmit={onSubmit} />
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

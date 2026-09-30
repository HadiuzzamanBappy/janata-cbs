"use client";

import { Search } from "lucide-react";
import * as React from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
  onCreateNew?: () => void;
  mode?: "IDLE" | "CREATE" | "EDIT";
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
  onCreateNew,
  mode: _mode = "IDLE",
  submitting = false,
  moreActions = [],
  availableItems = [],
  className = "",
}: FormHeaderProps) {
  const [inputVal, setInputVal] = React.useState(recordId);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<Array<{ id: string; label?: string; details?: string }>>([]);
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
      { id: `${prefix}-1002`, label: "Corporate Account Holder", details: "Status: Live | Auth: YES" },
      { id: `${prefix}-1003`, label: "Retail Term Deposit", details: "Status: Pending | Auth: NO" },
      { id: `${prefix}-1004`, label: "Special Clearing Facility", details: "Status: Closed | Auth: YES" },
    ];
  }, [availableItems, commandCode]);

  // 1. User inputs any ID, then presses search button / submits search
  const handlePerformSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputVal.trim().toLowerCase();
    
    // Find all matching entries
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

    // Also inform parent of search callback if needed for async backend searching
    if (onRecordSearch && query) {
      onRecordSearch(query);
    }
  };

  // 2. User selects a record from the matching results:
  // ONLY stages the selected ID into the input field. Does NOT act/open form immediately!
  const handleSelectRecord = (id: string) => {
    setInputVal(id);
    if (onRecordIdChange) onRecordIdChange(id);
    setIsDropdownOpen(false);
  };

  // 3. User types manually:
  // Stages the ID directly without immediate action
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    if (onRecordIdChange) onRecordIdChange(val);
  };

  return (
    <TooltipProvider delay={150}>
      <div
        className={`sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 ${className}`}
      >
        {/* Left: Screen Title & Record Key Search Input with Results Popover */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[180px] sm:max-w-xs">
              {title}
            </h2>
            {commandCode && (
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded uppercase font-semibold">
                {commandCode}
              </span>
            )}
          </div>

          {/* Record Key Search Input with Search Icon as Dropdown Trigger */}
          <div className="relative flex items-center">
            <form onSubmit={handlePerformSearch} className="relative flex items-center">
              <Input
                type="text"
                placeholder="Enter or search ID..."
                value={inputVal}
                onChange={handleInputChange}
                className="h-8 w-36 sm:w-44 text-xs font-mono pr-8 bg-muted/20 focus-visible:bg-background"
              />

              {/* Existing Search Icon acts directly as the trigger & opens modal right below it */}
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="submit"
                      title="Search & browse matching records"
                      className="absolute right-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors p-1 rounded cursor-pointer"
                    >
                      <Search className="size-3.5" />
                    </button>
                  }
                />
                <DropdownMenuContent
                  side="bottom"
                  align="end"
                  sideOffset={6}
                  className="w-48 max-h-56 overflow-auto text-xs p-1 shadow-lg border border-border/80"
                >
                  <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground border-b border-border/40 mb-1">
                    Matching IDs ({searchResults.length > 0 ? searchResults.length : demoItems.length})
                  </div>
                  {(searchResults.length > 0 ? searchResults : (hasSearched ? [] : demoItems)).length === 0 ? (
                    <div className="p-2 text-muted-foreground font-mono text-center text-xs">
                      No matching records
                    </div>
                  ) : (
                    (searchResults.length > 0 ? searchResults : demoItems).map((item) => (
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
        </div>

        {/* Right Section: ALL Action Buttons (Solid) + More Actions Menu presented together on the right */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Action Buttons Toolbar:
              All CTAs execute ONLY after user clicks them:
              - '+' (Add): creates new form entry
              - 'Edit / Amend': loads data for the staged ID if exists
              - 'Eye' (View): opens read-only view
          */}
          <div className="flex items-center gap-1">
            <ActionButtons
              searchVal={inputVal}
              submitting={submitting}
              onCreateNew={onCreateNew}
              onAmend={onAmend}
              onView={onView}
              onSubmit={onSubmit}
              onValidate={onValidate}
              onHold={onHold}
              onDelete={onDelete}
              onReset={onReset}
            />
          </div>

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

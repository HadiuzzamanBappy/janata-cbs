"use client";

import {
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  Clock,
  Edit3,
  Eye,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserRights } from "@/features/auth";

export interface MoreActionItem {
  label: string;
  command?: string;
  onClick: () => void;
  requiredRight?: "R" | "I" | "D" | "A" | "S" | "H";
}

export interface ActionBarProps {
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
  availableItems?: Array<{ id: string; label?: string }>;
  className?: string;
}

export function ActionBar({
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
}: ActionBarProps) {
  const rights = useUserRights();
  const [searchVal, setSearchVal] = React.useState(recordId);

  React.useEffect(() => {
    setSearchVal(recordId);
  }, [recordId]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onRecordSearch && searchVal.trim()) {
      onRecordSearch(searchVal.trim());
    }
  };

  const handleSelectRecord = (id: string) => {
    setSearchVal(id);
    if (onRecordIdChange) onRecordIdChange(id);
    if (onRecordSearch) onRecordSearch(id);
  };

  // Filter available DB items dynamically matching current search string
  const matchedItems = React.useMemo(() => {
    if (!searchVal.trim()) return availableItems;
    const term = searchVal.trim().toLowerCase();
    return availableItems.filter(
      (item) => item.id.toLowerCase().includes(term) || item.label?.toLowerCase().includes(term),
    );
  }, [availableItems, searchVal]);

  const [selectedAction, setSelectedAction] = React.useState<MoreActionItem | null>(null);

  return (
    <TooltipProvider delay={300}>
      <div
        className={`sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shrink-0 ${className}`}
      >
        {/* Left Section: Screen Title, Search Input with Dropdown positioned below Input, & + New Button */}
        <div className="flex items-center gap-1.5 min-w-0">
          {/* Title & Command Code Sub-Label */}
          <div className="flex items-center gap-2 shrink-0 mr-3 sm:mr-6">
            <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <CheckCircle2 className="size-4" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <h2 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[150px] sm:max-w-xs">
                {title}
              </h2>
              {commandCode && (
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider leading-none">
                  {commandCode}
                </span>
              )}
            </div>
          </div>

          {/* Combined Left Search Bar + Integrated Chevron Dropdown Trigger */}
          {onRecordSearch && (
            <div className="flex items-center shrink-0">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground z-10 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Record ID..."
                  value={searchVal}
                  onChange={(e) => {
                    setSearchVal(e.target.value);
                    if (onRecordIdChange) onRecordIdChange(e.target.value);
                  }}
                  disabled={!rights.canSee && !rights.canRead}
                  className="h-8 pl-8 pr-2 w-32 sm:w-44 text-xs font-mono bg-muted/30 focus-visible:bg-background rounded-r-none border-r-0 focus-visible:z-10"
                />
              </form>

              {/* Dropdown Menu attached to integrated right chevron button */}
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            disabled={!rights.canSee && !rights.canRead}
                            className="size-8 rounded-l-none text-muted-foreground hover:text-foreground shrink-0 border-l border-border/80 bg-muted/30 hover:bg-muted/50"
                          >
                            <ChevronDown className="size-3.5" />
                          </Button>
                        }
                      />
                    }
                  />
                  <TooltipContent className="text-xs">Browse matching items</TooltipContent>
                </Tooltip>

                {/* Dropdown Popup menu anchored to top-right of trigger */}
                <DropdownMenuContent align="end" className="w-52 text-xs">
                  <DropdownMenuLabel className="text-[10px] text-muted-foreground font-mono">
                    Matching Items ({matchedItems.length})
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {matchedItems.length === 0 ? (
                    <div className="py-2 px-1.5 text-center text-xs text-muted-foreground font-mono">
                      No matching item found
                    </div>
                  ) : (
                    matchedItems.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        onClick={() => handleSelectRecord(item.id)}
                        className="text-xs cursor-pointer font-mono flex items-center justify-between"
                      >
                        <span className="truncate">{item.id}</span>
                        {item.label && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                            {item.label}
                          </span>
                        )}
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* Left Standalone Icon Button for + New Record */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onCreateNew?.()}
                  disabled={!onCreateNew || submitting || !rights.canInput}
                  className="size-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <Plus className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">
              {!rights.canInput ? "Requires Input ('I') permission" : "Create New Record"}
            </TooltipContent>
          </Tooltip>

          {/* Amend Control ('A' Right) - Active after inputting Record ID */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onAmend?.()}
                  disabled={!onAmend || submitting || !searchVal.trim() || !rights.canAmend}
                  className="size-8 text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-40"
                >
                  <Edit3 className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">
              {!searchVal.trim()
                ? "Enter a Record ID to amend"
                : !rights.canAmend
                  ? "Requires Amend ('A') permission"
                  : "Amend Record"}
            </TooltipContent>
          </Tooltip>

          {/* View Control ('See' / 'Read' Right) - Active after inputting Record ID */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onView?.()}
                  disabled={
                    !onView ||
                    submitting ||
                    !searchVal.trim() ||
                    (!rights.canSee && !rights.canRead)
                  }
                  className="size-8 text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-40"
                >
                  <Eye className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">
              {!searchVal.trim()
                ? "Enter a Record ID to view details"
                : !rights.canSee && !rights.canRead
                  ? "Requires View permission"
                  : "View Details"}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right Section: Icon buttons (Save, Validate, Reset, Hold, Delete), More Actions Dropdown, & Distinct Submit check button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* 1. Save Record Icon Button (Single Tick) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onSubmit?.()}
                  disabled={!onSubmit || submitting || (!rights.canInput && !rights.canAmend)}
                  className="size-8 text-primary shrink-0"
                >
                  <Check className="size-4 stroke-[2.5]" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">
              {!rights.canInput && !rights.canAmend
                ? "Requires Input ('I') or Amend ('A') permission"
                : "Save Record"}
            </TooltipContent>
          </Tooltip>

          {/* 2. Validate Control (Double Tick CheckCheck icon button) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onValidate?.()}
                  disabled={!onValidate || submitting || (!rights.canInput && !rights.canAmend)}
                  className="size-8 text-muted-foreground hover:text-foreground shrink-0"
                >
                  <CheckCheck className="size-4 stroke-[2.5]" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">
              Validate onsite &amp; DB rules (check for errors)
            </TooltipContent>
          </Tooltip>

          {/* 3. Hold Draft Control ('H' Right) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onHold?.()}
                  disabled={!onHold || submitting || !rights.canHold}
                  className="size-8 shrink-0"
                >
                  <Clock className="size-3.5 text-amber-500" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">
              {!rights.canHold ? "Requires Hold ('H') permission" : "Hold Draft"}
            </TooltipContent>
          </Tooltip>

          {/* 4. Delete Control ('D' Right) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onDelete?.()}
                  disabled={!onDelete || submitting || !rights.canDelete}
                  className="size-8 text-destructive shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">
              {!rights.canDelete ? "Requires Delete ('D') permission" : "Delete Record"}
            </TooltipContent>
          </Tooltip>

          {/* 5. Reset Control (Placed right before More Actions dropdown) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => onReset?.()}
                  disabled={!onReset || submitting}
                  className="size-8 text-muted-foreground shrink-0"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">Reset Form</TooltipContent>
          </Tooltip>

          {/* 8. More Actions Dropdown Selector (Matching dropdown popup width) */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2.5 text-xs gap-2 min-w-[180px] max-w-[220px] justify-between"
                >
                  <span className="truncate">
                    {selectedAction ? selectedAction.label : "More Actions..."}
                  </span>
                  <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-[180px] text-xs">
              <DropdownMenuLabel className="text-[11px] text-muted-foreground font-mono">
                More Actions
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {moreActions.length === 0 ? (
                <DropdownMenuItem disabled className="text-xs font-mono">
                  No extra actions
                </DropdownMenuItem>
              ) : (
                moreActions.map((action) => {
                  const allowed = !action.requiredRight || rights.hasRight(action.requiredRight);
                  return (
                    <DropdownMenuItem
                      key={action.command || action.label}
                      disabled={!allowed}
                      onClick={() => {
                        setSelectedAction(action);
                      }}
                      className="text-xs cursor-pointer flex items-center justify-between"
                    >
                      <span className="truncate">{action.label}</span>
                      {action.requiredRight && (
                        <span className="text-[10px] font-mono opacity-60 uppercase ml-1 shrink-0">
                          ({action.requiredRight})
                        </span>
                      )}
                    </DropdownMenuItem>
                  );
                })
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 9. Distinct Submit Action Checkmark Button (Disabled by default with secondary theme, activates green when dropdown item selected) */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  size="icon-sm"
                  onClick={() => {
                    if (selectedAction) {
                      selectedAction.onClick();
                    } else if (onSubmit) {
                      onSubmit();
                    }
                  }}
                  disabled={
                    submitting ||
                    !selectedAction ||
                    (selectedAction.requiredRight
                      ? !rights.hasRight(selectedAction.requiredRight)
                      : false)
                  }
                  variant={selectedAction ? "default" : "secondary"}
                  className={`size-8 shrink-0 transition-colors ${
                    selectedAction
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 border-0 shadow-sm"
                      : "bg-secondary text-muted-foreground opacity-60 cursor-not-allowed"
                  }`}
                >
                  <CheckCircle2 className="size-4" />
                </Button>
              }
            />
            <TooltipContent className="text-xs">
              {selectedAction
                ? `Execute: ${selectedAction.label}`
                : "Select an action from More Actions to enable"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}

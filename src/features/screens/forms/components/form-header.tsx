"use client";

import { ChevronDown, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
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
  availableItems?: Array<{ id: string; label?: string }>;
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

  const matchedItems = React.useMemo(() => {
    if (!searchVal.trim()) return availableItems;
    const lower = searchVal.toLowerCase();
    return availableItems.filter(
      (item) => item.id.toLowerCase().includes(lower) || item.label?.toLowerCase().includes(lower),
    );
  }, [availableItems, searchVal]);

  return (
    <TooltipProvider delay={150}>
      <div
        className={`sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/60 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 ${className}`}
      >
        {/* Left: Screen Title & Quick Command Code Display */}
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-xs">
            {title}
          </h2>
          {commandCode && (
            <span className="text-[10px] font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded uppercase font-semibold">
              {commandCode}
            </span>
          )}
        </div>

        {/* Center: Record Key Search Input with Quick Dropdown */}
        <div className="flex items-center gap-1 min-w-0">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Input
              type="text"
              placeholder="Record ID..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="h-8 w-28 sm:w-36 text-xs font-mono pr-7 bg-muted/20 focus-visible:bg-background"
            />
            <button
              type="submit"
              className="absolute right-1 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <Search className="size-3" />
            </button>
          </form>

          {/* Quick Select Record ID Dropdown */}
          {availableItems.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronDown className="size-3" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-56 max-h-56 overflow-auto text-xs">
                {matchedItems.length === 0 ? (
                  <div className="p-2 text-muted-foreground font-mono text-center">
                    No matching records
                  </div>
                ) : (
                  matchedItems.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => handleSelectRecord(item.id)}
                      className="font-mono flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-semibold">{item.id}</span>
                      {item.label && (
                        <span className="text-muted-foreground font-sans truncate ml-2">
                          {item.label}
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Action Buttons Toolbar */}
          <ActionButtons
            searchVal={searchVal}
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

        {/* Right Section: More Actions Dropdown & Final Submit Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <ActionMoreMenu moreActions={moreActions} submitting={submitting} onSubmit={onSubmit} />
        </div>
      </div>
    </TooltipProvider>
  );
}

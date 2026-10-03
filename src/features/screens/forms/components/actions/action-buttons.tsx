"use client";

import {
  ArrowUp,
  Check,
  ChevronDown,
  Edit3,
  Eye,
  Lock,
  Pause,
  Play,
  Plus,
  Wrench,
  X,
} from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserRights } from "@/hooks";
import { cn } from "@/lib/utils";

export interface ActionButtonsProps {
  mode: "IDLE" | "CREATE" | "EDIT" | "VIEW";
  searchVal: string;
  onSearchChange?: (val: string) => void;
  onSearchSubmit?: (e?: React.FormEvent) => void;
  onSelectRecord?: (id: string) => void;
  matchingItems?: Array<{ id: string; label?: string }>;
  isDropdownOpen?: boolean;
  onDropdownOpenChange?: (open: boolean) => void;
  hasSearched?: boolean;
  submitting?: boolean;
  onCreateNew?: () => void;
  onAmend?: () => void;
  onView?: () => void;
  onPerformAction?: () => void;
  onSubmit?: () => void;
  onValidate?: () => void;
  onHold?: () => void;
  onDelete?: () => void;
  onAuthorizeReverse?: () => void;
  onProcessAction?: () => void;
  onReturnToSearch?: () => void;
  onReset?: () => void;
}

export function ActionButtons({
  mode,
  searchVal,
  onSearchChange,
  onSearchSubmit,
  onSelectRecord,
  matchingItems = [],
  isDropdownOpen = false,
  onDropdownOpenChange,
  hasSearched = false,
  submitting = false,
  onCreateNew,
  onAmend,
  onView,
  onPerformAction,
  onSubmit,
  onValidate,
  onHold,
  onDelete,
  onAuthorizeReverse,
  onProcessAction,
  onReturnToSearch,
}: ActionButtonsProps) {
  const rights = useUserRights();

  // ==========================================
  // STATE 1: IDLE STATE TOOLBAR
  // [Search Input + Arrow Dropdown] [+] [Edit] [View] [Perform Action]
  // ==========================================
  if (mode === "IDLE") {
    return (
      <div className="flex items-center gap-1 shrink-0">
        {/* Integrated Record Key Search Input with Arrow Dropdown anchor */}
        <div className="relative flex items-center">
          <form onSubmit={onSearchSubmit} className="relative flex items-center">
            <Input
              type="text"
              placeholder="Search or enter ID..."
              value={searchVal}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className={cn(
                "h-8 w-32 sm:w-40 text-xs font-mono bg-muted/20 focus-visible:bg-background",
                searchVal ? "pr-12" : "pr-6"
              )}
            />

            {/* Clear Input Button (visible when input has text) */}
            {searchVal && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onSearchChange?.("");
                }}
                className="absolute right-5 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors p-0.5 rounded cursor-pointer"
                aria-label="Clear input"
              >
                <X className="size-3" />
              </button>
            )}

            <DropdownMenu open={isDropdownOpen} onOpenChange={onDropdownOpenChange}>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      onSearchSubmit?.();
                    }}
                    className="absolute right-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors p-0.5 rounded cursor-pointer"
                  >
                    <ChevronDown className="size-3" />
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
                  Matching IDs ({matchingItems.length})
                </div>
                {matchingItems.length === 0 ? (
                  <div className="p-2 text-muted-foreground font-mono text-center text-xs">
                    {hasSearched ? "No matching records" : "Type to filter"}
                  </div>
                ) : (
                  matchingItems.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => onSelectRecord?.(item.id)}
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

        {/* Add / Create New Record (+) */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="default"
                size="icon-sm"
                onClick={() => onCreateNew?.()}
                disabled={!onCreateNew || submitting || !rights.canInput}
                className="size-8 shadow-xs shrink-0"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
              </Button>
            }
          />
          <TooltipContent className="text-xs">
            {!rights.canInput ? "Requires Input ('I') permission" : "Create New Record (+)"}
          </TooltipContent>
        </Tooltip>

        {/* Edit Record */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onAmend?.()}
                disabled={!onAmend || submitting || !searchVal.trim() || !rights.canAmend}
                className="size-8 shrink-0 disabled:opacity-40"
              >
                <Edit3 className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent className="text-xs">
            {!searchVal.trim()
              ? "Enter or select a Record ID to edit"
              : !rights.canAmend
                ? "Requires Amend ('A') permission"
                : "Edit Record"}
          </TooltipContent>
        </Tooltip>

        {/* View Details */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onView?.()}
                disabled={
                  !onView || submitting || !searchVal.trim() || (!rights.canSee && !rights.canRead)
                }
                className="size-8 shrink-0 disabled:opacity-40"
              >
                <Eye className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent className="text-xs">
            {!searchVal.trim()
              ? "Enter or select a Record ID to view"
              : !rights.canSee && !rights.canRead
                ? "Requires View permission"
                : "View Details"}
          </TooltipContent>
        </Tooltip>

        {/* Perform Action on pointed record item */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                onClick={() => onPerformAction?.()}
                disabled={!onPerformAction || submitting || !searchVal.trim()}
                className="size-8 text-muted-foreground hover:text-foreground shrink-0 disabled:opacity-40"
              >
                <Wrench className="size-3.5" />
              </Button>
            }
          />
          <TooltipContent className="text-xs">
            {!searchVal.trim()
              ? "Enter or select a Record ID to perform action"
              : "Perform Action on Record"}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  // ==========================================
  // STATE 2: ACTIVE FORM STATE TOOLBAR (CREATE / EDIT / VIEW)
  // [Locked Record ID] [✓ Save] [?✓ Validate] [❚❚ Hold] [✕ Reverse] [✓✓ AuthReverse] [▶ Process] [⬆ Return]
  // ==========================================
  const displayId = searchVal.trim() || (mode === "CREATE" ? "NEW" : "CURRENT");

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* Locked Record ID Indicator in place of Search Input */}
      <Tooltip>
        <TooltipTrigger
          render={
            <div className="flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-border/80 bg-muted/40 text-foreground select-none">
              <Lock className="size-3 text-muted-foreground shrink-0" />
              <span className="font-mono text-xs font-semibold tracking-tight text-foreground truncate max-w-[120px] sm:max-w-[160px]">
                {displayId}
              </span>
              <span className="text-[9px] font-mono px-1 py-0 rounded bg-primary/10 text-primary border border-primary/20 shrink-0 font-medium">
                {mode}
              </span>
            </div>
          }
        />
        <TooltipContent className="text-xs">
          Record ID is locked in {mode} mode
        </TooltipContent>
      </Tooltip>

      {/* 1. Commit / Save Record (✓) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onSubmit?.()}
              disabled={
                mode === "VIEW" ||
                !onSubmit ||
                submitting ||
                (mode === "CREATE" && !rights.canInput) ||
                (mode === "EDIT" && !rights.canAmend)
              }
              className="size-8 shadow-xs shrink-0 disabled:opacity-40"
            >
              <Check className="size-3.5 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {mode === "VIEW"
            ? "Disabled in View mode (Read-Only)"
            : mode === "CREATE" && !rights.canInput
              ? "Requires Input ('I') permission"
              : mode === "EDIT" && !rights.canAmend
                ? "Requires Amend ('A') permission"
                : "Save / Commit Record (✓)"}
        </TooltipContent>
      </Tooltip>

      {/* 2. Validate Onsite Rules (?✓) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onValidate?.()}
              disabled={
                mode === "VIEW" ||
                !onValidate ||
                submitting ||
                (mode === "CREATE" && !rights.canInput) ||
                (mode === "EDIT" && !rights.canAmend)
              }
              className="size-8 shrink-0 disabled:opacity-40 font-bold"
            >
              <span className="text-[12px] font-mono leading-none tracking-tighter select-none font-bold">
                ?✓
              </span>
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {mode === "VIEW" ? "Disabled in View mode" : "Validate Rules & Integrity (?✓)"}
        </TooltipContent>
      </Tooltip>

      {/* 3. Hold Draft (❚❚ / Pause) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onHold?.()}
              disabled={
                mode === "VIEW" ||
                !onHold ||
                submitting ||
                !rights.canHold
              }
              className="size-8 shrink-0 disabled:opacity-40"
            >
              <Pause className="size-3.5 fill-current" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {mode === "VIEW"
            ? "Disabled in View mode"
            : !rights.canHold
              ? "Requires Hold ('H') permission"
              : "Hold Draft (❚❚)"}
        </TooltipContent>
      </Tooltip>

      {/* 4. Delete / Reverse (✕) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onDelete?.()}
              disabled={
                mode !== "EDIT" ||
                !onDelete ||
                submitting ||
                !rights.canDelete
              }
              className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 shrink-0 disabled:opacity-40"
            >
              <X className="size-3.5 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {mode === "VIEW"
            ? "Disabled in View mode"
            : mode === "CREATE"
              ? "Cannot delete an unsaved new record"
              : !rights.canDelete
                ? "Requires Delete ('D') permission"
                : "Delete / Reverse Record (✕)"}
        </TooltipContent>
      </Tooltip>

      {/* 5. Authorize Record (✓✓ / CheckCheck) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onAuthorizeReverse?.()}
              disabled={
                mode !== "EDIT" ||
                !onAuthorizeReverse ||
                submitting ||
                !rights.canAuthorise
              }
              className="size-8 shrink-0 disabled:opacity-40"
            >
              <span className="text-[12px] font-mono leading-none tracking-tighter select-none font-bold">
                ✓✓
              </span>
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {mode === "VIEW"
            ? "Disabled in View mode"
            : mode === "CREATE"
              ? "Cannot authorize an uncommitted record"
              : !rights.canAuthorise
                ? "Requires Authorise ('A') permission"
                : "Authorize Record (✓✓)"}
        </TooltipContent>
      </Tooltip>

      {/* 6. Authorize Reversal (✕✓) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onAuthorizeReverse?.()}
              disabled={
                mode !== "EDIT" ||
                !onAuthorizeReverse ||
                submitting ||
                (!rights.canAuthorise && !rights.canReverse)
              }
              className="size-8 shrink-0 disabled:opacity-40"
            >
              <span className="text-[11px] font-mono leading-none tracking-tighter select-none font-bold">
                ✕✓
              </span>
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {mode === "VIEW"
            ? "Disabled in View mode"
            : mode === "CREATE"
              ? "Cannot reverse an uncommitted record"
              : !rights.canAuthorise && !rights.canReverse
                ? "Requires Authorise/Reverse ('A'/'R') permission"
                : "Authorize Reversal (✕✓)"}
        </TooltipContent>
      </Tooltip>

      {/* 7. Verify / Process Action (▶ / Play) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onProcessAction?.()}
              disabled={!onProcessAction || submitting}
              className="size-8 shrink-0"
            >
              <Play className="size-3.5 fill-current" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">Process / Verify (▶)</TooltipContent>
      </Tooltip>

      {/* 8. Reset / Return to App Screen (⬆ / ArrowUp) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onReturnToSearch?.()}
              disabled={!onReturnToSearch || submitting}
              className="size-8 shrink-0 disabled:opacity-40"
            >
              <ArrowUp className="size-3.5 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">Return to App Screen (⬆)</TooltipContent>
      </Tooltip>
    </div>
  );
}

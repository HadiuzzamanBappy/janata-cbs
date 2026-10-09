"use client";

import { ArrowUp, Check, Pause, Pencil, Play, Search, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useUserRights } from "@/hooks";
import type { CbsScreenMode } from "../types";

export interface IdleActionsProps {
  searchVal: string;
  submitting?: boolean;
  onAmend?: () => void;
  onView?: () => void;
  onPerformAction?: () => void;
}

/**
 * Idle state action buttons: Edit, View, and Perform Action on existing records.
 */
export function IdleActions({
  searchVal,
  submitting = false,
  onAmend,
  onView,
  onPerformAction,
}: IdleActionsProps) {
  const rights = useUserRights();

  return (
    <div className="flex items-center gap-1 shrink-0">
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onAmend?.()}
              disabled={!onAmend || submitting || !searchVal.trim() || !rights.canAmend}
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40"
            >
              <Pencil className="size-3" />
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

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onView?.()}
              disabled={
                !onView || submitting || !searchVal.trim() || (!rights.canSee && !rights.canRead)
              }
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40"
            >
              <Search className="size-3" />
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

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onPerformAction?.()}
              disabled={!onPerformAction || submitting || !searchVal.trim()}
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40"
            >
              <Wrench className="size-3" />
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

export interface ActiveActionsProps {
  mode: Exclude<CbsScreenMode, "IDLE">;
  submitting?: boolean;
  onSubmit?: () => void;
  onValidate?: () => void;
  onHold?: () => void;
  onDelete?: () => void;
  onAuthorizeReverse?: () => void;
  onProcessAction?: () => void;
  onReturnToSearch?: () => void;
}

/**
 * Active form state action buttons: Commit (✓), Validate (?✓), Hold (❚❚), Delete (✕), Authorize (✓✓), Reverse (✕✓), Verify (▶), Return (⬆).
 */
export function ActiveActions({
  mode,
  submitting = false,
  onSubmit,
  onValidate,
  onHold,
  onDelete,
  onAuthorizeReverse,
  onProcessAction,
  onReturnToSearch,
}: ActiveActionsProps) {
  const rights = useUserRights();

  return (
    <div className="flex items-center gap-1 shrink-0">
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
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40"
            >
              <Check className="size-3 stroke-[2.5]" />
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
              variant="default"
              size="icon-sm"
              onClick={() => onValidate?.()}
              disabled={
                mode === "VIEW" ||
                !onValidate ||
                submitting ||
                (mode === "CREATE" && !rights.canInput) ||
                (mode === "EDIT" && !rights.canAmend)
              }
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40 font-bold"
            >
              <span className="text-[11px] font-mono leading-none tracking-tighter select-none font-bold">
                ?✓
              </span>
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {mode === "VIEW" ? "Disabled in View mode" : "Validate Rules & Integrity (?✓)"}
        </TooltipContent>
      </Tooltip>

      {/* 3. Hold Draft (❚❚) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onHold?.()}
              disabled={mode === "VIEW" || !onHold || submitting || !rights.canHold}
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40"
            >
              <Pause className="size-3 fill-current" />
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
              variant="destructive"
              size="icon-sm"
              onClick={() => onDelete?.()}
              disabled={mode !== "EDIT" || !onDelete || submitting || !rights.canDelete}
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40"
            >
              <X className="size-3 stroke-[2.5]" />
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

      {/* 5. Authorize Record (✓✓) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onAuthorizeReverse?.()}
              disabled={
                mode !== "EDIT" || !onAuthorizeReverse || submitting || !rights.canAuthorise
              }
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40"
            >
              <span className="text-[11px] font-mono leading-none tracking-tighter select-none font-bold">
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
              variant="default"
              size="icon-sm"
              onClick={() => onAuthorizeReverse?.()}
              disabled={
                mode !== "EDIT" ||
                !onAuthorizeReverse ||
                submitting ||
                (!rights.canAuthorise && !rights.canReverse)
              }
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40"
            >
              <span className="text-[10px] font-mono leading-none tracking-tighter select-none font-bold">
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

      {/* 7. Verify / Process Action (▶) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onProcessAction?.()}
              disabled={!onProcessAction || submitting}
              className="h-7 w-9 rounded shadow-xs shrink-0"
            >
              <Play className="size-3 fill-current" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">Process / Verify (▶)</TooltipContent>
      </Tooltip>

      {/* 8. Reset / Return to App Screen (⬆) */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onReturnToSearch?.()}
              disabled={!onReturnToSearch || submitting}
              className="h-7 w-9 rounded shadow-xs shrink-0 disabled:opacity-40"
            >
              <ArrowUp className="size-3 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">Return to App Screen (⬆)</TooltipContent>
      </Tooltip>
    </div>
  );
}

export interface ActionButtonsProps {
  mode: CbsScreenMode;
  searchVal: string;
  submitting?: boolean;
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
}

/**
 * Universal ActionButtons toolbar: renders IdleActions or ActiveActions based on screen mode.
 */
export function ActionButtons({
  mode,
  searchVal,
  submitting = false,
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
  if (mode === "IDLE") {
    return (
      <IdleActions
        searchVal={searchVal}
        submitting={submitting}
        onAmend={onAmend}
        onView={onView}
        onPerformAction={onPerformAction}
      />
    );
  }

  return (
    <ActiveActions
      mode={mode}
      submitting={submitting}
      onSubmit={onSubmit}
      onValidate={onValidate}
      onHold={onHold}
      onDelete={onDelete}
      onAuthorizeReverse={onAuthorizeReverse}
      onProcessAction={onProcessAction}
      onReturnToSearch={onReturnToSearch}
    />
  );
}

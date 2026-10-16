"use client";

import { ArrowUp, Check, Pause, Pencil, Play, Search, Wrench, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CbsScreenMode } from "@/lib/cbs-screen";
import { useCbsActionBar } from "@/lib/cbs-screen";

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
  const actions = useCbsActionBar({
    mode: "IDLE",
    searchVal,
    submitting,
    onAmend,
    onView,
    onPerformAction,
  });

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
              disabled={!actions.amend.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40"
            >
              <Pencil className="size-3" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">{actions.amend.reason || "Edit Record"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onView?.()}
              disabled={!actions.view.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40"
            >
              <Search className="size-3" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">{actions.view.reason || "View Details"}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="button"
              variant="default"
              size="icon-sm"
              onClick={() => onPerformAction?.()}
              disabled={!actions.performAction.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40"
            >
              <Wrench className="size-3" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {actions.performAction.reason || "Perform Action on Record"}
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
  const actions = useCbsActionBar({
    mode,
    submitting,
    onSubmit,
    onValidate,
    onHold,
    onDelete,
    onAuthorizeReverse,
    onProcessAction,
    onReturnToSearch,
  });

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
              disabled={!actions.commit.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40"
            >
              <Check className="size-3 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {actions.commit.reason || "Save / Commit Record (✓)"}
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
              disabled={!actions.validate.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40 font-bold"
            >
              <span className="text-[11px] font-mono leading-none tracking-tighter select-none font-bold">
                ?✓
              </span>
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {actions.validate.reason || "Validate Rules & Integrity (?✓)"}
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
              disabled={!actions.hold.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40"
            >
              <Pause className="size-3 fill-current" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {actions.hold.reason || "Hold Draft (❚❚)"}
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
              disabled={!actions.delete.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40"
            >
              <X className="size-3 stroke-[2.5]" />
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {actions.delete.reason || "Delete / Reverse Record (✕)"}
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
              disabled={!actions.authorize.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40"
            >
              <span className="text-[11px] font-mono leading-none tracking-tighter select-none font-bold">
                ✓✓
              </span>
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {actions.authorize.reason || "Authorize Record (✓✓)"}
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
              disabled={!actions.reverse.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40"
            >
              <span className="text-[10px] font-mono leading-none tracking-tighter select-none font-bold">
                ✕✓
              </span>
            </Button>
          }
        />
        <TooltipContent className="text-xs">
          {actions.reverse.reason || "Authorize Reversal (✕✓)"}
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
              disabled={!actions.process.enabled}
              className="h-7 w-9 shadow-xs shrink-0"
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
              disabled={!actions.returnToSearch.enabled}
              className="h-7 w-9 shadow-xs shrink-0 disabled:opacity-40"
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

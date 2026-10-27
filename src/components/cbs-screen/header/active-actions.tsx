"use client";

import { ArrowUp, Check, Pause, Play, X } from "lucide-react";
import { useCbsActionBar } from "@/lib/cbs-screen";
import type { CbsScreenMode } from "@/types";
import { ActionBtn } from "./action-btn";

export interface ActiveActionsProps {
  mode: Exclude<CbsScreenMode, "IDLE">;
  recordStatus?: string;
  recordInputter?: string;
  command?: string;
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
  recordStatus,
  recordInputter,
  command,
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
    recordStatus,
    recordInputter,
    command,
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
      <ActionBtn
        onClick={onSubmit}
        enabled={actions.commit.enabled}
        reason={actions.commit.reason}
        defaultTooltip="Save / Commit Record (✓)"
      >
        <Check className="size-3 stroke-[2.5]" />
      </ActionBtn>

      {/* 2. Validate Onsite Rules (?✓) */}
      <ActionBtn
        onClick={onValidate}
        enabled={actions.validate.enabled}
        reason={actions.validate.reason}
        defaultTooltip="Validate Rules & Integrity (?✓)"
      >
        <span className="text-[11px] font-mono leading-none tracking-tighter select-none font-bold">
          ?✓
        </span>
      </ActionBtn>

      {/* 3. Hold Draft (❚❚) */}
      <ActionBtn
        onClick={onHold}
        enabled={actions.hold.enabled}
        reason={actions.hold.reason}
        defaultTooltip="Hold Draft (❚❚)"
      >
        <Pause className="size-3 fill-current" />
      </ActionBtn>

      {/* 4. Delete / Reverse (✕) */}
      <ActionBtn
        onClick={onDelete}
        enabled={actions.delete.enabled}
        reason={actions.delete.reason}
        defaultTooltip="Delete / Reverse Record (✕)"
        variant="destructive"
      >
        <X className="size-3 stroke-[2.5]" />
      </ActionBtn>

      {/* 5. Authorize Record (✓✓) */}
      <ActionBtn
        onClick={onAuthorizeReverse}
        enabled={actions.authorize.enabled}
        reason={actions.authorize.reason}
        defaultTooltip="Authorize Record (✓✓)"
      >
        <span className="text-[11px] font-mono leading-none tracking-tighter select-none font-bold">
          ✓✓
        </span>
      </ActionBtn>

      {/* 6. Authorize Reversal (✕✓) */}
      <ActionBtn
        onClick={onAuthorizeReverse}
        enabled={actions.reverse.enabled}
        reason={actions.reverse.reason}
        defaultTooltip="Authorize Reversal (✕✓)"
      >
        <span className="text-[10px] font-mono leading-none tracking-tighter select-none font-bold">
          ✕✓
        </span>
      </ActionBtn>

      {/* 7. Verify / Process Action (▶) */}
      <ActionBtn
        onClick={onProcessAction}
        enabled={actions.process.enabled}
        reason={actions.process.reason}
        defaultTooltip="Process / Verify (▶)"
      >
        <Play className="size-3 fill-current" />
      </ActionBtn>

      {/* 8. Reset / Return to App Screen (⬆) */}
      <ActionBtn
        onClick={onReturnToSearch}
        enabled={actions.returnToSearch.enabled}
        reason={actions.returnToSearch.reason}
        defaultTooltip="Return to App Screen (⬆)"
      >
        <ArrowUp className="size-3 stroke-[2.5]" />
      </ActionBtn>
    </div>
  );
}

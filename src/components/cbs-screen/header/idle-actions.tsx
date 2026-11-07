"use client";

import { Pencil, Search, Wrench } from "lucide-react";
import { useCbsActionBar } from "@/lib/cbs-screen";
import { ActionBtn } from "./action-btn";

export interface IdleActionsProps {
  searchVal: string;
  command?: string;
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
  command = "",
  submitting = false,
  onAmend,
  onView,
  onPerformAction,
}: IdleActionsProps) {
  const actions = useCbsActionBar({
    mode: "IDLE",
    searchVal,
    command,
    submitting,
    onAmend,
    onView,
    onPerformAction,
  });

  const baseCmd = command.trim().toUpperCase();
  const cleanId = searchVal.trim().toUpperCase();

  return (
    <div className="flex items-center gap-1 shrink-0">
      <ActionBtn
        onClick={onAmend}
        enabled={actions.amend.enabled}
        reason={actions.amend.reason}
        commandPreview={baseCmd && cleanId ? `${baseCmd} I ${cleanId}` : undefined}
        defaultTooltip="Edit Record"
      >
        <Pencil className="size-3" />
      </ActionBtn>

      <ActionBtn
        onClick={onView}
        enabled={actions.view.enabled}
        reason={actions.view.reason}
        commandPreview={baseCmd && cleanId ? `${baseCmd} S ${cleanId}` : undefined}
        defaultTooltip="View Details"
      >
        <Search className="size-3" />
      </ActionBtn>

      <ActionBtn
        onClick={onPerformAction}
        enabled={actions.performAction.enabled}
        reason={actions.performAction.reason}
        commandPreview={baseCmd && cleanId ? `${baseCmd} A ${cleanId}` : undefined}
        defaultTooltip="Authorize / Action Record"
      >
        <Wrench className="size-3" />
      </ActionBtn>
    </div>
  );
}

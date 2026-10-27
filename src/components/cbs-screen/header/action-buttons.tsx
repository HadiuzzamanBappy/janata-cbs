"use client";

import type { CbsScreenMode } from "@/types";
import { ActiveActions, type ActiveActionsProps } from "./active-actions";
import { IdleActions, type IdleActionsProps } from "./idle-actions";

/**
 * Combined Props for the Universal CBS Action Toolbar.
 * Inherits all capabilities from IdleActions and ActiveActions.
 */
export interface ActionButtonsProps
  extends Omit<IdleActionsProps, "searchVal">,
    Omit<ActiveActionsProps, "mode"> {
  mode: CbsScreenMode;
  searchVal?: string;
}

/**
 * Universal ActionButtons Toolbar:
 * Dispatches to <IdleActions /> or <ActiveActions /> based on current CBS screen mode.
 */
export function ActionButtons({
  mode,
  searchVal = "",
  recordStatus,
  recordInputter,
  command,
  submitting = false,
  // Idle handlers
  onAmend,
  onView,
  onPerformAction,
  // Active handlers
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
      recordStatus={recordStatus}
      recordInputter={recordInputter}
      command={command}
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

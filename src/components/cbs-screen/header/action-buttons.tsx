"use client";

import type { CbsAccessResult } from "@/lib/cbs-access";
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
  access: CbsAccessResult;
}

/**
 * Universal ActionButtons Toolbar:
 * Dispatches to <IdleActions /> or <ActiveActions /> based on current CBS screen mode.
 */
export function ActionButtons({
  mode,
  searchVal = "",
  recordId,
  recordStatus,
  recordInputter,
  command,
  submitting = false,
  access,
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
        command={command}
        submitting={submitting}
        access={access}
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
      recordId={recordId || searchVal}
      submitting={submitting}
      access={access}
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

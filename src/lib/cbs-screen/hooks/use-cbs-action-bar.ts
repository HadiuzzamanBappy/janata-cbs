"use client";

import { useUserRights } from "@/hooks";
import type { CbsScreenMode } from "../types";

export interface ActionCapability {
  enabled: boolean;
  reason?: string;
}

export interface CbsActionBarCapabilities {
  // Idle state actions
  amend: ActionCapability;
  view: ActionCapability;
  performAction: ActionCapability;

  // Active state actions
  commit: ActionCapability;
  validate: ActionCapability;
  hold: ActionCapability;
  delete: ActionCapability;
  authorize: ActionCapability;
  reverse: ActionCapability;
  process: ActionCapability;
  returnToSearch: ActionCapability;
}

export interface UseCbsActionBarOptions {
  mode: CbsScreenMode;
  searchVal?: string;
  submitting?: boolean;
  hasRecord?: boolean;
  isDirty?: boolean;
  // Handlers passed from screen
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
 * Headless state & capability decision engine for CBS Action Toolbar.
 * Implements deterministic enabled/disabled matrix and permission enforcement.
 */
export function useCbsActionBar({
  mode,
  searchVal = "",
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
}: UseCbsActionBarOptions): CbsActionBarCapabilities {
  const rights = useUserRights();
  const hasTargetId = Boolean(searchVal.trim());
  const isIdle = mode === "IDLE";
  const isView = mode === "S" || mode === "A";
  const isCreate = mode === "I";
  const isEdit = mode === "I";
  const isAuth = mode === "A";

  // 1. Idle Amend (Pencil)
  const amendEnabled = Boolean(isIdle && onAmend && !submitting && hasTargetId && rights.canAmend);
  const amendReason = !hasTargetId
    ? "Enter or select a Record ID to edit"
    : !rights.canAmend
      ? "Requires Input/Amend ('I') permission"
      : undefined;

  // 2. Idle View (Search)
  const viewEnabled = Boolean(isIdle && onView && !submitting && hasTargetId && rights.canSee);
  const viewReason = !hasTargetId
    ? "Enter or select a Record ID to view"
    : !rights.canSee
      ? "Requires See ('S') permission"
      : undefined;

  // 3. Idle Perform Action (Wrench)
  const performActionEnabled = Boolean(isIdle && onPerformAction && !submitting && hasTargetId);
  const performActionReason = !onPerformAction
    ? "No lifecycle action available for this record"
    : !hasTargetId
      ? "Enter or select a Record ID to perform action"
      : undefined;

  // 4. Commit / Save (Check ✓)
  const commitEnabled = Boolean(
    !isView &&
      onSubmit &&
      !submitting &&
      ((isCreate && rights.canInput) || (isEdit && rights.canAmend)),
  );
  const commitReason = isView
    ? "Disabled in View mode (Read-Only)"
    : isCreate && !rights.canInput
      ? "Requires Input ('I') permission"
      : isEdit && !rights.canAmend
        ? "Requires Input/Amend ('I') permission"
        : undefined;

  // 5. Validate (?✓)
  const validateEnabled = Boolean(
    !isView &&
      onValidate &&
      !submitting &&
      ((isCreate && rights.canInput) || (isEdit && rights.canAmend)),
  );
  const validateReason = isView
    ? "Disabled in View mode"
    : !rights.canInput
      ? "Requires Input ('I') permission"
      : undefined;

  // 6. Hold (❚❚)
  const holdEnabled = Boolean(!isView && onHold && !submitting && rights.canHold);
  const holdReason = isView
    ? "Disabled in View mode"
    : !rights.canHold
      ? "Requires Input ('I') permission to hold draft"
      : undefined;

  // 7. Delete (✕)
  const deleteEnabled = Boolean(isEdit && onDelete && !submitting && rights.canDelete);
  const deleteReason = isView
    ? "Disabled in View mode"
    : isCreate
      ? "Cannot delete an unsaved new record"
      : !rights.canDelete
        ? "Requires Delete ('D') permission"
        : undefined;

  // 8. Authorize (✓✓)
  const authorizeEnabled = Boolean(
    isAuth && onAuthorizeReverse && !submitting && rights.canAuthorise,
  );
  const authorizeReason =
    isView && !isAuth
      ? "Disabled in View mode"
      : isCreate
        ? "Cannot authorize an uncommitted record"
        : !rights.canAuthorise
          ? "Requires Authorize ('A') permission"
          : undefined;

  // 9. Reverse (✕✓)
  const reverseEnabled = Boolean(isAuth && onAuthorizeReverse && !submitting && rights.canReverse);
  const reverseReason =
    isView && !isAuth
      ? "Disabled in View mode"
      : isCreate
        ? "Cannot reverse an uncommitted record"
        : !rights.canReverse
          ? "Requires Reverse ('R') permission"
          : undefined;

  // 10. Process (▶)
  const processEnabled = Boolean(!submitting && onProcessAction);

  // 11. Return to Search (⬆)
  const returnToSearchEnabled = Boolean(Boolean(onReturnToSearch) && !submitting);

  return {
    amend: { enabled: amendEnabled, reason: amendReason },
    view: { enabled: viewEnabled, reason: viewReason },
    performAction: { enabled: performActionEnabled, reason: performActionReason },
    commit: { enabled: commitEnabled, reason: commitReason },
    validate: { enabled: validateEnabled, reason: validateReason },
    hold: { enabled: holdEnabled, reason: holdReason },
    delete: { enabled: deleteEnabled, reason: deleteReason },
    authorize: { enabled: authorizeEnabled, reason: authorizeReason },
    reverse: { enabled: reverseEnabled, reason: reverseReason },
    process: { enabled: processEnabled },
    returnToSearch: { enabled: returnToSearchEnabled },
  };
}

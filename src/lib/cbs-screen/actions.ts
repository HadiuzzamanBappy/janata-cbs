// ============================================================================
// CBS Screen Action Bar Capability Engine & Preset Actions
// ============================================================================

"use client";

import { toast } from "@/components/ui/toast";
import { useCbsAccess } from "@/lib/cbs-access";
import type { CbsScreenMode, MoreActionItem } from "./types";

export interface ActionCapability {
  readonly enabled: boolean;
  readonly reason?: string;
}

export interface CbsActionBarCapabilities {
  // Idle state actions
  readonly amend: ActionCapability;
  readonly view: ActionCapability;
  readonly performAction: ActionCapability;

  // Active state actions
  readonly commit: ActionCapability;
  readonly validate: ActionCapability;
  readonly hold: ActionCapability;
  readonly delete: ActionCapability;
  readonly authorize: ActionCapability;
  readonly reverse: ActionCapability;
  readonly process: ActionCapability;
  readonly returnToSearch: ActionCapability;
}

export interface UseCbsActionBarOptions {
  readonly mode: CbsScreenMode;
  readonly searchVal?: string;
  readonly submitting?: boolean;
  readonly hasRecord?: boolean;
  readonly isDirty?: boolean;
  // Handlers passed from screen
  readonly onAmend?: () => void;
  readonly onView?: () => void;
  readonly onPerformAction?: () => void;
  readonly onSubmit?: () => void;
  readonly onValidate?: () => void;
  readonly onHold?: () => void;
  readonly onDelete?: () => void;
  readonly onAuthorizeReverse?: () => void;
  readonly onProcessAction?: () => void;
  readonly onReturnToSearch?: () => void;
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
  const access = useCbsAccess({ mode });
  const hasTargetId = Boolean(searchVal.trim());
  const isIdle = mode === "IDLE";
  const isView = mode === "S" || mode === "A";
  const isCreate = mode === "I";
  const isEdit = mode === "I";
  const isAuth = mode === "A";

  // 1. Idle Amend (Pencil)
  const amendEnabled = Boolean(isIdle && onAmend && !submitting && hasTargetId && access.canInput);
  const amendReason = !hasTargetId
    ? "Enter or select a Record ID to edit"
    : !access.canInput
      ? "Requires Input/Amend ('I') permission"
      : undefined;

  // 2. Idle View (Search)
  const viewEnabled = Boolean(isIdle && onView && !submitting && hasTargetId && access.canSee);
  const viewReason = !hasTargetId
    ? "Enter or select a Record ID to view"
    : !access.canSee
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
  const commitEnabled = Boolean(!isView && onSubmit && !submitting && access.canInput);
  const commitReason = isView
    ? "Disabled in View mode (Read-Only)"
    : !access.canInput
      ? "Requires Input ('I') permission"
      : undefined;

  // 5. Validate (?✓)
  const validateEnabled = Boolean(!isView && onValidate && !submitting && access.canInput);
  const validateReason = isView
    ? "Disabled in View mode"
    : !access.canInput
      ? "Requires Input ('I') permission"
      : undefined;

  // 6. Hold (❚❚)
  const holdEnabled = Boolean(!isView && onHold && !submitting && access.canHold);
  const holdReason = isView
    ? "Disabled in View mode"
    : !access.canHold
      ? "Requires Input ('I') permission to hold draft"
      : undefined;

  // 7. Delete (✕)
  const deleteEnabled = Boolean(isEdit && onDelete && !submitting && access.canDelete);
  const deleteReason = isView
    ? "Disabled in View mode"
    : isCreate
      ? "Cannot delete an unsaved new record"
      : !access.canDelete
        ? "Requires Delete ('D') permission"
        : undefined;

  // 8. Authorize (✓✓)
  const authorizeEnabled = Boolean(
    isAuth && onAuthorizeReverse && !submitting && access.canAuthorize,
  );
  const authorizeReason =
    isView && !isAuth
      ? "Disabled in View mode"
      : isCreate
        ? "Cannot authorize an uncommitted record"
        : !access.canAuthorize
          ? access.getDisableReason("A") || "Requires Authorize ('A') permission"
          : undefined;

  // 9. Reverse (✕✓)
  const reverseEnabled = Boolean(isAuth && onAuthorizeReverse && !submitting && access.canReverse);
  const reverseReason =
    isView && !isAuth
      ? "Disabled in View mode"
      : isCreate
        ? "Cannot reverse an uncommitted record"
        : !access.canReverse
          ? access.getDisableReason("R") || "Requires Reverse ('R') permission"
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

/**
 * Standard preset More Actions menu items for CBS form screens.
 */
export function getDefaultMoreActions(code: string): MoreActionItem[] {
  const cleanCode = (code || "RECORD").trim().toUpperCase();

  return [
    {
      label: "List Live File",
      onClick: () =>
        toast.add({
          title: "Inquiry",
          description: `Listing active live records for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "List Unauth File",
      onClick: () =>
        toast.add({
          title: "Inquiry",
          description: `Listing unauthorized records for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "List History File",
      onClick: () =>
        toast.add({
          title: "Inquiry",
          description: `Fetching history records for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "R",
    },
    {
      label: "Search Live File",
      onClick: () =>
        toast.add({
          title: "Search",
          description: `Opening Live File search dialog for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "S",
    },
    {
      label: "Search Unauth File",
      onClick: () =>
        toast.add({
          title: "Search",
          description: `Opening Unauthorized File search dialog for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: "S",
    },
  ];
}

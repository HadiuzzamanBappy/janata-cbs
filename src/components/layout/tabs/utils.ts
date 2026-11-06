import type { ConfirmDialogOptions, WorkbenchTab } from "@/store";
import { CbsRecordFunction } from "@/types";

/**
 * Determines whether a tab contains unsaved or modified inputs.
 * Read-only modes (See, Authorize, Reverse, Delete, History) are never considered dirty.
 */
export function isTabDirty(tab: WorkbenchTab): boolean {
  if (tab.screenMode !== CbsRecordFunction.INPUT) {
    return false;
  }
  return tab.isDirty === true;
}

/**
 * Safely closes a tab, prompting for confirmation if unsaved changes exist.
 */
export function promptCloseTab(
  tab: WorkbenchTab,
  onConfirmClose: () => void,
  confirm: (options: ConfirmDialogOptions) => void,
): void {
  if (isTabDirty(tab)) {
    confirm({
      title: `Close "${tab.title}"?`,
      message: "You have unsaved changes in this tab. Closing it will discard your edits.",
      variant: "destructive",
      confirmText: "Discard & Close",
      onConfirm: onConfirmClose,
    });
  } else {
    onConfirmClose();
  }
}

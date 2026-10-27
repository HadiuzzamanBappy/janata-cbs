/**
 * Navigation guard hook for CBS Screens.
 * Intercepts navigation when form is dirty to prevent accidental data loss.
 */
"use client";

import * as React from "react";

export interface UseGuardedActionOptions {
  isDirty?: boolean;
  title?: string;
  message?: string;
}

export interface UseGuardedActionResult {
  guard: (action?: () => void) => void;
  isConfirmOpen: boolean;
  confirmPending: () => void;
  cancelPending: () => void;
  title: string;
  message: string;
}

export function useGuardedAction({
  isDirty = false,
  title = "Discard unsaved changes?",
  message = "You have unsaved edits on this record. Leaving now will discard your changes.",
}: UseGuardedActionOptions): UseGuardedActionResult {
  const [pendingAction, setPendingAction] = React.useState<(() => void) | null>(null);

  const guard = React.useCallback(
    (action?: () => void) => {
      if (!action) return;
      if (isDirty) {
        setPendingAction(() => action);
      } else {
        action();
      }
    },
    [isDirty],
  );

  const confirmPending = React.useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction]);

  const cancelPending = React.useCallback(() => {
    setPendingAction(null);
  }, []);

  return {
    guard,
    isConfirmOpen: pendingAction !== null,
    confirmPending,
    cancelPending,
    title,
    message,
  };
}

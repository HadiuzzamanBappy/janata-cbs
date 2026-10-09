"use client";

import * as React from "react";

export interface CbsHotkeysHandlers {
  onCommit?: () => void;
  onValidate?: () => void;
  onHold?: () => void;
  onAuthorize?: () => void;
  onReturn?: () => void;
  onSearchFocus?: () => void;
}

export interface UseCbsHotkeysOptions {
  enabled?: boolean;
  handlers: CbsHotkeysHandlers;
}

/**
 * Universal Core Banking keyboard dispatcher.
 * Binds terminal function keys globally across screen shells:
 *  - F5 / Ctrl+S: Commit / Save record
 *  - F7: Validate rules
 *  - F8: Authorize record
 *  - Esc: Return to Search / IDLE
 */
export function useCbsHotkeys({ enabled = true, handlers }: UseCbsHotkeysOptions): void {
  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Commit / Save: F5 or Ctrl+S
      if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s")) {
        if (handlers.onCommit) {
          e.preventDefault();
          e.stopPropagation();
          handlers.onCommit();
        }
        return;
      }

      // 2. Validate: F7
      if (e.key === "F7") {
        if (handlers.onValidate) {
          e.preventDefault();
          e.stopPropagation();
          handlers.onValidate();
        }
        return;
      }

      // 3. Authorize: F8
      if (e.key === "F8") {
        if (handlers.onAuthorize) {
          e.preventDefault();
          e.stopPropagation();
          handlers.onAuthorize();
        }
        return;
      }

      // 4. Return to search: Esc (only when no dropdown or modal is capturing)
      if (e.key === "Escape") {
        if (handlers.onReturn) {
          const hasOpenModal = Boolean(
            document.querySelector('[role="dialog"], [data-state="open"]'),
          );
          if (!hasOpenModal) {
            e.preventDefault();
            handlers.onReturn();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handlers]);
}

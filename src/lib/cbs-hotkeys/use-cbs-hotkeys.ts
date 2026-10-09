"use client";

import * as React from "react";
import type { UseCbsHotkeysOptions } from "./types";

/**
 * Universal Core Banking keyboard dispatcher.
 * Binds banking terminal function keys globally across screens:
 *  - F1: Help / Validation checklist
 *  - F2: Create New record
 *  - F3 / Esc: Return to Search / IDLE
 *  - F4: Focus Search input
 *  - F5 / Ctrl+S: Commit / Save draft
 *  - F6: Hold
 *  - F7: Validate rules
 *  - F8: Authorize
 *  - F9: Process action
 *  - F10: Delete record
 *  - F12: Refresh data
 */
export function useCbsHotkeys({ enabled = true, handlers }: UseCbsHotkeysOptions): void {
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const h = handlersRef.current;

      // 1. F1: Help / Validation drawer
      if (e.key === "F1") {
        if (h.onHelp) {
          e.preventDefault();
          e.stopPropagation();
          h.onHelp();
        }
        return;
      }

      // 2. F2: Create New record
      if (e.key === "F2") {
        if (h.onCreateNew) {
          e.preventDefault();
          e.stopPropagation();
          h.onCreateNew();
        }
        return;
      }

      // 3. F3: Return to search / IDLE
      if (e.key === "F3") {
        if (h.onReturn) {
          e.preventDefault();
          e.stopPropagation();
          h.onReturn();
        }
        return;
      }

      // 4. F4: Focus Search bar
      if (e.key === "F4") {
        if (h.onSearchFocus) {
          e.preventDefault();
          e.stopPropagation();
          h.onSearchFocus();
        }
        return;
      }

      // 5. F5 or Ctrl+S: Commit / Save
      if (e.key === "F5" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s")) {
        if (h.onCommit) {
          e.preventDefault();
          e.stopPropagation();
          h.onCommit();
        }
        return;
      }

      // 6. F6: Hold record
      if (e.key === "F6") {
        if (h.onHold) {
          e.preventDefault();
          e.stopPropagation();
          h.onHold();
        }
        return;
      }

      // 7. F7: Validate rules
      if (e.key === "F7") {
        if (h.onValidate) {
          e.preventDefault();
          e.stopPropagation();
          h.onValidate();
        }
        return;
      }

      // 8. F8: Authorize record
      if (e.key === "F8") {
        if (h.onAuthorize) {
          e.preventDefault();
          e.stopPropagation();
          h.onAuthorize();
        }
        return;
      }

      // 9. F9: Process action
      if (e.key === "F9") {
        if (h.onProcessAction) {
          e.preventDefault();
          e.stopPropagation();
          h.onProcessAction();
        }
        return;
      }

      // 10. F10: Delete record
      if (e.key === "F10") {
        if (h.onDelete) {
          e.preventDefault();
          e.stopPropagation();
          h.onDelete();
        }
        return;
      }

      // 11. F12: Refresh data
      if (e.key === "F12") {
        if (h.onRefresh) {
          e.preventDefault();
          e.stopPropagation();
          h.onRefresh();
        }
        return;
      }

      // 12. Esc: Return to search (only when no dropdown/modal is actively capturing)
      if (e.key === "Escape") {
        if (h.onReturn) {
          const hasOpenModal = Boolean(
            document.querySelector('[role="dialog"], [data-state="open"]'),
          );
          if (!hasOpenModal) {
            e.preventDefault();
            h.onReturn();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}

"use client";

import * as React from "react";
import type { CbsHotkeysHandlers, UseCbsHotkeysOptions } from "./types";

/**
 * Minimal 1-to-1 mapping between plain Function Keys and core screen actions.
 */
const CBS_FKEY_ACTION_MAP: Record<string, keyof CbsHotkeysHandlers> = {
  F2: "onCreateNew",
  F5: "onCommit",
  F6: "onHold",
  F7: "onValidate",
  F8: "onAuthorize",
  F10: "onDelete",
};

/**
 * Check if a modal dialog is currently visible on screen.
 */
function isModalActive(): boolean {
  return Boolean(document.querySelector('dialog[open], [role="dialog"][data-state="open"]'));
}

/**
 * Universal CBS screen keyboard dispatcher.
 * Binds minimal screen function keys (F2, F5–F8, F10) and Escape (1 hotkey per operation).
 */
export function useCbsHotkeys({ enabled = true, handlers }: UseCbsHotkeysOptions): void {
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore during IME composition or while any modal dialog is open
      if (e.isComposing || isModalActive()) return;

      const currentHandlers = handlersRef.current;

      // 2. Escape: Return to search/idle
      if (e.key === "Escape") {
        if (currentHandlers.onReturn) {
          e.preventDefault();
          currentHandlers.onReturn();
        }
        return;
      }

      // 3. Banking F-keys must be plain (do not intercept Alt+F4, Ctrl+F5, Shift+F10, etc.)
      const isPlainKey = !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey;
      if (!isPlainKey) return;

      const actionName = CBS_FKEY_ACTION_MAP[e.key];
      if (!actionName) return;

      const action = currentHandlers[actionName];
      if (action) {
        e.preventDefault();
        action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled]);
}

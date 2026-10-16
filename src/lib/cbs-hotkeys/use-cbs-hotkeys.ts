"use client";

import * as React from "react";
import type { CbsHotkeysHandlers, UseCbsHotkeysOptions } from "./types";

/**
 * Standard mapping between plain Function Keys and handler methods.
 */
const CBS_FKEY_ACTION_MAP: Record<string, keyof CbsHotkeysHandlers> = {
  F1: "onHelp",
  F2: "onCreateNew",
  F3: "onReturn",
  F4: "onSearchFocus",
  F5: "onCommit",
  F6: "onHold",
  F7: "onValidate",
  F8: "onAuthorize",
  F9: "onProcessAction",
  F10: "onDelete",
  F12: "onRefresh",
};

/**
 * Check if a modal dialog is currently visible on screen.
 */
function isModalActive(): boolean {
  return Boolean(document.querySelector('dialog[open], [role="dialog"][data-state="open"]'));
}

/**
 * Universal CBS screen keyboard dispatcher.
 * Binds plain F-keys (F1–F12) and Escape to banking operations cleanly.
 */
export function useCbsHotkeys({ enabled = true, handlers }: UseCbsHotkeysOptions): void {
  const handlersRef = React.useRef(handlers);
  handlersRef.current = handlers;

  React.useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore during IME text input composition
      if (e.isComposing) return;

      const currentHandlers = handlersRef.current;

      // 2. Handle Escape (Return to search, only if no modal dialog is open)
      if (e.key === "Escape") {
        if (!isModalActive() && currentHandlers.onReturn) {
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

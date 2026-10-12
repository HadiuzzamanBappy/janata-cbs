"use client";

import { useEffect, useRef } from "react";

/* -------------------------------------------------------------------------- */
/* Hotkey Contract Types                                                      */
/* -------------------------------------------------------------------------- */

export type KeyCombo = string;

export interface HotkeyOptions {
  /** Prevent default browser behavior (default: true) */
  readonly preventDefault?: boolean;
  /** Stop event propagation (default: true) */
  readonly stopPropagation?: boolean;
  /** Enable hotkey even when focused inside an input, textarea, or contentEditable (default: false) */
  readonly enableOnFormTags?: boolean;
  /** Conditionally enable or disable the hotkey handler (default: true) */
  readonly enabled?: boolean;
}

interface ParsedShortcut {
  key: string;
  ctrl: boolean;
  meta: boolean;
  alt: boolean;
  shift: boolean;
  exactCombo: string;
}

/* -------------------------------------------------------------------------- */
/* Key Event Parsing & DOM Target Helpers                                     */
/* -------------------------------------------------------------------------- */

function parseShortcut(combo: string): ParsedShortcut {
  const parts = combo
    .toLowerCase()
    .split("+")
    .map((s) => s.trim());

  let ctrl = false;
  let meta = false;
  let alt = false;
  let shift = false;
  let key = "";

  for (const part of parts) {
    if (part === "ctrl" || part === "control") {
      ctrl = true;
    } else if (part === "meta" || part === "cmd" || part === "command" || part === "win") {
      meta = true;
    } else if (part === "alt" || part === "option") {
      alt = true;
    } else if (part === "shift") {
      shift = true;
    } else {
      key = part;
    }
  }

  return { key, ctrl, meta, alt, shift, exactCombo: combo };
}

function isFormElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false;
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.isContentEditable
  );
}

/* -------------------------------------------------------------------------- */
/* Generic Hotkey Hook                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Modern keyboard shortcut hook supporting combos (e.g. 'ctrl+k', 'alt+shift+n', 'ctrl+w', 'escape').
 * Designed for banking/CBS hotkeys, modal triggers, and tab operations.
 */
export function useHotkeys(
  combo: KeyCombo,
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
): void {
  const {
    preventDefault = true,
    stopPropagation = true,
    enableOnFormTags = false,
    enabled = true,
  } = options;

  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;

    const parsed = parseShortcut(combo);

    const onKeyDown = (event: KeyboardEvent) => {
      // Check form tags
      if (!enableOnFormTags && isFormElement(event.target)) {
        return;
      }

      // Guard: synthetic/programmatic events may have no `key` value
      if (!event.key) return;
      const eventKey = event.key.toLowerCase();

      // Check modifier states
      const ctrlMatches = parsed.ctrl ? event.ctrlKey : !event.ctrlKey;
      const metaMatches = parsed.meta ? event.metaKey : !event.metaKey;
      const altMatches = parsed.alt ? event.altKey : !event.altKey;
      const shiftMatches = parsed.shift ? event.shiftKey : !event.shiftKey;

      // Handle single special keys vs combination
      let keyMatches = false;
      if (parsed.key === "escape" || parsed.key === "esc") {
        keyMatches = eventKey === "escape";
      } else if (parsed.key === "space") {
        keyMatches = eventKey === " " || eventKey === "spacebar";
      } else {
        keyMatches = eventKey === parsed.key;
      }

      if (ctrlMatches && metaMatches && altMatches && shiftMatches && keyMatches) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        handlerRef.current(event);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [combo, preventDefault, stopPropagation, enableOnFormTags, enabled]);
}

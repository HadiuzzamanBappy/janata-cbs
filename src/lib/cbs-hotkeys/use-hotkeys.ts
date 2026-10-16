"use client";

import { useEffect, useRef } from "react";

export interface HotkeyOptions {
  readonly preventDefault?: boolean;
  readonly enableOnFormTags?: boolean;
  readonly enabled?: boolean;
}

interface ParsedCombo {
  targetKey: string;
  wantsMod: boolean;
  wantsShift: boolean;
  wantsAlt: boolean;
}

/**
 * Parses a hotkey string like "ctrl+k", "mod+k", or "escape".
 */
function parseCombo(combo: string): ParsedCombo {
  const tokens = combo
    .toLowerCase()
    .split("+")
    .map((s) => s.trim());

  const wantsMod = tokens.some((t) => ["mod", "ctrl", "control", "cmd", "meta"].includes(t));
  const wantsShift = tokens.includes("shift");
  const wantsAlt = tokens.includes("alt");
  const rawKey =
    tokens.find((t) => !["mod", "ctrl", "control", "cmd", "meta", "shift", "alt"].includes(t)) ||
    "";

  const targetKey = rawKey === "esc" ? "escape" : rawKey;

  return { targetKey, wantsMod, wantsShift, wantsAlt };
}

/**
 * Checks if target element is an interactive text input/form control.
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}

/**
 * Lean hotkey hook for global shortcuts like `ctrl+k`, `mod+k`, `escape`.
 * Automatically maps `mod`/`ctrl` to `Cmd` on macOS and `Ctrl` on Windows/Linux.
 */
export function useHotkeys(
  combo: string,
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
): void {
  const { preventDefault = true, enableOnFormTags = false, enabled = true } = options;

  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;

    const parsed = parseCombo(combo);

    const onKeyDown = (e: KeyboardEvent) => {
      // 1. Ignore during IME text input composition
      if (e.isComposing) return;

      // 2. Ignore if focused inside form input unless explicitly opted in
      if (!enableOnFormTags && isInputElement(e.target)) return;

      // 3. Match modifiers (on macOS Cmd is metaKey, on Windows/Linux Ctrl is ctrlKey)
      const modActive = e.ctrlKey || e.metaKey;
      if (parsed.wantsMod !== modActive) return;
      if (parsed.wantsShift !== e.shiftKey) return;
      if (parsed.wantsAlt !== e.altKey) return;

      // 4. Match target key
      const eventKey = e.key ? e.key.toLowerCase() : "";
      if (eventKey !== parsed.targetKey) return;

      // 5. Trigger action
      if (preventDefault) {
        e.preventDefault();
      }
      handlerRef.current(e);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [combo, preventDefault, enableOnFormTags, enabled]);
}

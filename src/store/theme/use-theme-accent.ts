"use client";

import * as React from "react";
import {
  CBS_THEME_PRESETS,
  type CbsThemeAccent,
  DEFAULT_THEME_ACCENT,
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  type ThemePreset,
} from "@/lib/core-config";

/**
 * Helper to get a cookie value on the client side
 */
function getClientCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Centralized Hook for Theme Accent Management (Janata Brand Color vs B&W vs Future Themes).
 * Uses a single, deterministic mechanism: HTTP Cookie + DOM Attribute synchronization.
 */
export function useThemeAccent() {
  const [accent, setAccentState] = React.useState<CbsThemeAccent>(() => {
    if (typeof document !== "undefined") {
      // 1. Read DOM attribute (already placed on <html> by the server layout using the cookie)
      const domAttr = document.documentElement.getAttribute("data-theme") as CbsThemeAccent;
      if (domAttr && CBS_THEME_PRESETS.some((p) => p.id === domAttr)) {
        return domAttr;
      }
      // 2. Cookie fallback
      const cookieVal = getClientCookie(THEME_COOKIE_NAME) as CbsThemeAccent;
      if (cookieVal && CBS_THEME_PRESETS.some((p) => p.id === cookieVal)) {
        return cookieVal;
      }
    }
    return DEFAULT_THEME_ACCENT;
  });

  const setAccent = React.useCallback((nextAccent: CbsThemeAccent) => {
    setAccentState(nextAccent);

    if (typeof document !== "undefined") {
      // 1. Instantly update DOM root so the UI changes immediately with zero lag
      document.documentElement.setAttribute("data-theme", nextAccent);

      // 2. Persist in Cookie so Next.js Server RootLayout reads it on reload and paints frame 0
      document.cookie = `${THEME_COOKIE_NAME}=${encodeURIComponent(nextAccent)}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  }, []);

  return {
    accent,
    setAccent,
    presets: CBS_THEME_PRESETS as readonly ThemePreset[],
  };
}

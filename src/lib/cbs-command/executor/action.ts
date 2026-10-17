// ============================================================================
// Non-Screen Actions Dispatcher (Settings dialog, Theme toggle, Logout dialog)
// ============================================================================

import type { ParsedCommand } from "../types/command";
import { getCommandAdapter } from "./adapter";

export function dispatchSystemAction(parsed: ParsedCommand): boolean {
  // 1. Settings Dialog
  if (parsed.type === "SETTINGS" && parsed.settingsTabId) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("cbs:open-settings", {
          detail: { tab: parsed.settingsTabId },
        }),
      );
    }
    return true;
  }

  // 2. Action: Theme Toggle
  if (parsed.type === "ACTION" && parsed.actionId === "toggle_theme") {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark");
    }
    return true;
  }

  // 3. Action: Logout Session
  if (parsed.type === "ACTION" && parsed.actionId === "logout") {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cbs:confirm-logout"));
    } else {
      const adapter = getCommandAdapter();
      adapter.logout?.();
    }
    return true;
  }

  return false;
}

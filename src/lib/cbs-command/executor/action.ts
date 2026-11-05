// ============================================================================
// Non-Screen Actions Dispatcher (Settings dialog)
// ============================================================================

import type { ParsedCommand } from "../types/command";

export function dispatchSystemAction(parsed: ParsedCommand): boolean {
  // Settings Dialog
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

  return false;
}

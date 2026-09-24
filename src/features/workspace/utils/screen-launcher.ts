import { dispatchCommand } from "@/lib/core/commands";

export type DisplayTargetMode = "workspace" | "popup";

export interface LaunchScreenOptions {
  id: string;
  title: string;
  componentName?: string;
  target?: DisplayTargetMode;
  addTab: (tab: { id: string; title: string; componentName: string }) => void;
  openSettingsTab?: (tabId: string) => void;
  clearSession?: () => void;
}

/**
 * Domain-driven Launcher for Core Banking Screens & Workflows.
 * Delegates directly to single source of truth core `dispatchCommand`.
 */
export function launchScreen({
  id,
  title,
  componentName = "DYNAMIC_FORM",
  target = "workspace",
  addTab,
  openSettingsTab,
  clearSession,
}: LaunchScreenOptions) {
  if (!id) return;

  const normalizedCmd = id.trim();

  if (target === "popup") {
    const screenUrl = `/screen/${encodeURIComponent(normalizedCmd)}?title=${encodeURIComponent(title)}&component=${encodeURIComponent(componentName)}`;
    const popupFeatures = [
      "popup=yes",
      "width=1160",
      "height=800",
      "resizable=yes",
      "scrollbars=yes",
    ].join(",");
    const windowName = `screen_${normalizedCmd.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
    const win = window.open(screenUrl, windowName, popupFeatures);
    if (win) win.focus();
    return;
  }

  dispatchCommand(
    normalizedCmd,
    { addTab, openSettingsTab, clearSession },
    title,
    componentName,
  );
}

import { appConfig } from "@/lib/config";

export type DisplayTargetMode = "panel" | "window" | "tab";

export interface LaunchScreenOptions {
  id: string;
  title: string;
  componentName?: string;
  addTab: (tab: { id: string; title: string; componentName: string }) => void;
}

/**
 * Domain-driven Launcher for Core Banking Screens & Workflows.
 *
 * Target Modes:
 * - `panel`: Embeds the screen as an active tab inside the multi-tab AppShell layout.
 * - `window`: Opens a standalone popup window for the screen (without full sidebar navigation).
 * - `tab`: Opens a new browser tab targeting the standalone screen URL.
 */
export function launchScreen({
  id,
  title,
  componentName = "DYNAMIC_FORM",
  addTab,
}: LaunchScreenOptions) {
  const target: DisplayTargetMode =
    (appConfig.componentTarget as DisplayTargetMode) || "panel";

  const screenUrl = `/screen/${encodeURIComponent(id)}?title=${encodeURIComponent(title)}&component=${encodeURIComponent(componentName)}`;

  if (target === "window") {
    // Popup window specification
    const popupFeatures = [
      "popup=yes",
      "width=1160",
      "height=800",
      "resizable=yes",
      "scrollbars=yes",
    ].join(",");

    const windowName = `screen_${id.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
    const win = window.open(screenUrl, windowName, popupFeatures);
    if (win) win.focus();
  } else if (target === "tab") {
    // New browser tab
    window.open(screenUrl, "_blank");
  } else {
    // In-page workbench tab (Panel mode)
    addTab({
      id,
      title,
      componentName,
    });
  }
}

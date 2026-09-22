

export type DisplayTargetMode = "workspace" | "popup";

export interface LaunchScreenOptions {
  id: string;
  title: string;
  componentName?: string;
  target?: DisplayTargetMode;
  addTab: (tab: { id: string; title: string; componentName: string }) => void;
}

/**
 * Domain-driven Launcher for Core Banking Screens & Workflows.
 *
 * Target Modes:
 * - `workspace`: Embeds the screen as an active tab inside the multi-tab AppShell layout.
 * - `popup`: Opens a standalone popup window for the screen (without full sidebar navigation).
 */
export function launchScreen({
  id,
  title,
  componentName = "DYNAMIC_FORM",
  target = "workspace",
  addTab,
}: LaunchScreenOptions) {

  const screenUrl = `/screen/${encodeURIComponent(id)}?title=${encodeURIComponent(title)}&component=${encodeURIComponent(componentName)}`;

  if (target === "popup") {
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
  } else {
    // In-page workbench tab (Workspace mode)
    addTab({
      id,
      title,
      componentName,
    });
  }
}

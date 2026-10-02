import { appConfig } from "@/lib/config";
import { dispatchCommand } from "@/lib/core/commands";

export type DisplayTargetMode = "workspace" | "popup";

export interface LaunchScreenOptions {
  id: string;
  title: string;
  componentName?: string;
  target?: DisplayTargetMode;
  screenMode?: "IDLE" | "CREATE" | "EDIT" | "VIEW";
  searchRecordId?: string;
  step?: "SELECTION" | "RESULTS";
  formData?: Record<string, unknown>;
  addTab: (tab: { id: string; title: string; componentName: string }) => void;
  openSettingsTab?: (tabId: string) => void;
  clearSession?: () => void;
  confirmAlert?: (options: {
    title: string;
    message: string;
    variant?: "destructive" | "default";
    confirmText?: string;
    onConfirm: () => void;
  }) => void;
}

/**
 * Universal Screen Launcher: Dispatches command to open either as a workbench tab
 * or a detached browser popup window with query state preservation.
 */
export function launchScreen({
  id,
  title,
  componentName = "DYNAMIC_FORM",
  target = "workspace",
  screenMode,
  searchRecordId,
  step,
  formData,
  addTab,
  openSettingsTab,
  clearSession,
  confirmAlert,
}: LaunchScreenOptions) {
  if (!id) return;

  const normalizedCmd = id.trim();

  if (target === "popup") {
    const params = new URLSearchParams();
    params.set("title", title);
    params.set("component", componentName);
    if (screenMode) params.set("mode", screenMode);
    if (searchRecordId) params.set("recordId", searchRecordId);
    if (step) params.set("step", step);
    if (formData && Object.keys(formData).length > 0) {
      try {
        params.set("data", JSON.stringify(formData));
      } catch {
        // Safe JSON serialization fallback
      }
    }

    const screenUrl = `${appConfig.routes.screen}/${encodeURIComponent(normalizedCmd)}?${params.toString()}`;
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
    { addTab, openSettingsTab, clearSession, confirmAlert },
    title,
    componentName,
    screenMode,
    searchRecordId,
  );
}

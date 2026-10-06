/**
 * Detached Popup Window Dispatcher with Query State Preservation
 */

import { appConfig } from "@/lib/config";
import type { ParsedCommand } from "../types/command";
import type { ExecutionOptions } from "../types/execution";

export function spawnDetachedPopupWindow(parsed: ParsedCommand, options?: ExecutionOptions): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams();
  const title = options?.title || parsed.title;
  const mode = options?.screenMode || parsed.screenMode;
  const recordId = options?.searchRecordId || parsed.recordId;

  params.set("title", title);
  const component = parsed.type === "INQUIRY" ? "INQUIRY_SCREEN" : "DYNAMIC_FORM";
  params.set("component", component);
  if (mode) params.set("mode", mode);
  if (recordId) params.set("recordId", recordId);
  if (parsed.authLevel !== undefined) params.set("authLevel", String(parsed.authLevel));
  if (options?.step) params.set("step", options.step);
  if (options?.currentPage && options.currentPage > 1) {
    params.set("page", String(options.currentPage));
  }
  if (options?.pageSize && options.pageSize !== 10) {
    params.set("pageSize", String(options.pageSize));
  }
  if (options?.criteria && Object.keys(options.criteria).length > 0) {
    try {
      params.set("criteria", JSON.stringify(options.criteria));
    } catch {
      // Safe fallback
    }
  }
  if (options?.formData && Object.keys(options.formData).length > 0) {
    try {
      params.set("data", JSON.stringify(options.formData));
    } catch {
      // Safe fallback
    }
  }

  const screenUrl = `${appConfig.routes.screen}/${encodeURIComponent(parsed.application)}?${params.toString()}`;
  const popupFeatures = [
    "popup=yes",
    "width=1160",
    "height=800",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");

  const windowName = `screen_${parsed.application.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
  const win = window.open(screenUrl, windowName, popupFeatures);
  if (win) win.focus();
}

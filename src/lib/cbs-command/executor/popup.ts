import { clientConfig } from "@/lib/core-config";
import { CBS_SCREEN_COMPONENTS, type ExecutionOptions, type ParsedCommand } from "../types";
import { resolveScreenId } from "./adapter";

/**
 * Spawns a detached browser popup window for dual-monitor banking operations.
 */
export function spawnDetachedPopupWindow(parsed: ParsedCommand, options?: ExecutionOptions): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams();
  const title = options?.title || parsed.title;
  const mode = options?.screenMode || parsed.screenMode;
  const recordId = options?.recordId || parsed.recordId;

  params.set("title", title);
  const component =
    parsed.type === "INQUIRY"
      ? CBS_SCREEN_COMPONENTS.INQUIRY_SCREEN
      : CBS_SCREEN_COMPONENTS.DYNAMIC_FORM;
  params.set("component", component);
  if (mode) params.set("mode", mode);
  if (recordId) params.set("recordId", recordId);
  if (parsed.authLevel !== undefined) params.set("authLevel", String(parsed.authLevel));

  const inquiry = options?.inquiryState;
  if (inquiry?.step) params.set("step", inquiry.step);
  if (inquiry?.currentPage && inquiry.currentPage > 1) {
    params.set("page", String(inquiry.currentPage));
  }
  if (inquiry?.pageSize && inquiry.pageSize !== 10) {
    params.set("pageSize", String(inquiry.pageSize));
  }
  const cleanApp = parsed.application.replace(/[^a-zA-Z0-9]/g, "_");
  const tabId = options?.tabId || `popup_${cleanApp}_${crypto.randomUUID()}`;
  params.set("tabId", tabId);

  // Store large payloads safely in session storage instead of fragile URLs
  if (options?.formData && Object.keys(options.formData).length > 0) {
    sessionStorage.setItem(
      clientConfig.storage.session.draft(tabId),
      JSON.stringify(options.formData),
    );
  }
  if (inquiry?.criteria && Object.keys(inquiry.criteria).length > 0) {
    sessionStorage.setItem(
      clientConfig.storage.session.criteria(tabId),
      JSON.stringify(inquiry.criteria),
    );
  }

  const screenAppKey = resolveScreenId(parsed);
  const screenUrl = `${clientConfig.routes.screen}/${encodeURIComponent(screenAppKey)}?${params.toString()}`;
  const popupFeatures = [
    "popup=yes",
    "width=1160",
    "height=800",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");

  const windowName = `screen_${cleanApp}_${crypto.randomUUID()}`;
  const win = window.open(screenUrl, windowName, popupFeatures);
  if (win) win.focus();
}

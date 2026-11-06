import { clientConfig } from "@/lib/core-config";
import type { ExecutionOptions, ParsedCommand } from "../types";

/**
 * Spawns a detached browser popup window for dual-monitor banking operations.
 */
export function spawnDetachedPopupWindow(parsed: ParsedCommand, options?: ExecutionOptions): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams();
  const title = options?.title || parsed.title;
  const mode = options?.screenMode || parsed.screenMode;
  const recordId = options?.recordId || options?.searchRecordId || parsed.recordId;

  params.set("title", title);
  const component = parsed.type === "INQUIRY" ? "INQUIRY_SCREEN" : "DYNAMIC_FORM";
  params.set("component", component);
  if (mode) params.set("mode", mode);
  if (recordId) params.set("recordId", recordId);
  if (parsed.authLevel !== undefined) params.set("authLevel", String(parsed.authLevel));

  const inquiryState = options?.inquiryState;
  const step = options?.step || inquiryState?.step;
  const currentPage = options?.currentPage || inquiryState?.currentPage;
  const pageSize = options?.pageSize || inquiryState?.pageSize;
  const criteria = options?.criteria || inquiryState?.criteria;

  if (step) params.set("step", step);
  if (currentPage && currentPage > 1) {
    params.set("page", String(currentPage));
  }
  if (pageSize && pageSize !== 10) {
    params.set("pageSize", String(pageSize));
  }
  const cleanApp = parsed.application.replace(/[^a-zA-Z0-9]/g, "_");
  const tabId = options?.tabId || `popup_${cleanApp}_${crypto.randomUUID()}`;
  params.set("tabId", tabId);

  // Store large payloads (150 - 1,000 fields) safely in session storage instead of fragile URLs
  if (options?.formData && Object.keys(options.formData).length > 0) {
    sessionStorage.setItem(
      clientConfig.storage.session.draft(tabId),
      JSON.stringify(options.formData),
    );
  }
  if (criteria && Object.keys(criteria).length > 0) {
    sessionStorage.setItem(clientConfig.storage.session.criteria(tabId), JSON.stringify(criteria));
  }
  const fullFormKey = parsed.version
    ? `${parsed.application},${parsed.version}`
    : parsed.application;
  const screenAppKey =
    parsed.type === "INQUIRY" && !parsed.application.startsWith("INQ ")
      ? `INQ ${parsed.application}`
      : fullFormKey;

  const screenUrl = `${clientConfig.routes.screen}/${encodeURIComponent(screenAppKey)}?${params.toString()}`;
  const popupFeatures = [
    "popup=yes",
    "width=1160",
    "height=800",
    "resizable=yes",
    "scrollbars=yes",
  ].join(",");

  const windowName = `screen_${parsed.application.replace(/[^a-zA-Z0-9]/g, "_")}_${crypto.randomUUID()}`;
  const win = window.open(screenUrl, windowName, popupFeatures);
  if (win) win.focus();
}

/**
 * CBS Workbench Cross-Window Broadcast Bus & Shared Draft Storage
 *
 * Implements a bulletproof, standard BroadcastChannel communication bridge
 * across the main shell and all detached popup windows.
 *
 * Eliminates URL serialization limits and fragile `window.opener` dependencies.
 */

import { clientConfig } from "@/lib/core-config";

export interface WorkbenchBusMessage {
  type: "CBS_DOCK_TAB" | "CBS_TAB_CLOSED" | "CBS_RECORD_SAVED";
  tabId: string;
  payload?: unknown;
}

/**
 * Saves a tab's working draft (including 150+ to 1,000 fields) to shared session storage.
 * Bypasses URL character limits completely.
 */
export function setWorkbenchDraft(tabId: string, data: Record<string, unknown>): void {
  if (typeof window === "undefined" || !tabId) return;
  try {
    sessionStorage.setItem(clientConfig.storage.session.draft(tabId), JSON.stringify(data));
  } catch (err) {
    console.warn(`[WorkbenchBus] Failed to store draft for ${tabId}:`, err);
  }
}

/**
 * Reads a tab's working draft from shared session storage.
 */
export function getWorkbenchDraft<T = Record<string, unknown>>(tabId: string): T | null {
  if (typeof window === "undefined" || !tabId) return null;
  try {
    const raw = sessionStorage.getItem(clientConfig.storage.session.draft(tabId));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Removes a stored working draft once docked or closed.
 */
export function clearWorkbenchDraft(tabId: string): void {
  if (typeof window === "undefined" || !tabId) return;
  try {
    sessionStorage.removeItem(clientConfig.storage.session.draft(tabId));
  } catch {
    // Safe ignore
  }
}

/**
 * Global singleton instance of BroadcastChannel for the workbench bus.
 */
let busInstance: BroadcastChannel | null = null;

export function getWorkbenchBus(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!("BroadcastChannel" in window)) return null;

  if (!busInstance) {
    busInstance = new BroadcastChannel(clientConfig.storage.broadcast.workbenchBus);
  }
  return busInstance;
}

/**
 * Broadcasts a dock event from a popup window to the main shell.
 */
export function broadcastDockTab(tabId: string, payload: unknown): void {
  const bus = getWorkbenchBus();
  if (bus) {
    bus.postMessage({
      type: "CBS_DOCK_TAB",
      tabId,
      payload,
    } satisfies WorkbenchBusMessage);
  }
}

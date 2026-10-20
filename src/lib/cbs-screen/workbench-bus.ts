/**
 * CBS Workbench Cross-Window Broadcast Bus & Shared Draft Storage
 *
 * Implements a standard BroadcastChannel communication bridge
 * across the main shell and all detached popup windows.
 *
 * Eliminates URL serialization limits and fragile `window.opener` dependencies.
 */

import * as React from "react";
import { clientConfig } from "@/lib/core-config";

export interface RecordMutationPayload {
  control: string;
  recordId: string;
}

export interface WorkbenchBusMessage {
  type: "CBS_DOCK_TAB" | "CBS_TAB_CLOSED" | "CBS_RECORD_SAVED" | "CBS_RECORD_MUTATED";
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

/**
 * Broadcasts a record mutation event (create, amend, authorize, reverse, delete)
 * to all open workbench tabs and popup windows.
 */
export function broadcastRecordMutation(control: string, recordId: string): void {
  const bus = getWorkbenchBus();
  if (bus) {
    bus.postMessage({
      type: "CBS_RECORD_MUTATED",
      tabId: "global",
      payload: {
        control: control.toUpperCase().trim(),
        recordId: recordId.toUpperCase().trim(),
      } satisfies RecordMutationPayload,
    } satisfies WorkbenchBusMessage);
  }
}

/**
 * React hook subscribing to record mutation events broadcast across workbench tabs/windows.
 * Enables sibling tabs (and detached popup windows) of the same record/control to refetch.
 */
export function useRecordMutationSubscriber(
  callback: (mutation: RecordMutationPayload) => void,
  controlFilter?: string,
): void {
  React.useEffect(() => {
    const bus = getWorkbenchBus();
    if (!bus) return;

    const handler = (event: MessageEvent<WorkbenchBusMessage>) => {
      if (event.data?.type === "CBS_RECORD_MUTATED" && event.data.payload) {
        const payload = event.data.payload as RecordMutationPayload;
        if (
          !controlFilter ||
          payload.control.toUpperCase() === controlFilter.toUpperCase().trim()
        ) {
          callback(payload);
        }
      }
    };

    bus.addEventListener("message", handler);
    return () => {
      bus.removeEventListener("message", handler);
    };
  }, [callback, controlFilter]);
}

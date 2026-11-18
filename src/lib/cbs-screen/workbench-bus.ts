/**
 * CBS Workbench Cross-Window Broadcast Bus & Shared Draft Storage
 *
 * Implements a standard BroadcastChannel communication bridge and session storage draft cache
 * across the main shell and all detached popup windows.
 *
 * Eliminates URL serialization limits and fragile `window.opener` dependencies.
 */

import * as React from "react";
import { clientConfig } from "@/lib/core-config";
import { cbsStorage, generateIdempotencyKey } from "@/lib/core-utils";

// ============================================================================
// Window & Event Contracts
// ============================================================================

/** Custom DOM event name dispatched by popup header buttons to trigger docking back to shell */
export const CBS_SCREEN_EVENT = {
  DOCK_TO_SHELL: "cbs:dock-to-shell",
} as const;

/** postMessage / BroadcastChannel message types for cross-window coordination */
export const CBS_SCREEN_MESSAGE = {
  DOCK_TAB: "CBS_DOCK_TAB",
  RECORD_MUTATED: "CBS_RECORD_MUTATED",
  CLAIM_ACTIVE_TAB: "CBS_CLAIM_ACTIVE_TAB",
  SESSION_LOGOUT: "CBS_SESSION_LOGOUT",
  SESSION_EXPIRED: "CBS_SESSION_EXPIRED",
  SESSION_RESTORED: "CBS_SESSION_RESTORED",
  SESSION_LOGIN: "CBS_SESSION_LOGIN",
} as const;

/** Canonical popup tab ID — synchronized between page.tsx and popup openers */
export function makePopupTabId(screenId: string): string {
  return `popup-${screenId.replace(/\s+/g, "_")}`;
}

// ============================================================================
// Message Payloads & Message Interfaces
// ============================================================================

export interface RecordMutationPayload {
  control: string;
  recordId: string;
}

export interface WorkbenchBusMessage {
  type: (typeof CBS_SCREEN_MESSAGE)[keyof typeof CBS_SCREEN_MESSAGE];
  tabId: string;
  payload?: unknown;
}

// ============================================================================
// Shared Working Draft Session Cache
// ============================================================================

/**
 * Stages a popup's working draft (150+ to 1,000 fields) in session storage before `window.open`,
 * which copies it into the popup, so large payloads never travel in the URL.
 */
export function setWorkbenchDraft(tabId: string, data: Record<string, unknown>): void {
  if (typeof window === "undefined" || !tabId) return;
  cbsStorage.writeJson("session", clientConfig.storage.session.draft(tabId), data);
}

/**
 * Reads a popup's working draft when the popup creates its tab. After that the tab (persisted by
 * the workbench store) carries the draft across reloads; the staged copy stays as a fallback.
 */
export function getWorkbenchDraft<T = Record<string, unknown>>(tabId: string): T | null {
  if (typeof window === "undefined" || !tabId) return null;
  return cbsStorage.readJson<T>("session", clientConfig.storage.session.draft(tabId));
}

/**
 * Removes every staged popup hand-off in this browser tab. Called only when a different operator
 * logs in, so the same user never loses work across a session timeout.
 */
export function clearAllWorkbenchDrafts(): void {
  if (typeof window === "undefined") return;
  const { draft, criteria } = clientConfig.storage.session;
  cbsStorage.removeByPrefix("session", draft(""), criteria(""));
}

/**
 * Removes a popup's staged hand-off (form draft and inquiry criteria) once the popup docks.
 */
export function clearWorkbenchDraft(tabId: string): void {
  if (typeof window === "undefined" || !tabId) return;
  const { draft, criteria } = clientConfig.storage.session;
  cbsStorage.remove("session", draft(tabId), criteria(tabId));
}

// ============================================================================
// Broadcast Channel Singleton & Dispatchers
// ============================================================================

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
      type: CBS_SCREEN_MESSAGE.DOCK_TAB,
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
      type: CBS_SCREEN_MESSAGE.RECORD_MUTATED,
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
 * Uses a stable callback ref to avoid tearing down and re-adding event listeners on each render.
 */
export function useRecordMutationSubscriber(
  callback: (mutation: RecordMutationPayload) => void,
  controlFilter?: string,
): void {
  const savedCallback = React.useRef(callback);
  savedCallback.current = callback;

  React.useEffect(() => {
    const bus = getWorkbenchBus();
    if (!bus) return;

    const handler = (event: MessageEvent<WorkbenchBusMessage>) => {
      if (event.data?.type === CBS_SCREEN_MESSAGE.RECORD_MUTATED && event.data.payload) {
        const payload = event.data.payload as RecordMutationPayload;
        if (
          !controlFilter ||
          payload.control.toUpperCase() === controlFilter.toUpperCase().trim()
        ) {
          savedCallback.current(payload);
        }
      }
    };

    bus.addEventListener("message", handler);
    return () => {
      bus.removeEventListener("message", handler);
    };
  }, [controlFilter]);
}

// ============================================================================
// Single Tab Instance Identifier
// ============================================================================

/**
 * Canonical browser tab instance identifier.
 * Stable across reloads and navigations in the same tab, but unique across different or duplicated tabs.
 */
export function getTabInstanceId(): string {
  if (typeof window === "undefined") return "";

  const win = window as unknown as { __CBS_TAB_INSTANCE_ID__?: string };
  if (win.__CBS_TAB_INSTANCE_ID__) {
    return win.__CBS_TAB_INSTANCE_ID__;
  }

  // window.name persists across page reloads and navigations in THIS tab,
  // but is reset to "" by modern browsers (Chrome/Edge/Firefox) on duplicated tabs.
  if (window.name?.startsWith("cbs_tab_")) {
    win.__CBS_TAB_INSTANCE_ID__ = window.name;
    cbsStorage.set("session", clientConfig.storage.session.tabInstanceId, window.name);
    return window.name;
  }

  const newId = `cbs_tab_${generateIdempotencyKey().slice(0, 12)}`;
  win.__CBS_TAB_INSTANCE_ID__ = newId;
  try {
    window.name = newId;
  } catch {
    // window.name is read-only in some sandboxed frames
  }
  cbsStorage.set("session", clientConfig.storage.session.tabInstanceId, newId);
  return newId;
}

/**
 * Clears this browser's client-side session markers on logout: the shared idle timestamp
 * (`lastActivity`, whose removal also signals peer tabs) and the single-tab ownership claim.
 */
export function clearClientSession(): void {
  const { lastActivity, activeTabInstance } = clientConfig.storage.local;
  cbsStorage.remove("local", lastActivity, activeTabInstance);
}

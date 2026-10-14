// CBS Screen — Popup Window Communication Contracts
// Single source of truth for cross-window event names, postMessage types, and tab ID helpers.

/** Custom DOM event name dispatched by popup header buttons to trigger docking back to shell */
export const CBS_SCREEN_EVENT = {
  DOCK_TO_SHELL: "cbs:dock-to-shell",
} as const;

/** postMessage type sent from popup window → parent shell (WorkbenchStoreProvider) */
export const CBS_SCREEN_MESSAGE = {
  DOCK_TAB: "CBS_DOCK_TAB",
} as const;

/** Canonical popup tab ID — must match between page.tsx and any popup opener */
export function makePopupTabId(screenId: string): string {
  return `popup-${screenId.replace(/\s+/g, "_")}`;
}


/**
 * CBS Command Adapter & Event Bus
 *
 * Provides a decoupled abstraction layer so that `cbs-command` does not
 * directly depend on `@/store` or any specific state implementation.
 */

import type { ScreenMode } from "../types/command";
import type { UserSecurityProfile } from "../types/validation";

export interface CommandTabPayload {
  screenId: string;
  title: string;
  componentName: string;
  screenMode?: ScreenMode;
  searchRecordId?: string;
  enquiryState?: {
    step?: "SELECTION" | "RESULTS";
    criteria?: Record<string, { value: string; operand: string }>;
    currentPage?: number;
    pageSize?: number;
  };
  formData?: Record<string, unknown>;
}

export interface CommandAdapter {
  /** Get the current user profile for RBAC permission checks */
  getCurrentUser?: () => UserSecurityProfile | null | undefined;
  /** Spawn or open a tab inside the active workspace */
  openTab?: (tab: CommandTabPayload) => void;
  /** Execute logout */
  logout?: () => void;
}

let activeAdapter: CommandAdapter = {};

/**
 * Register a command adapter (e.g. called by WorkbenchProvider / App Shell).
 */
export function registerCommandAdapter(adapter: Partial<CommandAdapter>): () => void {
  activeAdapter = { ...activeAdapter, ...adapter };
  return () => {
    // Unregister by reverting
    activeAdapter = {};
  };
}

/**
 * Access the active command adapter.
 */
export function getCommandAdapter(): CommandAdapter {
  return activeAdapter;
}

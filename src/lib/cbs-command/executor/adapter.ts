// ============================================================================
// CBS Command Adapter & Event Bus
//
// Provides a decoupled abstraction layer so that `cbs-command` does not
// directly depend on `@/store` or any specific state implementation.
// ============================================================================

import type { ScreenMode } from "../types/command";
import type { UserSecurityProfile } from "../types/validation";

export interface CommandTabPayload {
  readonly screenId: string;
  readonly title: string;
  readonly componentName: string;
  readonly screenMode?: ScreenMode;
  readonly searchRecordId?: string;
  readonly enquiryState?: {
    readonly step?: "SELECTION" | "RESULTS";
    readonly criteria?: Record<string, { value: string; operand: string }>;
    readonly currentPage?: number;
    readonly pageSize?: number;
  };
  readonly formData?: Record<string, unknown>;
}

export interface CommandAdapter {
  /** Get the current user profile for RBAC permission checks */
  readonly getCurrentUser?: () => UserSecurityProfile | null | undefined;
  /** Spawn or open a tab inside the active workspace */
  readonly openTab?: (tab: CommandTabPayload) => void;
  /** Execute logout */
  readonly logout?: () => void;
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

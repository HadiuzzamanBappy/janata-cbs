import type { CbsScreenMode, CbsUserSecurityContext } from "@/types";
import type { CommandInquiryState } from "../types";

export interface CommandTabPayload {
  readonly screenId: string;
  readonly title: string;
  readonly componentName: string;
  readonly screenMode?: CbsScreenMode;
  readonly searchRecordId?: string;
  readonly enquiryState?: CommandInquiryState;
  readonly formData?: Record<string, unknown>;
}

export interface CommandAdapter {
  /** Get the current user profile for RBAC permission checks */
  readonly getCurrentUser?: () => CbsUserSecurityContext | null | undefined;
  /** Spawn or open a tab inside the active workspace */
  readonly openTab?: (tab: CommandTabPayload) => void;
}

let activeAdapter: CommandAdapter = {};

/**
 * Register a command adapter (called by WorkbenchProvider / App Shell).
 */
export function registerCommandAdapter(adapter: Partial<CommandAdapter>): () => void {
  activeAdapter = { ...activeAdapter, ...adapter };
  return () => {
    activeAdapter = {};
  };
}

/**
 * Access the active command adapter.
 */
export function getCommandAdapter(): CommandAdapter {
  return activeAdapter;
}

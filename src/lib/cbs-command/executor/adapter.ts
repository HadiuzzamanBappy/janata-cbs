import type { CbsScreenMode, CbsUserSecurityContext } from "@/types";
import type { CommandInquiryState, ParsedCommand } from "../types";

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
  readonly getCurrentUser?: () => CbsUserSecurityContext | null | undefined;
  readonly openTab?: (tab: CommandTabPayload) => void;
}

let activeAdapter: CommandAdapter = {};

export function registerCommandAdapter(adapter: Partial<CommandAdapter>): () => void {
  activeAdapter = { ...activeAdapter, ...adapter };
  return () => {
    activeAdapter = {};
  };
}

export function getCommandAdapter(): CommandAdapter {
  return activeAdapter;
}

/**
 * Resolves the canonical screen identifier string from a parsed command.
 */
export function resolveScreenId(parsed: ParsedCommand): string {
  if (parsed.type === "INQUIRY") {
    return parsed.application.startsWith("INQ ") ? parsed.application : `INQ ${parsed.application}`;
  }
  return parsed.version ? `${parsed.application},${parsed.version}` : parsed.application;
}

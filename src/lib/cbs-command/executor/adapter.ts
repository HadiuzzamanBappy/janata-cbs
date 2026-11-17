import type { InquiryTabState } from "@/lib/data-schemas";
import type { CbsScreenMode, CbsUserSecurityContext } from "@/types";
import type { ParsedCommand } from "../types";

export interface CommandTabPayload {
  readonly screenId: string;
  readonly menuNodeId?: string;
  readonly title: string;
  readonly componentName: string;
  readonly screenMode?: CbsScreenMode;
  readonly searchRecordId?: string;
  readonly inquiryState?: InquiryTabState;
  readonly formData?: Record<string, unknown>;
  readonly authLevel?: number;
}

export type CbsNotificationType = "success" | "info" | "warning" | "error";

export interface CbsNotification {
  readonly title: string;
  readonly description: string;
  readonly type: CbsNotificationType;
}

export interface CommandAdapter {
  readonly getCurrentUser?: () => CbsUserSecurityContext | null | undefined;
  readonly openTab?: (tab: CommandTabPayload) => void;
  /** Surfaces a user-facing notification. Bound to the UI toast layer by `AppNotifier` (L4). */
  readonly notify?: (notification: CbsNotification) => void;
}

type MutableAdapter = { -readonly [K in keyof CommandAdapter]: CommandAdapter[K] };

let activeAdapter: CommandAdapter = {};

/**
 * Merges adapter slots into the bus. The returned disposer removes only the slots this call still
 * owns, so independent providers (session, workbench, notifier) never wipe each other's bindings.
 */
export function registerCommandAdapter(adapter: Partial<CommandAdapter>): () => void {
  activeAdapter = { ...activeAdapter, ...adapter };
  return () => {
    const next: MutableAdapter = { ...activeAdapter };
    for (const key of Object.keys(adapter) as (keyof CommandAdapter)[]) {
      if (activeAdapter[key] === adapter[key]) delete next[key];
    }
    activeAdapter = next;
  };
}

export function getCommandAdapter(): CommandAdapter {
  return activeAdapter;
}

/** Headless notification entry point for `src/lib` (never import `@/components/ui/toast` from lib). */
export function notifyUser(notification: CbsNotification): void {
  activeAdapter.notify?.(notification);
}

/**
 * Resolves the canonical screen identifier string from a parsed command.
 */
export function resolveScreenId(parsed: ParsedCommand): string {
  if (parsed.type === "INQUIRY") {
    return parsed.application.startsWith("INQ ") ? parsed.application : `INQ ${parsed.application}`;
  }
  const base = parsed.version ? `${parsed.application},${parsed.version}` : parsed.application;
  return parsed.authLevel === 0 ? `${base},` : base;
}

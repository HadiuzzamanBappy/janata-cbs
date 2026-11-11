// ============================================================================
// CBS More Actions Resolution & Standard Preset Actions
// ============================================================================

import { toast } from "@/components/ui/toast";
import { CbsRecordFunction } from "@/types";
import type { MoreActionItem } from "./types";

/**
 * Standard preset More Actions menu items for CBS form screens.
 */
export function getDefaultMoreActions(code: string): MoreActionItem[] {
  const cleanCode = (code || "RECORD").trim().toUpperCase();

  return [
    {
      label: "Copy",
      command: "COPY",
      onClick: () =>
        toast.add({
          title: "Copy",
          description: `Copied record data for ${cleanCode}`,
          type: "info",
        }),
    },
    {
      label: "Paste",
      command: "PASTE",
      onClick: () =>
        toast.add({
          title: "Paste",
          description: `Pasted record data into ${cleanCode}`,
          type: "info",
        }),
      requiredRight: CbsRecordFunction.INPUT,
    },
    {
      label: "Search from live",
      command: "SFL",
      onClick: () =>
        toast.add({
          title: "Search from live",
          description: `Searching live file for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: CbsRecordFunction.SEE,
    },
    {
      label: "Search from unauth",
      command: "SFU",
      onClick: () =>
        toast.add({
          title: "Search from unauth",
          description: `Searching unauthorized file for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: CbsRecordFunction.SEE,
    },
    {
      label: "Search from history",
      command: "SFH",
      onClick: () =>
        toast.add({
          title: "Search from history",
          description: `Searching history file for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: CbsRecordFunction.REVERSE,
    },
    {
      label: "Show history record",
      command: "SHR",
      onClick: () =>
        toast.add({
          title: "Show history record",
          description: `Displaying history record for ${cleanCode}`,
          type: "info",
        }),
      requiredRight: CbsRecordFunction.REVERSE,
    },
  ];
}

/**
 * Resolves standard CBS More Actions preset with optional feature extensions.
 * Automatically guarantees all CBS screens inherit standard actions (Copy, Paste, SFL, SFU, etc.)
 * while allowing screens to append custom domain-specific operations.
 */
export function resolveMoreActions(
  commandCode?: string,
  extraActions: MoreActionItem[] = [],
): MoreActionItem[] {
  const baseActions = getDefaultMoreActions(commandCode || "RECORD");
  if (!extraActions || extraActions.length === 0) {
    return baseActions;
  }

  const seen = new Set<string>();
  const merged: MoreActionItem[] = [];

  // Extra actions take precedence over base presets
  for (const item of [...extraActions, ...baseActions]) {
    const key = item.command || item.label;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(item);
    }
  }

  return merged;
}

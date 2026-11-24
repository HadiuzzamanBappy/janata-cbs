// ============================================================================
// CBS More Actions Resolution & Standard Preset Actions
// ============================================================================

import { notifyUser } from "@/lib/cbs-command";
import { CbsRecordFunction } from "@/types";
import type { MoreActionItem } from "./types";

const CLIPBOARD_PREFIX = "cbs:clipboard:";
const STRIPPED_CLIPBOARD_KEYS = new Set(["auditData", "id", "ID", "@ID"]);
const memoryClipboard = new Map<string, Record<string, unknown>>();

function writeClipboard(code: string, payload: Record<string, unknown>): void {
  memoryClipboard.set(code, payload);
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(`${CLIPBOARD_PREFIX}${code}`, JSON.stringify(payload));
    } catch {
      /* sessionStorage quota/unavailable — memoryClipboard still works */
    }
  }
}

function readClipboard(code: string): Record<string, unknown> | null {
  if (typeof window !== "undefined") {
    try {
      const raw = window.sessionStorage.getItem(`${CLIPBOARD_PREFIX}${code}`);
      if (raw) {
        return JSON.parse(raw) as Record<string, unknown>;
      }
    } catch {
      /* fall back to memoryClipboard */
    }
  }
  const mem = memoryClipboard.get(code);
  return mem ? (JSON.parse(JSON.stringify(mem)) as Record<string, unknown>) : null;
}

export interface CopyPasteActionsOptions {
  code: string;
  getValues: () => Record<string, unknown> | null | undefined;
  onPaste: (copied: Record<string, unknown>) => void;
  canPaste?: () => boolean | string;
  validatePaste?: (copied: Record<string, unknown>) => string | null;
}

/**
 * Builds functional Copy & Paste MoreActionItems scoped to a CBS table/command code.
 * Strips audit/identity keys on Copy and merges safely into the active draft on Paste.
 */
export function createCopyPasteActions({
  code,
  getValues,
  onPaste,
  canPaste,
  validatePaste,
}: CopyPasteActionsOptions): MoreActionItem[] {
  const cleanCode = (code || "RECORD").trim().toUpperCase();

  return [
    {
      label: "Copy",
      command: "COPY",
      onClick: () => {
        const current = getValues();
        if (!current || typeof current !== "object") {
          notifyUser({ title: "Copy", description: "Nothing to copy.", type: "warning" });
          return;
        }
        const stripped: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(current)) {
          if (!STRIPPED_CLIPBOARD_KEYS.has(k) && v !== undefined) {
            stripped[k] = v;
          }
        }
        if (Object.keys(stripped).length === 0) {
          notifyUser({ title: "Copy", description: "Nothing to copy.", type: "warning" });
          return;
        }
        writeClipboard(cleanCode, JSON.parse(JSON.stringify(stripped)) as Record<string, unknown>);
        notifyUser({
          title: "Copied",
          description: `Copied ${cleanCode} fields to clipboard.`,
          type: "success",
        });
      },
    },
    {
      label: "Paste",
      command: "PASTE",
      requiredRight: CbsRecordFunction.INPUT,
      onClick: () => {
        const pasteCheck = canPaste ? canPaste() : true;
        if (pasteCheck !== true) {
          notifyUser({
            title: "Paste",
            description:
              typeof pasteCheck === "string"
                ? pasteCheck
                : "Switch to Input mode to paste record data.",
            type: "warning",
          });
          return;
        }
        const copied = readClipboard(cleanCode);
        if (!copied) {
          notifyUser({
            title: "Paste",
            description: `No copied ${cleanCode} record in clipboard.`,
            type: "warning",
          });
          return;
        }
        const validationError = validatePaste?.(copied);
        if (validationError) {
          notifyUser({
            title: "Paste Blocked",
            description: validationError,
            type: "warning",
          });
          return;
        }
        onPaste(copied);
        notifyUser({
          title: "Pasted",
          description: `Pasted ${cleanCode} fields into draft.`,
          type: "success",
        });
      },
    },
  ];
}

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
        notifyUser({
          title: "Copy",
          description: `Copied record data for ${cleanCode}`,
          type: "info",
        }),
    },
    {
      label: "Paste",
      command: "PASTE",
      onClick: () =>
        notifyUser({
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
        notifyUser({
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
        notifyUser({
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
        notifyUser({
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
        notifyUser({
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

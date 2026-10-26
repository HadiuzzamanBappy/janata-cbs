import type { z } from "zod";
import { CBS_SCREEN_MODES, CbsRecordFunction, type CbsScreenMode } from "@/types";

/**
 * Resolves initial record ID from explicit prop, workbench tab state, or window location search.
 */
export function resolveInitialRecordId(initialId?: string, tabSearchId?: string): string {
  if (initialId?.trim()) {
    return initialId.trim().toUpperCase();
  }
  if (tabSearchId?.trim()) {
    return tabSearchId.trim().toUpperCase();
  }
  if (typeof window !== "undefined") {
    const p = new URLSearchParams(window.location.search);
    const urlId = p.get("recordId");
    if (urlId?.trim()) {
      return urlId.trim().toUpperCase();
    }
  }
  return "";
}

// Centrally derived from canonical CBS_SCREEN_MODES (Zero Magic Array)
const VALID_SCREEN_MODES = new Set<string>(CBS_SCREEN_MODES);

/**
 * Resolves initial screen mode from window location search, workbench tab state, or fallback logic.
 */
export function resolveInitialScreenMode(
  tabMode?: string,
  resolvedId?: string,
  fallbackMode: CbsScreenMode = "IDLE",
): CbsScreenMode {
  if (typeof window !== "undefined") {
    const p = new URLSearchParams(window.location.search);
    const urlMode = p.get("mode");
    if (urlMode && VALID_SCREEN_MODES.has(urlMode)) {
      return urlMode as CbsScreenMode;
    }
  }

  if (tabMode && VALID_SCREEN_MODES.has(tabMode)) {
    return tabMode as CbsScreenMode;
  }

  return resolvedId ? CbsRecordFunction.INPUT : fallbackMode;
}

/**
 * Resolves initial form data from tab cache, safely validated via Zod schema if supplied.
 */
export function resolveInitialFormData<TRecord>(
  tabFormData: unknown,
  schema: z.ZodType<TRecord> | undefined,
  initialData: TRecord,
): TRecord {
  if (tabFormData && typeof tabFormData === "object") {
    if (schema) {
      const parseResult = schema.safeParse(tabFormData);
      if (parseResult.success) {
        return parseResult.data;
      }
    } else {
      return tabFormData as TRecord;
    }
  }
  return initialData;
}

// ============================================================================
// CBS Screen Zod Validation & Focus Utilities
// ============================================================================

"use client";

import type { z } from "zod";
import type { CbsScreenValidationError } from "./types";

/**
 * Generalized mapper from ZodIssue list to CBS tabbed error list.
 */
export function mapZodIssuesToTabs<TTab extends string = string>(
  issues: z.ZodIssue[],
  tabResolver: (path: (string | number)[], issue: z.ZodIssue) => TTab,
): CbsScreenValidationError<TTab>[] {
  return issues.map((issue, idx) => {
    const stringOrNumberPath = issue.path.map((p) => (typeof p === "symbol" ? p.toString() : p));
    const tab = tabResolver(stringOrNumberPath, issue);
    const fieldKey = stringOrNumberPath.join(".") || "Record";
    return {
      id: `err_${idx}_${fieldKey}`,
      tab,
      fieldKey,
      message: issue.message,
    };
  });
}

/**
 * Focuses and scrolls to a form field by field key, name attribute, or id.
 */
export function focusFormField(fieldKey?: string, nodeId?: string): boolean {
  if (typeof document === "undefined") return false;

  const selectors = [
    fieldKey ? `[data-field="${fieldKey}"]` : null,
    fieldKey ? `[name="${fieldKey}"]` : null,
    fieldKey ? `#${fieldKey}` : null,
    fieldKey ? `[id$="${fieldKey}"]` : null,
    nodeId ? `[data-node-id="${nodeId}"]` : null,
  ].filter(Boolean) as string[];

  for (const selector of selectors) {
    const el = document.querySelector(selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      const focusable = (
        el.matches("input, select, textarea, button")
          ? el
          : el.querySelector("input, select, textarea, button")
      ) as HTMLElement | null;

      if (focusable && typeof focusable.focus === "function") {
        setTimeout(() => focusable.focus(), 80);
      }
      return true;
    }
  }

  return false;
}

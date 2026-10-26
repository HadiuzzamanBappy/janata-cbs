// ============================================================================
// CBS Screen Zod Validation & Focus Utilities
// ============================================================================

import type { z } from "zod";
import type { CbsScreenValidationError } from "./types";

/**
 * Escapes CSS selector identifiers safely across browser and test environments.
 */
function escapeCss(value: string): string {
  if (typeof CSS !== "undefined" && typeof CSS.escape === "function") {
    return CSS.escape(value);
  }
  return value.replace(/([ #;?%&,.+*~':"!^$[\]()=>|/@])/g, "\\$1");
}

/**
 * Generalized mapper from ZodIssue list to CBS tabbed error list.
 */
export function mapZodIssuesToTabs<TTab extends string = string>(
  issues: z.ZodIssue[],
  tabResolver: (path: (string | number)[], issue: z.ZodIssue) => TTab,
): CbsScreenValidationError<TTab>[] {
  return issues.map((issue, idx) => {
    const stringOrNumberPath = issue.path.map((p) =>
      typeof p === "symbol" ? p.toString() : String(p),
    );
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

  const escapedKey = fieldKey ? escapeCss(fieldKey) : null;
  const escapedNodeId = nodeId ? escapeCss(nodeId) : null;

  const selectors = [
    escapedKey ? `[data-field="${fieldKey}"]` : null,
    escapedKey ? `[name="${fieldKey}"]` : null,
    escapedKey ? `#${escapedKey}` : null,
    escapedKey ? `[id$="${escapedKey}"]` : null,
    escapedNodeId ? `[data-node-id="${nodeId}"]` : null,
  ].filter(Boolean) as string[];

  for (const selector of selectors) {
    try {
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
    } catch {
      // Continue to next fallback selector if one fails syntax parsing
    }
  }

  return false;
}

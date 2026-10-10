"use client";

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

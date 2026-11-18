import { resolveCommandAlias } from "@/lib/cbs-command";
import type { MenuItem } from "@/lib/data-schemas";

/**
 * Checks if two command identifiers or aliases match the same canonical screen or target.
 */
export function isCommandMatch(cmdA?: string, cmdB?: string): boolean {
  if (!cmdA || !cmdB) return false;
  const a = cmdA.trim().toUpperCase();
  const b = cmdB.trim().toUpperCase();
  if (a === b) return true;

  const canonicalA = resolveCommandAlias(a);
  const canonicalB = resolveCommandAlias(b);

  return canonicalA === canonicalB || canonicalA === b || canonicalB === a;
}

/**
 * Helper to check if a tree node or any of its descendants matches the active command/screen ID.
 * When menuNodeId is specified, uses strict node ID matching to prevent duplicate branch expansion.
 */
export function hasActiveChild(node: MenuItem, activeId?: string, menuNodeId?: string): boolean {
  if (!activeId) return false;
  if (menuNodeId) {
    if (node.id === menuNodeId) {
      return true;
    }
  } else if (isCommandMatch(node.command ?? node.id, activeId)) {
    return true;
  }
  if (node.children && node.children.length > 0) {
    return node.children.some((child) => hasActiveChild(child, activeId, menuNodeId));
  }
  return false;
}

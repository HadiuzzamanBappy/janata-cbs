import { getCanonicalScreenKey, resolveCommandAlias } from "@/lib/cbs-command";
import type { MenuItem } from "@/lib/data-schemas";

export function mapMenuItemToTreeNode(item: MenuItem): MenuItem {
  return item;
}

/**
 * Checks if two command identifiers or aliases match the same canonical screen or target.
 */
export function isCommandMatch(cmdA?: string, cmdB?: string): boolean {
  if (!cmdA || !cmdB) return false;
  const a = cmdA.trim().toUpperCase();
  const b = cmdB.trim().toUpperCase();
  if (a === b) return true;

  const canonicalA = getCanonicalScreenKey(a) || resolveCommandAlias(a);
  const canonicalB = getCanonicalScreenKey(b) || resolveCommandAlias(b);

  if (canonicalA && canonicalB && canonicalA.toUpperCase() === canonicalB.toUpperCase()) {
    return true;
  }
  if (canonicalA && canonicalA.toUpperCase() === b) {
    return true;
  }
  if (canonicalB && a === canonicalB.toUpperCase()) {
    return true;
  }
  return false;
}

/**
 * Helper to check if a tree node or any of its descendants matches the active command/screen ID
 */
export function hasActiveChild(node: MenuItem, activeId?: string): boolean {
  if (!activeId) return false;
  if (isCommandMatch(node.command ?? node.id, activeId)) {
    return true;
  }
  if (node.children && node.children.length > 0) {
    return node.children.some((child) => hasActiveChild(child, activeId));
  }
  return false;
}

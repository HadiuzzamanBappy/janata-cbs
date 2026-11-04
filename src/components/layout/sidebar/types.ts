import { getCanonicalScreenKey, resolveCommandAlias } from "@/lib/cbs-command";
import type { MenuAction, MenuItem, MenuType } from "@/lib/data-schemas";

export interface TreeNode {
  id: string;
  title: string;
  command?: string;
  componentName?: string;
  menuType?: MenuType;
  menuAction?: MenuAction;
  children?: TreeNode[];
}

export function mapMenuItemToTreeNode(item: MenuItem): TreeNode {
  return {
    id: item.id,
    title: item.label,
    command: item.command,
    componentName: item.command ? item.command.replace(/\./g, "_") : undefined,
    menuType: item.menuType,
    menuAction: item.menuAction,
    children: item.children?.map(mapMenuItemToTreeNode),
  };
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
export function hasActiveChild(node: TreeNode, activeId?: string): boolean {
  if (!activeId) return false;
  if (isCommandMatch(node.command ?? node.id, activeId)) {
    return true;
  }
  if (node.children && node.children.length > 0) {
    return node.children.some((child) => hasActiveChild(child, activeId));
  }
  return false;
}

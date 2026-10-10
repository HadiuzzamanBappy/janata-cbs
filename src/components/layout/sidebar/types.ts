import type { MenuItem } from "@/lib/data-schemas";

export interface TreeNode {
  id: string;
  title: string;
  command?: string;
  componentName?: string;
  children?: TreeNode[];
}

export function mapMenuItemToTreeNode(item: MenuItem): TreeNode {
  return {
    id: item.id,
    title: item.label,
    command: item.command,
    componentName: item.command ? item.command.replace(/\./g, "_") : undefined,
    children: item.children?.map(mapMenuItemToTreeNode),
  };
}

/**
 * Helper to check if a tree node or any of its descendants matches the active command/screen ID
 */
export function hasActiveChild(node: TreeNode, activeId?: string): boolean {
  if (!activeId) return false;
  if (
    node.command === activeId ||
    node.id === activeId ||
    node.command?.toUpperCase() === activeId.toUpperCase()
  ) {
    return true;
  }
  if (node.children && node.children.length > 0) {
    return node.children.some((child) => hasActiveChild(child, activeId));
  }
  return false;
}

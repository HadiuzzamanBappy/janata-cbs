import {
  isMenuFolderNode,
  type MenuAction,
  type MenuCatalogActionItem,
  type MenuItem,
  type MenuType,
} from "@/lib/data-schemas/menu-designer-schema";

/* -------------------------------------------------------------------------- */
/* Query & Inspection Helpers                                                 */
/* -------------------------------------------------------------------------- */

export function findNode(tree: MenuItem[], id: string): MenuItem | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children?.length > 0) {
      const match = findNode(node.children, id);
      if (match) return match;
    }
  }
  return null;
}

export function countTreeNodes(tree: MenuItem[]): number {
  let count = 0;
  for (const node of tree) {
    count += 1;
    if (node.children?.length > 0) {
      count += countTreeNodes(node.children);
    }
  }
  return count;
}

export function isItemInTree(
  tree: MenuItem[],
  menuId?: number | string,
  command?: string,
): boolean {
  const numericId = typeof menuId === "number" ? menuId : parseInt(String(menuId || 0), 10);
  const cleanCmd = command?.trim().toUpperCase();

  for (const node of tree) {
    if (numericId > 0 && node.menuId === numericId) return true;
    if (cleanCmd && node.command?.trim().toUpperCase() === cleanCmd) return true;
    if (node.children?.length > 0 && isItemInTree(node.children, menuId, command)) {
      return true;
    }
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/* Node Mutation & CRUD Operations                                            */
/* -------------------------------------------------------------------------- */

export function addCatalogItemToTree(
  tree: MenuItem[],
  item: MenuCatalogActionItem,
  parentId: string | null = null,
  targetIndex?: number,
): MenuItem[] {
  const numericMenuId = parseInt(item.id, 10) || 0;
  if (isItemInTree(tree, numericMenuId, item.command)) {
    return tree;
  }

  const isGroup = item.menuType === "GROUP" || !item.command?.trim();
  const newNode: MenuItem = {
    id: `node_${crypto.randomUUID().slice(0, 8)}`,
    menuId: numericMenuId || undefined,
    label: item.label,
    command: item.command?.trim().toUpperCase() || undefined,
    componentName: item.command ? item.command.replace(/\./g, "_") : undefined,
    menuType: (item.menuType as MenuType) || (isGroup ? "GROUP" : "FORM"),
    menuAction: (item.menuAction as MenuAction) || "SCREEN",
    isVisible: true,
    orderIndex: 0,
    children: [],
  };

  if (!parentId) {
    const next = [...tree];
    const insertAt =
      typeof targetIndex === "number" && targetIndex >= 0 && targetIndex <= next.length
        ? targetIndex
        : next.length;
    next.splice(insertAt, 0, newNode);
    return next.map((n, idx) => ({ ...n, orderIndex: idx + 1 }));
  }

  function insertIntoParent(list: MenuItem[]): MenuItem[] {
    return list.map((node) => {
      if (node.id === parentId) {
        if (!isMenuFolderNode(node)) return node;
        const nextChildren = [...node.children];
        const insertAt =
          typeof targetIndex === "number" && targetIndex >= 0 && targetIndex <= nextChildren.length
            ? targetIndex
            : nextChildren.length;
        nextChildren.splice(insertAt, 0, newNode);
        return {
          ...node,
          children: nextChildren.map((c, idx) => ({ ...c, orderIndex: idx + 1 })),
        };
      }
      if (node.children?.length > 0) {
        return { ...node, children: insertIntoParent(node.children) };
      }
      return node;
    });
  }

  return insertIntoParent(tree);
}

export function updateNodeInTree(
  tree: MenuItem[],
  nodeId: string,
  patch: Partial<MenuItem>,
): MenuItem[] {
  function cascadeVisibility(children: MenuItem[], isVisible: boolean): MenuItem[] {
    return children.map((c) => ({
      ...c,
      isVisible,
      children: c.children?.length > 0 ? cascadeVisibility(c.children, isVisible) : [],
    }));
  }

  function updateInList(list: MenuItem[]): MenuItem[] {
    return list.map((node) => {
      if (node.id === nodeId) {
        const updated = { ...node, ...patch };
        if (patch.isVisible !== undefined && node.children?.length > 0) {
          updated.children = cascadeVisibility(node.children, patch.isVisible);
        }
        return updated;
      }
      if (node.children?.length > 0) {
        return { ...node, children: updateInList(node.children) };
      }
      return node;
    });
  }

  return updateInList(tree);
}

export function deleteNodeFromTree(tree: MenuItem[], nodeId: string): MenuItem[] {
  function removeFromList(list: MenuItem[]): MenuItem[] {
    return list
      .filter((n) => n.id !== nodeId)
      .map((n, idx) => ({
        ...n,
        orderIndex: idx + 1,
        children: n.children?.length > 0 ? removeFromList(n.children) : [],
      }));
  }
  return removeFromList(tree);
}

export function ungroupFolderInTree(tree: MenuItem[], folderId: string): MenuItem[] {
  function ungroup(list: MenuItem[]): MenuItem[] {
    const result: MenuItem[] = [];
    for (const item of list) {
      if (item.id === folderId) {
        if (item.children?.length > 0) {
          result.push(...item.children);
        }
      } else {
        result.push({
          ...item,
          children: item.children?.length > 0 ? ungroup(item.children) : [],
        });
      }
    }
    return result.map((item, idx) => ({ ...item, orderIndex: idx + 1 }));
  }
  return ungroup(tree);
}


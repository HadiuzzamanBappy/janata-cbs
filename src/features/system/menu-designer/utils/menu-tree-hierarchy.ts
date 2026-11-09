import { isMenuFolderNode, type MenuItem } from "@/lib/data-schemas/menu-designer-schema";

/* -------------------------------------------------------------------------- */
/* Shared Internal Helpers                                                    */
/* -------------------------------------------------------------------------- */

function reindexList(list: MenuItem[]): MenuItem[] {
  return list.map((item, idx) => ({ ...item, orderIndex: idx + 1 }));
}

function extractNode(
  tree: MenuItem[],
  targetId: string,
): { remaining: MenuItem[]; extracted: MenuItem | null } {
  let extracted: MenuItem | null = null;

  function traverse(list: MenuItem[]): MenuItem[] {
    return list
      .filter((item) => {
        if (item.id === targetId) {
          extracted = item;
          return false;
        }
        return true;
      })
      .map((item) => ({
        ...item,
        children: item.children?.length > 0 ? traverse(item.children) : [],
      }));
  }

  const remaining = traverse(tree);
  return { remaining, extracted };
}

/* -------------------------------------------------------------------------- */
/* Structural Hierarchy & Spatial Transformations                             */
/* -------------------------------------------------------------------------- */

export function reorderNodeInTree(tree: MenuItem[], activeId: string, overId: string): MenuItem[] {
  if (activeId === overId) return tree;

  const { remaining, extracted } = extractNode(tree, activeId);
  if (!extracted) return tree;
  const nodeToMove: MenuItem = extracted;

  let targetParentId: string | null = null;
  let targetIndex = -1;

  function findOverNode(list: MenuItem[], parentId: string | null): boolean {
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === overId) {
        targetParentId = parentId;
        targetIndex = i;
        return true;
      }
      if (list[i].children?.length > 0 && findOverNode(list[i].children, list[i].id)) {
        return true;
      }
    }
    return false;
  }

  findOverNode(remaining, null);
  if (targetIndex === -1) return tree;

  if (!targetParentId) {
    const nextList = [...remaining];
    nextList.splice(targetIndex, 0, nodeToMove);
    return reindexList(nextList);
  }

  function insert(list: MenuItem[]): MenuItem[] {
    return list.map((node) => {
      if (node.id === targetParentId) {
        const nextChildren = [...node.children];
        nextChildren.splice(targetIndex, 0, nodeToMove);
        return {
          ...node,
          children: reindexList(nextChildren),
        };
      }
      if (node.children?.length > 0) {
        return { ...node, children: insert(node.children) };
      }
      return node;
    });
  }

  return insert(remaining);
}

export function shiftNodeOrderInTree(
  tree: MenuItem[],
  nodeId: string,
  direction: -1 | 1,
): MenuItem[] {
  function reorder(list: MenuItem[]): MenuItem[] {
    const idx = list.findIndex((n) => n.id === nodeId);
    if (idx !== -1) {
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= list.length) return list;
      const updated = [...list];
      const [moved] = updated.splice(idx, 1);
      if (moved) updated.splice(targetIdx, 0, moved);
      return reindexList(updated);
    }
    return list.map((item) => {
      if (item.children?.length > 0) {
        return { ...item, children: reorder(item.children) };
      }
      return item;
    });
  }
  return reorder(tree);
}

export function indentNodeInTree(tree: MenuItem[], nodeId: string): MenuItem[] {
  let candidateParentId: string | null = null;

  function findPreviousSibling(list: MenuItem[]) {
    for (let i = 1; i < list.length; i++) {
      if (list[i].id === nodeId) {
        const prev = list[i - 1];
        if (isMenuFolderNode(prev)) {
          candidateParentId = prev.id;
        }
        return;
      }
      if (list[i].children?.length > 0) {
        findPreviousSibling(list[i].children);
      }
    }
  }

  findPreviousSibling(tree);
  if (!candidateParentId) return tree;

  const { remaining: cleanTree, extracted } = extractNode(tree, nodeId);
  if (!extracted) return tree;
  const nodeToNest: MenuItem = extracted;

  function insert(list: MenuItem[]): MenuItem[] {
    return list.map((item) => {
      if (item.id === candidateParentId) {
        const nextChildren = [...item.children, nodeToNest];
        return {
          ...item,
          children: reindexList(nextChildren),
        };
      }
      if (item.children?.length > 0) {
        return { ...item, children: insert(item.children) };
      }
      return item;
    });
  }

  return insert(cleanTree);
}

export function outdentNodeInTree(tree: MenuItem[], nodeId: string): MenuItem[] {
  let directParentId: string | null = null;
  let grandParentId: string | null = null;

  function findLineage(
    list: MenuItem[],
    parent: string | null = null,
    grandParent: string | null = null,
  ): boolean {
    for (const item of list) {
      if (item.id === nodeId) {
        directParentId = parent;
        grandParentId = grandParent;
        return true;
      }
      if (item.children?.length > 0 && findLineage(item.children, item.id, parent)) {
        return true;
      }
    }
    return false;
  }

  findLineage(tree);
  if (!directParentId) return tree;

  const { remaining: cleanTree, extracted } = extractNode(tree, nodeId);
  if (!extracted) return tree;
  const nodeToPromote: MenuItem = extracted;

  if (!grandParentId) {
    const parentIdx = cleanTree.findIndex((i) => i.id === directParentId);
    const insertAt = parentIdx !== -1 ? parentIdx + 1 : cleanTree.length;
    const nextTree = [...cleanTree];
    nextTree.splice(insertAt, 0, nodeToPromote);
    return reindexList(nextTree);
  }

  function insertAtGrandParent(list: MenuItem[]): MenuItem[] {
    return list.map((item) => {
      if (item.id === grandParentId) {
        const pIdx = item.children.findIndex((c) => c.id === directParentId);
        const insertAt = pIdx !== -1 ? pIdx + 1 : item.children.length;
        const nextChildren = [...item.children];
        nextChildren.splice(insertAt, 0, nodeToPromote);
        return {
          ...item,
          children: reindexList(nextChildren),
        };
      }
      if (item.children?.length > 0) {
        return { ...item, children: insertAtGrandParent(item.children) };
      }
      return item;
    });
  }

  return insertAtGrandParent(cleanTree);
}

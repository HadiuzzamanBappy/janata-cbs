import * as React from "react";
import type { MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";

export function useMdDragReorder(
  setNodes: (updater: (prev: MenuTreeNode[]) => MenuTreeNode[]) => void,
) {
  const moveNode = React.useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;

      setNodes((prevNodes) => {
        let draggedNode: MenuTreeNode | null = null;

        function extract(list: MenuTreeNode[]): MenuTreeNode[] {
          return list
            .filter((node) => {
              if (node.id === activeId) {
                draggedNode = node;
                return false;
              }
              return true;
            })
            .map((node) => ({
              ...node,
              children: extract(node.children),
            }));
        }

        const remaining = extract(prevNodes);
        if (!draggedNode) return prevNodes;
        const nodeToMove: MenuTreeNode = draggedNode;

        let targetParentId: string | null = null;
        let targetIndex = -1;

        function findOverNode(list: MenuTreeNode[], parentId: string | null): boolean {
          for (let i = 0; i < list.length; i++) {
            if (list[i].id === overId) {
              targetParentId = parentId;
              targetIndex = i;
              return true;
            }
            if (list[i].children && list[i].children.length > 0) {
              if (findOverNode(list[i].children, list[i].id)) return true;
            }
          }
          return false;
        }

        findOverNode(remaining, null);
        if (targetIndex === -1) return prevNodes;

        if (!targetParentId) {
          const newList = [...remaining];
          newList.splice(targetIndex, 0, nodeToMove);
          return newList.map((n, i) => ({ ...n, orderIndex: i + 1 }));
        }

        function insert(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === targetParentId) {
              const newChildren = [...node.children];
              newChildren.splice(targetIndex, 0, nodeToMove);
              return {
                ...node,
                children: newChildren.map((c, i) => ({ ...c, orderIndex: i + 1 })),
              };
            }
            if (node.children.length > 0) {
              return { ...node, children: insert(node.children) };
            }
            return node;
          });
        }

        return insert(remaining);
      });
    },
    [setNodes],
  );

  const moveNodeOrder = React.useCallback(
    (nodeId: string, direction: -1 | 1) => {
      setNodes((prevNodes) => {
        function reorder(list: MenuTreeNode[]): MenuTreeNode[] {
          const idx = list.findIndex((n) => n.id === nodeId);
          if (idx !== -1) {
            const targetIdx = idx + direction;
            if (targetIdx < 0 || targetIdx >= list.length) return list;
            const updated = [...list];
            const [moved] = updated.splice(idx, 1);
            if (moved) updated.splice(targetIdx, 0, moved);
            return updated.map((item, i) => ({ ...item, orderIndex: i + 1 }));
          }
          return list.map((item) => {
            if (item.children.length > 0) {
              return { ...item, children: reorder(item.children) };
            }
            return item;
          });
        }
        return reorder(prevNodes);
      });
    },
    [setNodes],
  );

  const moveNodeParent = React.useCallback(
    (draggedId: string, targetParentId: string | null) => {
      if (draggedId === targetParentId) return;

      setNodes((prevNodes) => {
        let draggedNode: MenuTreeNode | null = null;

        function isDescendant(node: MenuTreeNode, id: string): boolean {
          if (node.id === id) return true;
          return (node.children || []).some((child) => isDescendant(child, id));
        }

        function findNode(list: MenuTreeNode[], id: string): MenuTreeNode | null {
          for (const item of list) {
            if (item.id === id) return item;
            if (item.children?.length > 0) {
              const found = findNode(item.children, id);
              if (found) return found;
            }
          }
          return null;
        }

        const draggedCandidate = findNode(prevNodes, draggedId);
        if (targetParentId && draggedCandidate && isDescendant(draggedCandidate, targetParentId)) {
          return prevNodes;
        }

        function extract(list: MenuTreeNode[]): MenuTreeNode[] {
          return list
            .filter((node) => {
              if (node.id === draggedId) {
                draggedNode = node;
                return false;
              }
              return true;
            })
            .map((node) => ({
              ...node,
              children: extract(node.children),
            }));
        }

        const remaining = extract(prevNodes);
        if (!draggedNode) return prevNodes;
        const nodeToMove: MenuTreeNode = draggedNode;

        if (!targetParentId) {
          return [
            { ...nodeToMove, orderIndex: 1 },
            ...remaining.map((n) => ({ ...n, orderIndex: n.orderIndex + 1 })),
          ];
        }

        function insert(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === targetParentId) {
              return {
                ...node,
                children: [
                  { ...nodeToMove, orderIndex: 1 },
                  ...node.children.map((c) => ({ ...c, orderIndex: c.orderIndex + 1 })),
                ],
              };
            }
            if (node.children.length > 0) {
              return { ...node, children: insert(node.children) };
            }
            return node;
          });
        }

        return insert(remaining);
      });
    },
    [setNodes],
  );

  const indentNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        let candidateParentId: string | null = null;
        function findPreviousSibling(list: MenuTreeNode[]) {
          const idx = list.findIndex((n) => n.id === nodeId);
          if (idx > 0) {
            candidateParentId = list[idx - 1].id;
            return;
          }
          for (const item of list) {
            if (item.children.length > 0) {
              findPreviousSibling(item.children);
              if (candidateParentId) return;
            }
          }
        }
        findPreviousSibling(prevNodes);
        if (!candidateParentId) return prevNodes;

        let draggedNode: MenuTreeNode | null = null;
        function extract(list: MenuTreeNode[]): MenuTreeNode[] {
          return list
            .filter((node) => {
              if (node.id === nodeId) {
                draggedNode = node;
                return false;
              }
              return true;
            })
            .map((node) => ({
              ...node,
              children: extract(node.children),
            }));
        }
        const remaining = extract(prevNodes);
        if (!draggedNode) return prevNodes;
        const nodeToMove: MenuTreeNode = draggedNode;

        function insert(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === candidateParentId) {
              return {
                ...node,
                children: [
                  ...node.children,
                  { ...nodeToMove, orderIndex: node.children.length + 1 },
                ],
              };
            }
            if (node.children.length > 0) {
              return { ...node, children: insert(node.children) };
            }
            return node;
          });
        }
        return insert(remaining);
      });
    },
    [setNodes],
  );

  const outdentNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        let directParentId: string | null = null;
        let grandParentId: string | null = null;

        function findParents(
          list: MenuTreeNode[],
          currentParent: string | null,
          grandParent: string | null,
        ) {
          for (const item of list) {
            if (item.id === nodeId) {
              directParentId = currentParent;
              grandParentId = grandParent;
              return;
            }
            if (item.children.length > 0) {
              findParents(item.children, item.id, currentParent);
              if (directParentId) return;
            }
          }
        }

        findParents(prevNodes, null, null);
        if (!directParentId) return prevNodes;

        let draggedNode: MenuTreeNode | null = null;
        function extract(list: MenuTreeNode[]): MenuTreeNode[] {
          return list
            .filter((node) => {
              if (node.id === nodeId) {
                draggedNode = node;
                return false;
              }
              return true;
            })
            .map((node) => ({
              ...node,
              children: extract(node.children),
            }));
        }

        const remaining = extract(prevNodes);
        if (!draggedNode) return prevNodes;
        const nodeToMove: MenuTreeNode = draggedNode;

        if (!grandParentId) {
          const directParentIndex = remaining.findIndex((n) => n.id === directParentId);
          const insertIdx = directParentIndex >= 0 ? directParentIndex + 1 : remaining.length;
          const updated = [...remaining];
          updated.splice(insertIdx, 0, nodeToMove);
          return updated.map((item, i) => ({ ...item, orderIndex: i + 1 }));
        }

        function insertAtGrandParent(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === grandParentId) {
              const directParentIndex = node.children.findIndex((c) => c.id === directParentId);
              const insertIdx =
                directParentIndex >= 0 ? directParentIndex + 1 : node.children.length;
              const newChildren = [...node.children];
              newChildren.splice(insertIdx, 0, nodeToMove);
              return {
                ...node,
                children: newChildren.map((c, i) => ({ ...c, orderIndex: i + 1 })),
              };
            }
            if (node.children.length > 0) {
              return { ...node, children: insertAtGrandParent(node.children) };
            }
            return node;
          });
        }

        return insertAtGrandParent(remaining);
      });
    },
    [setNodes],
  );

  return {
    moveNode,
    moveNodeOrder,
    moveNodeParent,
    indentNode,
    outdentNode,
  };
}

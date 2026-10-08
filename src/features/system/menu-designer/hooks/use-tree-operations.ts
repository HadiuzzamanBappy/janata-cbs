"use client";

import * as React from "react";
import type {
  MenuCatalogActionItem,
  MenuTreeNode,
} from "@/lib/schemas/menu-designer-schema";

export function useTreeOperations(
  nodes: MenuTreeNode[],
  setNodes: (updater: (prev: MenuTreeNode[]) => MenuTreeNode[]) => void,
) {
  const [collapsedNodeIds, setCollapsedNodeIds] = React.useState<Set<string>>(new Set());

  const toggleCollapse = React.useCallback((nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  const addCatalogItem = React.useCallback(
    (item: MenuCatalogActionItem, parentId: string | null = null) => {
      const numericMenuId = parseInt(item.id, 10) || 0;
      const newNode: MenuTreeNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        menuId: numericMenuId,
        label: item.label,
        command: item.command || "",
        isVisible: true,
        orderIndex: 0,
        children: [],
      };

      setNodes((prevNodes) => {
        if (!parentId) {
          return [...prevNodes, { ...newNode, orderIndex: prevNodes.length + 1 }];
        }

        function insertIntoParent(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                children: [
                  ...node.children,
                  { ...newNode, orderIndex: node.children.length + 1 },
                ],
              };
            }
            if (node.children.length > 0) {
              return { ...node, children: insertIntoParent(node.children) };
            }
            return node;
          });
        }

        return insertIntoParent(prevNodes);
      });
    },
    [setNodes],
  );

  const addCustomGroup = React.useCallback(
    (label: string = "New Group", parentId: string | null = null) => {
      const newNode: MenuTreeNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        menuId: 0,
        label,
        command: "",
        isVisible: true,
        orderIndex: 0,
        children: [],
      };

      setNodes((prevNodes) => {
        if (!parentId) {
          return [...prevNodes, { ...newNode, orderIndex: prevNodes.length + 1 }];
        }

        function insertIntoParent(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                children: [
                  ...node.children,
                  { ...newNode, orderIndex: node.children.length + 1 },
                ],
              };
            }
            if (node.children.length > 0) {
              return { ...node, children: insertIntoParent(node.children) };
            }
            return node;
          });
        }

        return insertIntoParent(prevNodes);
      });
    },
    [setNodes],
  );

  const updateNode = React.useCallback(
    (nodeId: string, patch: Partial<MenuTreeNode>) => {
      setNodes((prevNodes) => {
        function patchRecursive(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === nodeId) {
              return { ...node, ...patch };
            }
            if (node.children.length > 0) {
              return { ...node, children: patchRecursive(node.children) };
            }
            return node;
          });
        }
        return patchRecursive(prevNodes);
      });
    },
    [setNodes],
  );

  const deleteNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        function removeRecursive(list: MenuTreeNode[]): MenuTreeNode[] {
          return list
            .filter((node) => node.id !== nodeId)
            .map((node) => ({
              ...node,
              children: removeRecursive(node.children),
            }));
        }
        return removeRecursive(prevNodes);
      });
    },
    [setNodes],
  );

  const moveNodeOrder = React.useCallback(
    (nodeId: string, direction: -1 | 1) => {
      setNodes((prevNodes) => {
        function reorder(list: MenuTreeNode[]): MenuTreeNode[] {
          const index = list.findIndex((n) => n.id === nodeId);
          if (index !== -1) {
            const targetIndex = index + direction;
            if (targetIndex < 0 || targetIndex >= list.length) return list;
            const updated = [...list];
            const [moved] = updated.splice(index, 1);
            updated.splice(targetIndex, 0, moved);
            return updated.map((item, idx) => ({ ...item, orderIndex: idx + 1 }));
          }

          return list.map((node) => {
            if (node.children.length > 0) {
              return { ...node, children: reorder(node.children) };
            }
            return node;
          });
        }
        return reorder(prevNodes);
      });
    },
    [setNodes],
  );

  const moveNodeParent = React.useCallback(
    (draggedId: string, targetParentId: string | null) => {
      setNodes((prevNodes) => {
        let draggedNode: MenuTreeNode | null = null;

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
          return [...remaining, { ...nodeToMove, orderIndex: remaining.length + 1 }];
        }

        function insert(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === targetParentId) {
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

  return {
    nodes,
    collapsedNodeIds,
    toggleCollapse,
    addCatalogItem,
    addCustomGroup,
    updateNode,
    deleteNode,
    moveNodeOrder,
    moveNodeParent,
  };
}

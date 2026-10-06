"use client";

import * as React from "react";
import type { MenuCatalogItem, MenuNode } from "../types";

export function useTreeOperations(setNodes: React.Dispatch<React.SetStateAction<MenuNode[]>>) {
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
    (item: MenuCatalogItem, parentId: string | null = null) => {
      const newNode: MenuNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        menuId: item.id,
        label: item.label,
        command: item.command,
        isVisible: true,
        orderIndex: 0,
        children: [],
      };

      setNodes((prevNodes) => {
        if (!parentId) {
          return [...prevNodes, { ...newNode, orderIndex: prevNodes.length + 1 }];
        }

        function insertIntoParent(list: MenuNode[]): MenuNode[] {
          return list.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                children: [...node.children, { ...newNode, orderIndex: node.children.length + 1 }],
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
      const newNode: MenuNode = {
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

        function insertIntoParent(list: MenuNode[]): MenuNode[] {
          return list.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                children: [...node.children, { ...newNode, orderIndex: node.children.length + 1 }],
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
    (nodeId: string, patch: Partial<MenuNode>) => {
      setNodes((prevNodes) => {
        function patchRecursive(list: MenuNode[]): MenuNode[] {
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
        function removeRecursive(list: MenuNode[]): MenuNode[] {
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
        function reorder(list: MenuNode[]): MenuNode[] {
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
        let draggedNode: MenuNode | null = null;

        function extract(list: MenuNode[]): MenuNode[] {
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
        const nodeToMove: MenuNode = draggedNode;

        if (!targetParentId) {
          return [...remaining, { ...nodeToMove, orderIndex: remaining.length + 1 }];
        }

        function insert(list: MenuNode[]): MenuNode[] {
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

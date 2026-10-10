"use client";

import * as React from "react";
import type { MenuCatalogActionItem, MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";

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
      const targetCmd = item.command?.trim().toUpperCase();

      setNodes((prevNodes) => {
        // Prevent adding duplicate item: check if menuId or command is already anywhere in the tree
        function isAlreadyInTree(list: MenuTreeNode[]): boolean {
          for (const node of list) {
            if (numericMenuId > 0 && node.menuId === numericMenuId) {
              return true;
            }
            if (targetCmd && node.command && node.command.trim().toUpperCase() === targetCmd) {
              return true;
            }
            if (node.children && node.children.length > 0 && isAlreadyInTree(node.children)) {
              return true;
            }
          }
          return false;
        }

        if (isAlreadyInTree(prevNodes)) {
          return prevNodes;
        }

        const newNode: MenuTreeNode = {
          id: `node_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          menuId: numericMenuId,
          label: item.label,
          command: item.command || "",
          isVisible: true,
          orderIndex: 0,
          children: [],
        };

        if (!parentId) {
          return [
            { ...newNode, orderIndex: 1 },
            ...prevNodes.map((n) => ({ ...n, orderIndex: n.orderIndex + 1 })),
          ];
        }

        function insertIntoParent(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                children: [
                  { ...newNode, orderIndex: 1 },
                  ...node.children.map((c) => ({ ...c, orderIndex: c.orderIndex + 1 })),
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
          return [
            { ...newNode, orderIndex: 1 },
            ...prevNodes.map((n) => ({ ...n, orderIndex: n.orderIndex + 1 })),
          ];
        }

        function insertIntoParent(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                children: [
                  { ...newNode, orderIndex: 1 },
                  ...node.children.map((c) => ({ ...c, orderIndex: c.orderIndex + 1 })),
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

  const expandAll = React.useCallback(() => {
    setCollapsedNodeIds(new Set());
  }, []);

  const collapseAll = React.useCallback(() => {
    const allParentIds = new Set<string>();
    function collectParentIds(list: MenuTreeNode[]) {
      for (const node of list) {
        if (node.children && node.children.length > 0) {
          allParentIds.add(node.id);
          collectParentIds(node.children);
        }
      }
    }
    collectParentIds(nodes);
    setCollapsedNodeIds(allParentIds);
  }, [nodes]);

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

  // Ungroup: Remove the folder node and promote its children directly into its place
  const ungroupNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        function ungroupRecursive(list: MenuTreeNode[]): MenuTreeNode[] {
          const result: MenuTreeNode[] = [];
          for (const node of list) {
            if (node.id === nodeId) {
              // Promote children
              if (node.children && node.children.length > 0) {
                result.push(...node.children);
              }
            } else {
              result.push({
                ...node,
                children: ungroupRecursive(node.children || []),
              });
            }
          }
          return result.map((item, idx) => ({ ...item, orderIndex: idx + 1 }));
        }
        return ungroupRecursive(prevNodes);
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

  // Indent (Nesting into previous sibling group or converting previous sibling to a group)
  const indentNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        function indentRecursive(list: MenuTreeNode[]): { list: MenuTreeNode[]; handled: boolean } {
          const index = list.findIndex((n) => n.id === nodeId);
          if (index > 0) {
            const prevSibling = list[index - 1];
            const nodeToIndent = list[index];

            const updatedPrevSibling: MenuTreeNode = {
              ...prevSibling,
              children: [
                ...(prevSibling.children || []),
                { ...nodeToIndent, orderIndex: (prevSibling.children?.length || 0) + 1 },
              ],
            };

            const updatedList = [
              ...list.slice(0, index - 1),
              updatedPrevSibling,
              ...list.slice(index + 1),
            ].map((n, i) => ({ ...n, orderIndex: i + 1 }));

            return { list: updatedList, handled: true };
          }

          // Search in children
          let childHandled = false;
          const newList = list.map((node) => {
            if (!childHandled && node.children && node.children.length > 0) {
              const res = indentRecursive(node.children);
              if (res.handled) {
                childHandled = true;
                return { ...node, children: res.list };
              }
            }
            return node;
          });

          return { list: newList, handled: childHandled };
        }

        return indentRecursive(prevNodes).list;
      });
    },
    [setNodes],
  );

  // Outdent (Promoting node up to parent's sibling level)
  const outdentNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        function outdentRecursive(list: MenuTreeNode[]): {
          list: MenuTreeNode[];
          extracted: MenuTreeNode | null;
          handled: boolean;
        } {
          for (let i = 0; i < list.length; i++) {
            const parent = list[i];
            if (!parent.children || parent.children.length === 0) continue;

            const childIdx = parent.children.findIndex((c) => c.id === nodeId);
            if (childIdx !== -1) {
              const extractedNode = parent.children[childIdx];
              const updatedChildren = parent.children
                .filter((c) => c.id !== nodeId)
                .map((c, idx) => ({ ...c, orderIndex: idx + 1 }));

              const updatedParent = { ...parent, children: updatedChildren };
              // Insert extractedNode right after parent in list
              const nextList = [
                ...list.slice(0, i),
                updatedParent,
                { ...extractedNode, orderIndex: i + 2 },
                ...list.slice(i + 1),
              ].map((item, idx) => ({ ...item, orderIndex: idx + 1 }));

              return { list: nextList, extracted: null, handled: true };
            }

            // Recurse deeper
            const deeper = outdentRecursive(parent.children);
            if (deeper.handled) {
              const nextChildren = deeper.list;
              const nextList = [
                ...list.slice(0, i),
                { ...parent, children: nextChildren },
                ...list.slice(i + 1),
              ];
              return { list: nextList, extracted: null, handled: true };
            }
          }
          return { list, extracted: null, handled: false };
        }

        return outdentRecursive(prevNodes).list;
      });
    },
    [setNodes],
  );

  const moveNodeParent = React.useCallback(
    (draggedId: string, targetParentId: string | null) => {
      setNodes((prevNodes) => {
        let draggedNode: MenuTreeNode | null = null;

        // Prevent dragging a node inside itself or any of its descendants
        function isDescendant(node: MenuTreeNode, targetId: string): boolean {
          if (node.id === targetId) return true;
          return Boolean(node.children?.some((child) => isDescendant(child, targetId)));
        }

        function findNode(list: MenuTreeNode[], targetId: string): MenuTreeNode | null {
          for (const item of list) {
            if (item.id === targetId) return item;
            if (item.children?.length) {
              const found = findNode(item.children, targetId);
              if (found) return found;
            }
          }
          return null;
        }

        const draggedCandidate = findNode(prevNodes, draggedId);
        if (targetParentId && draggedCandidate && isDescendant(draggedCandidate, targetParentId)) {
          // Circular nesting prevented
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

  const moveNode = React.useCallback(
    (activeId: string, overId: string) => {
      if (activeId === overId) return;

      setNodes((prevNodes) => {
        let draggedNode: MenuTreeNode | null = null;

        // 1. Extract the dragged node
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

        // 2. Find target parent and index in the remaining tree
        let targetParentId: string | null = null;
        let targetIndex = -1;

        function findOverNode(list: MenuTreeNode[], parentId: string | null) {
          for (let i = 0; i < list.length; i++) {
            if (list[i].id === overId) {
              targetParentId = parentId;
              targetIndex = i;
              return true;
            }
            if (list[i].children && list[i].children.length > 0) {
              if (findOverNode(list[i].children, list[i].id)) {
                return true;
              }
            }
          }
          return false;
        }

        findOverNode(remaining, null);

        // If for some reason overId wasn't found (maybe it was the dragged node's child), abort
        if (targetIndex === -1) return prevNodes;

        // 3. Insert into the target parent at the specified index
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

  return {
    nodes,
    collapsedNodeIds,
    toggleCollapse,
    expandAll,
    collapseAll,
    addCatalogItem,
    addCustomGroup,
    updateNode,
    deleteNode,
    ungroupNode,
    moveNodeOrder,
    indentNode,
    outdentNode,
    moveNodeParent,
    moveNode,
  };
}

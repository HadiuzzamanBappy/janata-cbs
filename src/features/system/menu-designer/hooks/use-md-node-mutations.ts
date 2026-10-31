import * as React from "react";
import type { MenuCatalogActionItem, MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";

export function useMdNodeMutations(
  setNodes: (updater: (prev: MenuTreeNode[]) => MenuTreeNode[]) => void,
) {
  const addCatalogItem = React.useCallback(
    (item: MenuCatalogActionItem, parentId: string | null = null) => {
      const numericMenuId = parseInt(item.id, 10) || 0;
      const targetCmd = item.command?.trim().toUpperCase();

      setNodes((prevNodes) => {
        function isAlreadyInTree(list: MenuTreeNode[]): boolean {
          for (const node of list) {
            if (numericMenuId > 0 && node.menuId === numericMenuId) return true;
            if (targetCmd && node.command && node.command.trim().toUpperCase() === targetCmd) {
              return true;
            }
            if (node.children && node.children.length > 0 && isAlreadyInTree(node.children)) {
              return true;
            }
          }
          return false;
        }

        if (isAlreadyInTree(prevNodes)) return prevNodes;

        const newNode: MenuTreeNode = {
          id: `node_${crypto.randomUUID().slice(0, 8)}`,
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
              // Rule: Only group folders can accept children
              if (node.command || node.menuId !== 0) {
                return node;
              }
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

  const addFolder = React.useCallback(
    (label: string = "New Group", parentId: string | null = null) => {
      const newFolder: MenuTreeNode = {
        id: `node_${crypto.randomUUID().slice(0, 8)}`,
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
            ...prevNodes.map((n) => ({ ...n, orderIndex: n.orderIndex + 1 })),
            { ...newFolder, orderIndex: prevNodes.length + 1 },
          ];
        }

        function insertFolder(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                children: [
                  ...node.children,
                  { ...newFolder, orderIndex: node.children.length + 1 },
                ],
              };
            }
            if (node.children.length > 0) {
              return { ...node, children: insertFolder(node.children) };
            }
            return node;
          });
        }

        return insertFolder(prevNodes);
      });
    },
    [setNodes],
  );

  const updateNode = React.useCallback(
    (nodeId: string, patch: Partial<MenuTreeNode>) => {
      setNodes((prevNodes) => {
        function cascadeVisibility(children: MenuTreeNode[], isVisible: boolean): MenuTreeNode[] {
          return children.map((c) => ({
            ...c,
            isVisible,
            children: c.children?.length > 0 ? cascadeVisibility(c.children, isVisible) : [],
          }));
        }

        function updateInList(list: MenuTreeNode[]): MenuTreeNode[] {
          return list.map((node) => {
            if (node.id === nodeId) {
              const updated = { ...node, ...patch };
              // Cascade visibility if isVisible changed on a group/folder
              if (patch.isVisible !== undefined && node.children && node.children.length > 0) {
                updated.children = cascadeVisibility(node.children, patch.isVisible);
              }
              return updated;
            }
            if (node.children.length > 0) {
              return { ...node, children: updateInList(node.children) };
            }
            return node;
          });
        }
        return updateInList(prevNodes);
      });
    },
    [setNodes],
  );

  const deleteNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        function removeFromList(list: MenuTreeNode[]): MenuTreeNode[] {
          return list
            .filter((node) => node.id !== nodeId)
            .map((node, idx) => ({
              ...node,
              orderIndex: idx + 1,
              children: removeFromList(node.children),
            }));
        }
        return removeFromList(prevNodes);
      });
    },
    [setNodes],
  );

  const ungroupNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prevNodes) => {
        function ungroup(list: MenuTreeNode[]): MenuTreeNode[] {
          const res: MenuTreeNode[] = [];
          for (const node of list) {
            if (node.id === nodeId) {
              res.push(...node.children);
            } else {
              res.push({
                ...node,
                children: ungroup(node.children),
              });
            }
          }
          return res.map((n, i) => ({ ...n, orderIndex: i + 1 }));
        }
        return ungroup(prevNodes);
      });
    },
    [setNodes],
  );

  return {
    addCatalogItem,
    addFolder,
    updateNode,
    deleteNode,
    ungroupNode,
  };
}

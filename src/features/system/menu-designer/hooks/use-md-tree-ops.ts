"use client";

import * as React from "react";
import type { MenuCatalogActionItem, MenuItem } from "@/lib/data-schemas/menu-designer-schema";
import {
  indentNodeInTree,
  outdentNodeInTree,
  reorderNodeInTree,
  shiftNodeOrderInTree,
} from "../utils/menu-tree-hierarchy";
import {
  addCatalogItemToTree,
  deleteNodeFromTree,
  ungroupFolderInTree,
  updateNodeInTree,
} from "../utils/menu-tree-ops";

export function useMdTreeOps(
  nodes: MenuItem[],
  setNodes: (updater: (prev: MenuItem[]) => MenuItem[]) => void,
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

  const expandAll = React.useCallback(() => {
    setCollapsedNodeIds(new Set());
  }, []);

  const collapseAll = React.useCallback(() => {
    const allParentIds = new Set<string>();
    function collectParentIds(list: MenuItem[]) {
      for (const item of list) {
        if (item.children?.length > 0) {
          allParentIds.add(item.id);
          collectParentIds(item.children);
        }
      }
    }
    collectParentIds(nodes);
    setCollapsedNodeIds(allParentIds);
  }, [nodes]);

  const addCatalogItem = React.useCallback(
    (item: MenuCatalogActionItem, parentId: string | null = null, targetIndex?: number) => {
      setNodes((prev) => addCatalogItemToTree(prev, item, parentId, targetIndex));
    },
    [setNodes],
  );

  const updateNode = React.useCallback(
    (nodeId: string, patch: Partial<MenuItem>) => {
      setNodes((prev) => updateNodeInTree(prev, nodeId, patch));
    },
    [setNodes],
  );

  const deleteNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prev) => deleteNodeFromTree(prev, nodeId));
    },
    [setNodes],
  );

  const ungroupNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prev) => ungroupFolderInTree(prev, nodeId));
    },
    [setNodes],
  );

  const moveNode = React.useCallback(
    (activeId: string, overId: string) => {
      setNodes((prev) => reorderNodeInTree(prev, activeId, overId));
    },
    [setNodes],
  );

  const moveNodeOrder = React.useCallback(
    (nodeId: string, direction: -1 | 1) => {
      setNodes((prev) => shiftNodeOrderInTree(prev, nodeId, direction));
    },
    [setNodes],
  );

  const indentNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prev) => indentNodeInTree(prev, nodeId));
    },
    [setNodes],
  );

  const outdentNode = React.useCallback(
    (nodeId: string) => {
      setNodes((prev) => outdentNodeInTree(prev, nodeId));
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
    updateNode,
    deleteNode,
    ungroupNode,
    moveNodeOrder,
    indentNode,
    outdentNode,
    moveNode,
  };
}

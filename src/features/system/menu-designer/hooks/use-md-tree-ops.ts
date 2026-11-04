"use client";

import * as React from "react";
import type { MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";
import { useMdDragReorder } from "./use-md-drag-reorder";
import { useMdNodeMutations } from "./use-md-node-mutations";

export function useMdTreeOps(
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

  const expandAll = React.useCallback(() => {
    setCollapsedNodeIds(new Set());
  }, []);

  const collapseAll = React.useCallback(() => {
    const allParentIds = new Set<string>();
    function collectParentIds(list: MenuTreeNode[]) {
      for (const item of list) {
        if (item.children && item.children.length > 0) {
          allParentIds.add(item.id);
          collectParentIds(item.children);
        }
      }
    }
    collectParentIds(nodes);
    setCollapsedNodeIds(allParentIds);
  }, [nodes]);

  const { addCatalogItem, updateNode, deleteNode, ungroupNode } = useMdNodeMutations(setNodes);
  const { moveNode, moveNodeOrder, moveNodeParent, indentNode, outdentNode } =
    useMdDragReorder(setNodes);

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
    moveNodeParent,
    moveNode,
  };
}

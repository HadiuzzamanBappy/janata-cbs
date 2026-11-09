"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import * as React from "react";
import type { MenuCatalogActionItem, MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";

interface UseCanvasDndOptions {
  nodes: MenuTreeNode[];
  isReadOnly?: boolean;
  onDropCatalogItem: (
    item: MenuCatalogActionItem,
    parentId?: string | null,
    targetIndex?: number,
  ) => void;
  onMoveNode?: (activeId: string, overId: string) => void;
}

export function useCanvasDnd({
  nodes,
  isReadOnly,
  onDropCatalogItem,
  onMoveNode,
}: UseCanvasDndOptions) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const findNodeInfo = React.useCallback(
    (
      targetId: string,
    ): {
      targetNode: MenuTreeNode | null;
      parentNode: MenuTreeNode | null;
      targetIndex: number;
    } => {
      let targetNode: MenuTreeNode | null = null;
      let parentNode: MenuTreeNode | null = null;
      let targetIndex = -1;

      function traverse(list: MenuTreeNode[], parent: MenuTreeNode | null): boolean {
        for (let i = 0; i < list.length; i++) {
          const current = list[i];
          if (current.id === targetId) {
            targetNode = current;
            parentNode = parent;
            targetIndex = i;
            return true;
          }
          if (current.children && current.children.length > 0) {
            if (traverse(current.children, current)) return true;
          }
        }
        return false;
      }

      traverse(nodes, null);
      return { targetNode, parentNode, targetIndex };
    },
    [nodes],
  );

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || isReadOnly) return;

      const activeId = String(active.id);
      const overId = String(over.id);

      // Scenario A: Dragged from Action Catalog
      if (activeId.startsWith("catalog-")) {
        const itemData = active.data.current?.item as MenuCatalogActionItem | undefined;
        if (!itemData) return;

        // Dropped onto an existing tree node
        const { targetNode, parentNode, targetIndex } = findNodeInfo(overId);
        if (targetNode) {
          const isGroupFolder = !targetNode.command;
          if (isGroupFolder) {
            // Drop inside this folder at the end
            onDropCatalogItem(itemData, targetNode.id);
          } else {
            // Dropped on a leaf item -> place next to it in the same parent
            const parentId = parentNode ? parentNode.id : null;
            onDropCatalogItem(itemData, parentId, targetIndex + 1);
          }
          return;
        }

        // Default fallback: add to root
        onDropCatalogItem(itemData, null);
        return;
      }

      // Scenario B: Reordering or reparenting within Tree
      if (onMoveNode) {
        onMoveNode(activeId, overId);
      }
    },
    [isReadOnly, onDropCatalogItem, findNodeInfo, onMoveNode],
  );

  return {
    sensors,
    handleDragEnd,
  };
}

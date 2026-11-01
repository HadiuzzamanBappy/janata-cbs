"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import * as React from "react";
import type {
  MenuCatalogActionItem,
  MenuTreeNode,
  MenuTreeRecord,
} from "@/lib/data-schemas/menu-designer-schema";
import { MenuCatalogSidebar } from "./canvas/menu-catalog-sidebar";
import { MenuTreeCanvas } from "./canvas/menu-tree-canvas";
import { NodeInspector } from "./canvas/node-inspector";

interface MdCanvasTabProps {
  nodes: MenuTreeNode[];
  formData: MenuTreeRecord;
  setFormData: React.Dispatch<React.SetStateAction<MenuTreeRecord>>;
  catalogItems: MenuCatalogActionItem[];
  catalogLoading: boolean;
  collapsedNodeIds: Set<string>;
  onToggleCollapse: (id: string) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onUpdateNode: (id: string, patch: Partial<MenuTreeNode>) => void;
  onDeleteNode: (id: string) => void;
  onUngroupNode?: (id: string) => void;
  onIndentNode?: (id: string) => void;
  onOutdentNode?: (id: string) => void;
  onMoveOrder: (id: string, direction: -1 | 1) => void;
  onMoveNode?: (activeId: string, overId: string) => void;
  onAddSubgroup: (parentId: string | null) => void;
  onDropCatalogItem: (
    item: MenuCatalogActionItem,
    parentId?: string | null,
    targetIndex?: number,
  ) => void;
  isReadOnly?: boolean;
}

export function MdCanvasTab({
  nodes,
  formData,
  setFormData,
  catalogItems,
  catalogLoading,
  collapsedNodeIds,
  onToggleCollapse,
  onExpandAll,
  onCollapseAll,
  onUpdateNode,
  onDeleteNode,
  onUngroupNode,
  onIndentNode,
  onOutdentNode,
  onMoveOrder,
  onMoveNode,
  onAddSubgroup,
  onDropCatalogItem,
  isReadOnly,
}: MdCanvasTabProps) {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  // Configure Dnd sensors
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

  // Helper to find a node and its parent info by ID
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

  // Find currently selected node in tree
  const selectedNode = React.useMemo(() => {
    if (!selectedNodeId) return null;
    function find(list: MenuTreeNode[]): MenuTreeNode | null {
      for (const node of list) {
        if (node.id === selectedNodeId) return node;
        if (node.children?.length > 0) {
          const match = find(node.children);
          if (match) return match;
        }
      }
      return null;
    }
    return find(nodes);
  }, [nodes, selectedNodeId]);

  // Collect all menuIds and commands currently present in the menu tree
  const { addedMenuIds, addedCommands } = React.useMemo(() => {
    const ids = new Set<string>();
    const cmds = new Set<string>();

    function traverse(list: MenuTreeNode[]) {
      for (const node of list) {
        if (node.menuId !== undefined && node.menuId !== null && node.menuId !== 0) {
          ids.add(String(node.menuId));
        }
        if (node.command?.trim()) {
          cmds.add(node.command.trim().toUpperCase());
        }
        if (node.children && node.children.length > 0) {
          traverse(node.children);
        }
      }
    }

    traverse(nodes);
    return { addedMenuIds: ids, addedCommands: cmds };
  }, [nodes]);

  const handleDeleteWithSelection = React.useCallback(
    (id: string) => {
      if (selectedNodeId === id) setSelectedNodeId(null);
      onDeleteNode(id);
    },
    [selectedNodeId, onDeleteNode],
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex h-full w-full gap-3 overflow-hidden">
        {/* 30% Left Pane: Action Catalog (MENU) */}
        <MenuCatalogSidebar
          items={catalogItems}
          loading={catalogLoading}
          addedMenuIds={addedMenuIds}
          addedCommands={addedCommands}
          onAddItem={(item) => onDropCatalogItem(item, null)}
          disabled={isReadOnly}
        />

        {/* Center Pane: Interactive Menu Tree Canvas */}
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <MenuTreeCanvas
            nodes={nodes}
            collapsedNodeIds={collapsedNodeIds}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            onToggleCollapse={onToggleCollapse}
            onExpandAll={onExpandAll}
            onCollapseAll={onCollapseAll}
            onUpdateNode={onUpdateNode}
            onDeleteNode={handleDeleteWithSelection}
            onUngroupNode={onUngroupNode}
            onIndentNode={onIndentNode}
            onOutdentNode={onOutdentNode}
            onMoveOrder={onMoveOrder}
            onAddSubgroup={onAddSubgroup}
            onDropCatalogItem={onDropCatalogItem}
            isReadOnly={isReadOnly}
          />
        </div>

        {/* Right Pane: Property & Override Inspector */}
        <NodeInspector
          selectedNode={selectedNode}
          formData={formData}
          onUpdateFormData={setFormData}
          onUpdateNode={onUpdateNode}
          onDeleteNode={handleDeleteWithSelection}
          onClose={() => setSelectedNodeId(null)}
          disabled={isReadOnly}
        />
      </div>
    </DndContext>
  );
}

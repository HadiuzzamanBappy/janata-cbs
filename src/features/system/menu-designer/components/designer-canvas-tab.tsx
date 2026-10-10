"use client";

import * as React from "react";
import type { MenuCatalogActionItem, MenuTreeNode } from "@/lib/schemas/menu-designer-schema";
import { MenuCatalogSidebar } from "./menu-catalog-sidebar";
import { MenuTreeCanvas } from "./menu-tree-canvas";

interface DesignerCanvasTabProps {
  nodes: MenuTreeNode[];
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
  onMoveParent: (draggedId: string, targetParentId: string | null) => void;
  onMoveNode?: (activeId: string, overId: string) => void;
  onAddSubgroup: (parentId: string | null) => void;
  onDropCatalogItem: (item: MenuCatalogActionItem, parentId?: string | null) => void;
  isReadOnly?: boolean;
}

export function DesignerCanvasTab({
  nodes,
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
  onMoveParent,
  onMoveNode,
  onAddSubgroup,
  onDropCatalogItem,
  isReadOnly,
}: DesignerCanvasTabProps) {
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

  return (
    <div className="flex h-full w-full gap-3 overflow-hidden">
      {/* 40% Left Pane: Action Catalog (MENU) */}
      <MenuCatalogSidebar
        items={catalogItems}
        loading={catalogLoading}
        addedMenuIds={addedMenuIds}
        addedCommands={addedCommands}
        onAddItem={(item) => onDropCatalogItem(item, null)}
        disabled={isReadOnly}
      />

      {/* 60% Right Pane: Interactive Menu Tree Canvas */}
      <MenuTreeCanvas
        nodes={nodes}
        collapsedNodeIds={collapsedNodeIds}
        onToggleCollapse={onToggleCollapse}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        onUpdateNode={onUpdateNode}
        onDeleteNode={onDeleteNode}
        onUngroupNode={onUngroupNode}
        onIndentNode={onIndentNode}
        onOutdentNode={onOutdentNode}
        onMoveOrder={onMoveOrder}
        onMoveParent={onMoveParent}
        onMoveNode={onMoveNode}
        onAddSubgroup={onAddSubgroup}
        onDropCatalogItem={onDropCatalogItem}
        isReadOnly={isReadOnly}
      />
    </div>
  );
}

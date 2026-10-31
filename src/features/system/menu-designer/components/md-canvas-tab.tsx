"use client";

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
  onMoveParent: (draggedId: string, targetParentId: string | null) => void;
  onMoveNode?: (activeId: string, overId: string) => void;
  onAddSubgroup: (parentId: string | null) => void;
  onDropCatalogItem: (item: MenuCatalogActionItem, parentId?: string | null) => void;
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
  onMoveParent,
  onMoveNode,
  onAddSubgroup,
  onDropCatalogItem,
  isReadOnly,
}: MdCanvasTabProps) {
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

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
          onMoveParent={onMoveParent}
          onMoveNode={onMoveNode}
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
  );
}

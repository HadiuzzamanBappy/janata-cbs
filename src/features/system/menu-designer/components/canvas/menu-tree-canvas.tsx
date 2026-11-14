"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Network } from "lucide-react";
import * as React from "react";
import type { MenuCatalogActionItem, MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";
import { CanvasSidebarPreview } from "./menu-tree/canvas-sidebar-preview";
import { CanvasToolbar } from "./menu-tree/canvas-toolbar";
import { TreeNodeItem } from "./menu-tree/tree-node-item";

interface MenuTreeCanvasProps {
  nodes: MenuTreeNode[];
  collapsedNodeIds: Set<string>;
  selectedNodeId?: string | null;
  onSelectNode?: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onExpandAll?: () => void;
  onCollapseAll?: () => void;
  onUpdateNode: (id: string, patch: Partial<MenuTreeNode>) => void;
  onDeleteNode: (id: string) => void;
  onUngroupNode?: (id: string) => void;
  onIndentNode?: (id: string) => void;
  onOutdentNode?: (id: string) => void;
  onMoveOrder: (id: string, direction: -1 | 1) => void;
  onDropCatalogItem: (
    item: MenuCatalogActionItem,
    parentId?: string | null,
    targetIndex?: number,
  ) => void;
  isReadOnly?: boolean;
  onToggleCatalog?: () => void;
  onToggleInspector?: () => void;
  showCatalogToggle?: boolean;
  showInspectorToggle?: boolean;
}

export function MenuTreeCanvas({
  nodes,
  collapsedNodeIds,
  selectedNodeId,
  onSelectNode,
  onToggleCollapse,
  onExpandAll,
  onCollapseAll,
  onUpdateNode,
  onDeleteNode,
  onUngroupNode,
  onIndentNode,
  onOutdentNode,
  onMoveOrder,
  onDropCatalogItem,
  isReadOnly,
  onToggleCatalog,
  onToggleInspector,
  showCatalogToggle = false,
  showInspectorToggle = false,
}: MenuTreeCanvasProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"designer" | "preview">("designer");

  const previewTreeNodes = React.useMemo(() => {
    function filterVisible(list: MenuTreeNode[]): MenuTreeNode[] {
      return list
        .filter((node) => node.isVisible !== false)
        .map((node) => ({
          ...node,
          children: node.children && node.children.length > 0 ? filterVisible(node.children) : [],
        }));
    }
    return filterVisible(nodes);
  }, [nodes]);

  // Extract flat list of node IDs for SortableContext
  const allNodeIds = React.useMemo(() => {
    const ids: string[] = [];
    function collect(list: MenuTreeNode[]) {
      for (const n of list) {
        ids.push(n.id);
        if (n.children && n.children.length > 0) {
          collect(n.children);
        }
      }
    }
    collect(nodes);
    return ids;
  }, [nodes]);

  // Native drag & drop event fallback handlers for HTML5 transfer
  const handleNativeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isReadOnly) setIsDragOver(true);
  };

  const handleNativeDragLeave = () => {
    setIsDragOver(false);
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isReadOnly) return;
    try {
      const data = e.dataTransfer.getData("application/json");
      if (data) {
        const item = JSON.parse(data) as MenuCatalogActionItem;
        onDropCatalogItem(item, null);
      }
    } catch {
      // ignore invalid drag payloads
    }
  };

  const renderRecursive = (
    items: MenuTreeNode[],
    level = 0,
    parentId: string | null = null,
  ): React.ReactNode => {
    return items.map((node, index) => {
      const isCollapsed = collapsedNodeIds.has(node.id);
      const canIndent = index > 0;
      const canOutdent = level > 0;

      return (
        <div key={node.id} className="space-y-1">
          <TreeNodeItem
            node={node}
            level={level}
            isCollapsed={isCollapsed}
            isSelected={selectedNodeId === node.id}
            canIndent={canIndent}
            canOutdent={canOutdent}
            onSelect={onSelectNode}
            onToggleCollapse={onToggleCollapse}
            onUpdate={onUpdateNode}
            onDelete={onDeleteNode}
            onUngroup={onUngroupNode}
            onIndent={onIndentNode}
            onOutdent={onOutdentNode}
            onMoveOrder={onMoveOrder}
            onDropCatalogItem={onDropCatalogItem}
            parentId={parentId}
            siblingIndex={index}
            isReadOnly={isReadOnly}
          />
          {!isCollapsed && node.children && node.children.length > 0 && (
            <div className="space-y-1">{renderRecursive(node.children, level + 1, node.id)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <section
      aria-label="Menu Tree Canvas"
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
      className={`flex-1 flex flex-col h-full bg-background border rounded-lg overflow-hidden transition-colors ${
        isDragOver ? "border-primary bg-primary/5" : "border-border/80"
      }`}
    >
      <CanvasToolbar
        nodesCount={nodes.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onSelectRoot={() => onSelectNode?.("")}
        onExpandAll={onExpandAll}
        onCollapseAll={onCollapseAll}
        onToggleCatalog={onToggleCatalog}
        onToggleInspector={onToggleInspector}
        showCatalogToggle={showCatalogToggle}
        showInspectorToggle={showInspectorToggle}
      />

      <section
        aria-label="Tree Nodes Workspace"
        className="flex-1 overflow-y-auto p-3 outline-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectNode?.("");
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && e.target === e.currentTarget) {
            onSelectNode?.("");
          }
        }}
      >
        {viewMode === "preview" ? (
          <CanvasSidebarPreview treeNodes={previewTreeNodes} />
        ) : nodes.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-6 text-center text-muted-foreground">
            <Network className="size-8 mb-2 opacity-50" />
            <p className="text-xs font-medium text-foreground">Tree is currently empty</p>
            <p className="text-[11px] max-w-xs mt-1">
              Drag menu items or groups from the left catalog palette to organize your navigation
              hierarchy.
            </p>
          </div>
        ) : (
          <SortableContext items={allNodeIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5 max-w-4xl mx-auto">{renderRecursive(nodes)}</div>
          </SortableContext>
        )}
      </section>
    </section>
  );
}

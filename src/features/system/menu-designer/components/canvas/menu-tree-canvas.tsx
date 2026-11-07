"use client";

import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  ChevronsDownUp,
  ChevronsUpDown,
  Network,
  PanelLeft,
  SlidersHorizontal,
} from "lucide-react";
import * as React from "react";
import { SidebarMenuTree } from "@/components/layout/sidebar/components/sidebar-menu-tree";
import type { TreeNode } from "@/components/layout/sidebar/types";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MenuCatalogActionItem, MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";
import { TreeNodeItem } from "./tree-node-item";

function convertToSidebarTreeNodes(list: MenuTreeNode[]): TreeNode[] {
  return list
    .filter((node) => node.isVisible !== false)
    .map((node) => ({
      id: node.id,
      title: node.label,
      command: node.command || undefined,
      componentName: node.command ? node.command.replace(/\./g, "_") : undefined,
      menuType: node.menuType,
      menuAction: node.menuAction,
      children:
        node.children && node.children.length > 0
          ? convertToSidebarTreeNodes(node.children)
          : undefined,
    }));
}

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

  const previewTreeNodes = React.useMemo(() => convertToSidebarTreeNodes(nodes), [nodes]);

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
      // Can indent if there is a previous sibling in the same array
      const canIndent = index > 0;
      // Can outdent if we are nested deeper than root level
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
      {/* Canvas Top Bar */}
      <div className="px-3 py-1.5 border-b border-border/80 flex items-center justify-between bg-card/60 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          {showCatalogToggle && onToggleCatalog && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onToggleCatalog}
              className="size-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              title="Toggle Action Catalog"
            >
              <PanelLeft className="size-3.5" />
            </Button>
          )}

          <button
            type="button"
            onClick={() => onSelectNode?.("")}
            className="flex items-center gap-1.5 hover:text-primary transition-colors text-left min-w-0"
            title="Click to view root tree container properties"
          >
            <span className="text-xs font-semibold text-foreground truncate">Hierarchy Canvas</span>
          </button>
          <span className="text-[11px] text-muted-foreground font-mono shrink-0">
            ({nodes.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mode Segmented Toggle: Designer vs Preview (Height 7 matching other controls) */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode("designer")}
              className={`h-6 px-2.5 text-xs font-medium rounded transition-all cursor-pointer ${
                viewMode === "designer"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Designer
            </button>
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={`h-6 px-2.5 text-xs font-medium rounded transition-all cursor-pointer ${
                viewMode === "preview"
                  ? "bg-background text-primary shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Live Preview
            </button>
          </div>

          {/* Icon Button Group for Expand / Collapse */}
          <div className="flex items-center bg-muted/40 p-0.5 rounded border border-border/60">
            {onExpandAll && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={onExpandAll}
                      className="size-6 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                    >
                      <ChevronsUpDown className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent side="bottom" className="text-xs">
                  Expand All Folders
                </TooltipContent>
              </Tooltip>
            )}
            {onCollapseAll && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={onCollapseAll}
                      className="size-6 text-muted-foreground hover:text-foreground rounded cursor-pointer"
                    >
                      <ChevronsDownUp className="size-3.5" />
                    </Button>
                  }
                />
                <TooltipContent side="bottom" className="text-xs">
                  Collapse All Folders
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {showInspectorToggle && onToggleInspector && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onToggleInspector}
              className="size-7 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer rounded border border-border/60"
              title="Toggle Properties Inspector"
            >
              <SlidersHorizontal className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Canvas Content */}
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
          <div className="max-w-md mx-auto py-2">
            <div className="p-2 mb-2 rounded bg-muted/20 border border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Workbench Sidebar Layout Preview</span>
              <span className="font-mono text-[10px] text-primary">Live Readout</span>
            </div>
            <div className="rounded-lg border border-sidebar-border bg-sidebar p-2 shadow-xs">
              <SidebarMenuTree
                treeNodes={previewTreeNodes}
                loading={false}
                openSettingsTab={() => {}}
                onLogout={() => {}}
              />
            </div>
          </div>
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

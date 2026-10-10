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
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FolderPlus, Network, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import type { MenuCatalogActionItem, MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";
import { TreeDropZone } from "./tree/tree-drop-zone";
import { TreeNodeItem } from "./tree/tree-node-item";

interface MenuTreeCanvasProps {
  nodes: MenuTreeNode[];
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

export function MenuTreeCanvas({
  nodes,
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
}: MenuTreeCanvasProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || isReadOnly) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // If dragged from action catalog
    if (activeId.startsWith("catalog-")) {
      const itemData = active.data.current?.item as MenuCatalogActionItem | undefined;
      if (itemData) {
        if (overId.startsWith("dropzone-")) {
          const rawParent = over.data.current?.parentId as string | null | undefined;
          onDropCatalogItem(itemData, rawParent || null);
        } else {
          onDropCatalogItem(itemData, null);
        }
      }
      return;
    }

    // Dropped onto a dropzone
    if (overId.startsWith("dropzone-")) {
      const rawParent = over.data.current?.parentId as string | null | undefined;
      onMoveParent(activeId, rawParent || null);
    } else if (onMoveNode) {
      // Dropped onto another node
      onMoveNode(activeId, overId);
    }
  };

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

  const renderRecursive = (items: MenuTreeNode[], level = 0): React.ReactNode => {
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
            canIndent={canIndent}
            canOutdent={canOutdent}
            onToggleCollapse={onToggleCollapse}
            onUpdate={onUpdateNode}
            onDelete={onDeleteNode}
            onUngroup={onUngroupNode}
            onIndent={onIndentNode}
            onOutdent={onOutdentNode}
            onAddSubgroup={(parentId) => onAddSubgroup(parentId)}
            onMoveOrder={onMoveOrder}
            isReadOnly={isReadOnly}
          />
          {!isCollapsed && node.children && (
            <div className="space-y-1">
              {node.children.length > 0 && renderRecursive(node.children, level + 1)}
              {!isReadOnly && (node.menuId === 0 || !node.command) && (
                <div
                  style={{ marginLeft: `${Math.min((level + 1) * 22, 176)}px` }}
                  className="pt-0.5"
                >
                  <TreeDropZone
                    parentId={node.id}
                    label={`Drop action inside "${node.label}"`}
                    isReadOnly={isReadOnly}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
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
        <div className="p-2 border-b border-border/80 flex items-center justify-between bg-card/60 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Network className="size-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">Hierarchy Canvas</span>
            <span className="text-[11px] text-muted-foreground font-mono">
              ({nodes.length} root branches)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {onExpandAll && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onExpandAll}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                title="Expand all groups"
              >
                Expand All
              </Button>
            )}
            {onCollapseAll && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onCollapseAll}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                title="Collapse all groups"
              >
                Collapse All
              </Button>
            )}
            {!isReadOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddSubgroup(null)}
                className="h-6 text-xs gap-1.5 px-2.5"
              >
                <FolderPlus className="size-3.5" />
                Add Root Group
              </Button>
            )}
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {nodes.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-lg p-6 text-center text-muted-foreground">
              <Network className="size-8 mb-2 opacity-50" />
              <p className="text-xs font-medium text-foreground">Tree is currently empty</p>
              <p className="text-[11px] max-w-xs mt-1">
                Drag actions from the left catalog, or click below to create your first root group
                folder.
              </p>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => onAddSubgroup(null)}
                  className="mt-3 text-xs gap-1.5"
                >
                  <Plus className="size-3.5" /> Create Root Group
                </Button>
              )}
            </div>
          ) : (
            <SortableContext items={allNodeIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-1.5 max-w-4xl mx-auto">
                {renderRecursive(nodes)}
                {!isReadOnly && (
                  <div className="pt-2">
                    <TreeDropZone
                      parentId={null}
                      label="Drop catalog action here to append to root"
                    />
                  </div>
                )}
              </div>
            </SortableContext>
          )}
        </div>
      </section>
    </DndContext>
  );
}

"use client";

import { FolderPlus, Network, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import type { MenuCatalogItem, MenuNode } from "../types";
import { MenuNodeCard } from "./menu-node-card";

interface MenuTreeCanvasProps {
  nodes: MenuNode[];
  collapsedNodeIds: Set<string>;
  onToggleCollapse: (id: string) => void;
  onUpdateNode: (id: string, patch: Partial<MenuNode>) => void;
  onDeleteNode: (id: string) => void;
  onMoveOrder: (id: string, direction: -1 | 1) => void;
  onAddSubgroup: (parentId: string | null) => void;
  onDropCatalogItem: (item: MenuCatalogItem, parentId?: string | null) => void;
  isReadOnly?: boolean;
}

export function MenuTreeCanvas({
  nodes,
  collapsedNodeIds,
  onToggleCollapse,
  onUpdateNode,
  onDeleteNode,
  onMoveOrder,
  onAddSubgroup,
  onDropCatalogItem,
  isReadOnly,
}: MenuTreeCanvasProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isReadOnly) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isReadOnly) return;
    try {
      const data = e.dataTransfer.getData("application/json");
      if (data) {
        const item = JSON.parse(data) as MenuCatalogItem;
        onDropCatalogItem(item, null);
      }
    } catch {
      // ignore invalid drag payloads
    }
  };

  const renderRecursive = (items: MenuNode[], level = 0): React.ReactNode => {
    return items.map((node) => {
      const isCollapsed = collapsedNodeIds.has(node.id);
      return (
        <div key={node.id} className="space-y-1">
          <MenuNodeCard
            node={node}
            level={level}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            onUpdate={onUpdateNode}
            onDelete={onDeleteNode}
            onAddSubgroup={(parentId) => onAddSubgroup(parentId)}
            onMoveOrder={onMoveOrder}
            isReadOnly={isReadOnly}
          />
          {!isCollapsed && node.children && node.children.length > 0 && (
            <div className="space-y-1">{renderRecursive(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <section
      aria-label="Menu Tree Canvas"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full bg-background/50 border rounded-lg overflow-hidden transition-colors ${
        isDragOver ? "border-primary bg-primary/5" : "border-border/80"
      }`}
    >
      {/* Canvas Top Bar */}
      <div className="p-3 border-b border-border/80 flex items-center justify-between bg-card/60">
        <div className="flex items-center gap-2">
          <Network className="size-4 text-primary" />
          <span className="text-xs font-semibold text-foreground">Hierarchy Canvas</span>
          <span className="text-xs text-muted-foreground font-mono">
            ({nodes.length} root branches)
          </span>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddSubgroup(null)}
              className="h-7 text-xs gap-1.5"
            >
              <FolderPlus className="size-3.5" />
              Add Root Group
            </Button>
          </div>
        )}
      </div>

      {/* Canvas Content */}
      <div className="flex-1 overflow-y-auto p-4">
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
          <div className="space-y-1.5 max-w-4xl mx-auto">{renderRecursive(nodes)}</div>
        )}
      </div>
    </section>
  );
}

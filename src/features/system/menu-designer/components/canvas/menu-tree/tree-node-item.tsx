"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Folder,
  GripVertical,
  Search,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { MenuCatalogActionItem, MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";
import { TreeNodeActions } from "./tree-node-actions";

interface TreeNodeItemProps {
  node: MenuTreeNode;
  level: number;
  isCollapsed: boolean;
  isSelected?: boolean;
  canIndent?: boolean;
  canOutdent?: boolean;
  onSelect?: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onUpdate: (id: string, patch: Partial<MenuTreeNode>) => void;
  onDelete: (id: string) => void;
  onUngroup?: (id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onMoveOrder: (id: string, direction: -1 | 1) => void;
  onDropCatalogItem?: (
    item: MenuCatalogActionItem,
    parentId?: string | null,
    targetIndex?: number,
  ) => void;
  parentId?: string | null;
  siblingIndex?: number;
  isReadOnly?: boolean;
}

export function TreeNodeItem({
  node,
  level,
  isCollapsed,
  isSelected = false,
  canIndent = false,
  canOutdent = false,
  onSelect,
  onToggleCollapse,
  onUpdate,
  onDelete,
  onUngroup,
  onIndent,
  onOutdent,
  onMoveOrder,
  onDropCatalogItem,
  parentId = null,
  siblingIndex,
  isReadOnly,
}: TreeNodeItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  });

  const [dropPosition, setDropPosition] = React.useState<"before" | "inside" | "after" | null>(
    null,
  );
  const isFolderNode = !node.command;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    marginLeft: `${Math.min(level * 14, 112)}px`,
  };

  const [isEditingLabel, setIsEditingLabel] = React.useState(false);
  const [localLabel, setLocalLabel] = React.useState(node.label);
  const isFolder = node.children && node.children.length > 0;
  const isVisible = node.isVisible !== false;

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    if (localLabel.trim() && localLabel !== node.label) {
      onUpdate(node.id, { label: localLabel.trim() });
    } else {
      setLocalLabel(node.label);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";

    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const height = rect.height;

    if (isFolderNode) {
      // For folders: top 25% = before, bottom 25% = after, middle 50% = inside folder
      if (offsetY < height * 0.25) {
        setDropPosition("before");
      } else if (offsetY > height * 0.75) {
        setDropPosition("after");
      } else {
        setDropPosition("inside");
      }
    } else {
      // For leaf items: top half = before, bottom half = after
      if (offsetY < height * 0.5) {
        setDropPosition("before");
      } else {
        setDropPosition("after");
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    e.stopPropagation();
    const currentPos = dropPosition;
    setDropPosition(null);

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) {
        const item = JSON.parse(dataStr) as MenuCatalogActionItem;
        const selfIndex = typeof siblingIndex === "number" ? siblingIndex : 0;

        if (currentPos === "inside" && isFolderNode) {
          // Drop inside folder at the end
          onDropCatalogItem?.(item, node.id);
        } else if (currentPos === "before") {
          // Drop directly above this node
          onDropCatalogItem?.(item, parentId, selfIndex);
        } else {
          // Drop directly below this node ("after" or default)
          onDropCatalogItem?.(item, parentId, selfIndex + 1);
        }
      }
    } catch {
      // ignore invalid drag payloads
    }
  };

  return (
    <div
      role="treeitem"
      tabIndex={0}
      aria-selected={isSelected}
      ref={setNodeRef}
      style={style}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "group relative flex items-center justify-between gap-2 p-1.5 px-2 rounded-md border border-border/70 bg-card hover:border-primary/40 hover:shadow-2xs transition-all text-xs select-none",
        isSelected && "ring-1.5 ring-primary border-primary bg-primary/5",
        !isVisible && "opacity-50 grayscale-20 bg-muted/20 border-dashed",
        isDragging && "opacity-50 border-primary ring-1 ring-primary bg-primary/5",
        isFolderNode && "border-l-4 border-l-primary/70",
        dropPosition === "inside" &&
          "ring-2 ring-primary border-primary bg-primary/15 scale-[1.01]",
      )}
    >
      {/* Visual Cursor Placement Indicators */}
      {dropPosition === "before" && (
        <div className="absolute -top-1 left-0 right-0 h-1 bg-primary rounded-full shadow-xs pointer-events-none z-20 flex items-center">
          <div className="size-2 bg-primary rounded-full -ml-1 border-2 border-background" />
        </div>
      )}
      {dropPosition === "after" && (
        <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full shadow-xs pointer-events-none z-20 flex items-center">
          <div className="size-2 bg-primary rounded-full -ml-1 border-2 border-background" />
        </div>
      )}
      {/* Left: Drag Handle, Expand Toggle, Icon, Label, Command Badge */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {!isReadOnly && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1 text-muted-foreground/60 hover:text-foreground touch-none"
            title="Drag to reorder or drop onto group"
          >
            <GripVertical className="size-3.5" />
          </button>
        )}

        {isFolder ? (
          <button
            type="button"
            onClick={() => onToggleCollapse(node.id)}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? (
              <ChevronRight className="size-3.5 text-primary" />
            ) : (
              <ChevronDown className="size-3.5 text-primary" />
            )}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        <div className="flex items-center gap-1.5 shrink-0">
          {isFolderNode ? (
            <Folder className="size-3.5 text-muted-foreground/80 fill-muted/20" />
          ) : node.menuType === "INQUIRY" ? (
            <Search className="size-3.5 text-muted-foreground/70" />
          ) : node.menuType === "REPORT" ? (
            <BarChart3 className="size-3.5 text-muted-foreground/70" />
          ) : node.menuType === "FORM" ? (
            <FileSpreadsheet className="size-3.5 text-muted-foreground/70" />
          ) : (
            <FileText className="size-3.5 text-muted-foreground/70" />
          )}
        </div>

        {isEditingLabel && !isReadOnly ? (
          <Input
            autoFocus
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLabelBlur();
              if (e.key === "Escape") {
                setLocalLabel(node.label);
                setIsEditingLabel(false);
              }
            }}
            className="h-6 text-xs max-w-xs shrink-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => onSelect?.(node.id)}
            onDoubleClick={() => !isReadOnly && setIsEditingLabel(true)}
            className="font-medium text-foreground hover:text-primary transition-colors truncate text-left cursor-pointer shrink-0 max-w-sm"
            title="Click to inspect properties • Double-click to rename"
          >
            {node.label}
          </button>
        )}

        {isFolder && (
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            ({node.children.length})
          </span>
        )}

        {node.command && (
          <Badge
            variant="outline"
            className="h-4 px-1 text-[9px] font-mono uppercase bg-muted/40 text-muted-foreground border-border/60 shrink-0 max-w-44 truncate leading-none"
          >
            {node.command}
          </Badge>
        )}

        {/* Empty spacer so title + badge remain anchored together on the left */}
        <div className="flex-1 min-w-1" />
      </div>

      {/* Right: Functional Hierarchy Actions (Responsive) */}
      <TreeNodeActions
        nodeId={node.id}
        isVisible={isVisible}
        isFolder={Boolean(isFolder)}
        isFolderNode={Boolean(isFolderNode)}
        canIndent={canIndent}
        canOutdent={canOutdent}
        isReadOnly={isReadOnly}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onUngroup={onUngroup}
        onIndent={onIndent}
        onOutdent={onOutdent}
        onMoveOrder={onMoveOrder}
      />
    </div>
  );
}

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderMinus,
  FolderPlus,
  GripVertical,
  Terminal,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MenuTreeNode } from "@/lib/schemas/menu-designer-schema";
import { cn } from "@/lib/utils";

interface TreeNodeItemProps {
  node: MenuTreeNode;
  level: number;
  isCollapsed: boolean;
  canIndent?: boolean;
  canOutdent?: boolean;
  onToggleCollapse: (id: string) => void;
  onUpdate: (id: string, patch: Partial<MenuTreeNode>) => void;
  onDelete: (id: string) => void;
  onUngroup?: (id: string) => void;
  onIndent?: (id: string) => void;
  onOutdent?: (id: string) => void;
  onAddSubgroup: (parentId: string) => void;
  onMoveOrder: (id: string, direction: -1 | 1) => void;
  isReadOnly?: boolean;
}

export function TreeNodeItem({
  node,
  level,
  isCollapsed,
  canIndent = false,
  canOutdent = false,
  onToggleCollapse,
  onUpdate,
  onDelete,
  onUngroup,
  onIndent,
  onOutdent,
  onAddSubgroup,
  onMoveOrder,
  isReadOnly,
}: TreeNodeItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    marginLeft: `${Math.min(level * 22, 176)}px`,
  };

  const [isEditingLabel, setIsEditingLabel] = React.useState(false);
  const [localLabel, setLocalLabel] = React.useState(node.label);
  const isFolder = node.children && node.children.length > 0;
  const isCustomGroup = node.menuId === 0 || !node.command;

  const handleLabelBlur = () => {
    setIsEditingLabel(false);
    if (localLabel.trim() && localLabel !== node.label) {
      onUpdate(node.id, { label: localLabel.trim() });
    } else {
      setLocalLabel(node.label);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between gap-2 p-2 rounded-md border border-border/70 bg-card hover:border-primary/40 hover:shadow-2xs transition-all text-xs select-none",
        isDragging && "opacity-50 border-primary ring-1 ring-primary bg-primary/5",
        isCustomGroup && "border-l-4 border-l-primary/70",
      )}
    >
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
          {isCustomGroup ? (
            <Folder className="size-3.5 text-amber-500 fill-amber-500/10" />
          ) : (
            <Terminal className="size-3.5 text-primary" />
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
            className="h-6 text-xs max-w-xs"
          />
        ) : (
          <button
            type="button"
            onClick={() => !isReadOnly && setIsEditingLabel(true)}
            className="font-medium text-foreground hover:text-primary transition-colors truncate max-w-xs text-left"
            title="Click to rename"
          >
            {node.label}
          </button>
        )}

        {node.command && (
          <Badge
            variant="outline"
            className="h-4.5 px-1.5 text-[10px] font-mono uppercase bg-muted/30 text-muted-foreground border-border/60 shrink-0"
          >
            {node.command}
          </Badge>
        )}

        {isFolder && (
          <span className="text-[10px] font-mono text-muted-foreground">
            ({node.children.length})
          </span>
        )}
      </div>

      {/* Right: Functional Hierarchy Actions */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
        {!isReadOnly && isCustomGroup && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onAddSubgroup(node.id)}
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              title="Add nested subgroup inside this folder"
            >
              <FolderPlus className="size-3.5" />
            </Button>
            {isFolder && onUngroup && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onUngroup(node.id)}
                className="h-6 w-6 text-muted-foreground hover:text-amber-500"
                title="Ungroup folder (promote all children up)"
              >
                <FolderMinus className="size-3.5" />
              </Button>
            )}
          </>
        )}

        {!isReadOnly && (
          <>
            {/* Outdent (Shift Left) */}
            {canOutdent && onOutdent && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onOutdent(node.id)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Outdent (Move out of current group)"
              >
                <ArrowLeft className="size-3.5" />
              </Button>
            )}

            {/* Indent (Shift Right) */}
            {canIndent && onIndent && (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={() => onIndent(node.id)}
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                title="Indent (Nest into previous sibling group)"
              >
                <ArrowRight className="size-3.5" />
              </Button>
            )}

            {/* Move Up */}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onMoveOrder(node.id, -1)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Move Up"
            >
              <ArrowUp className="size-3.5" />
            </Button>

            {/* Move Down */}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onMoveOrder(node.id, 1)}
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              title="Move Down"
            >
              <ArrowDown className="size-3.5" />
            </Button>

            {/* Delete Node */}
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onDelete(node.id)}
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              title="Delete node from tree"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

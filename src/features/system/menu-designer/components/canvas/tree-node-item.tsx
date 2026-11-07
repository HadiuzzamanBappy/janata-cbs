"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderMinus,
  GripVertical,
  MoreHorizontal,
  Search,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/core-utils";
import type { MenuCatalogActionItem, MenuTreeNode } from "@/lib/data-schemas/menu-designer-schema";

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
            className="h-6 text-xs max-w-xs flex-1 min-w-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => onSelect?.(node.id)}
            onDoubleClick={() => !isReadOnly && setIsEditingLabel(true)}
            className="font-medium text-foreground hover:text-primary transition-colors truncate text-left cursor-pointer flex-1 min-w-0"
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
            className="hidden sm:inline-flex h-4.5 px-1.5 text-[10px] font-mono uppercase bg-muted/30 text-muted-foreground border-border/60 shrink-0 max-w-35 truncate"
          >
            {node.command}
          </Badge>
        )}
      </div>

      {/* Right: Functional Hierarchy Actions (Responsive) */}
      <div className="flex items-center gap-0.5 shrink-0">
        {/* On Mobile (< sm): Clean 3-dots Overflow Menu */}
        {!isReadOnly && (
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Actions"
                  >
                    <MoreHorizontal className="size-3.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44 text-xs">
                <DropdownMenuItem
                  onClick={() => onUpdate(node.id, { isVisible: !isVisible })}
                  className="gap-2"
                >
                  {isVisible ? (
                    <EyeOff className="size-3.5 text-muted-foreground" />
                  ) : (
                    <Eye className="size-3.5 text-emerald-500" />
                  )}
                  <span>{isVisible ? "Hide Node" : "Show Node"}</span>
                </DropdownMenuItem>

                {canIndent && onIndent && (
                  <DropdownMenuItem onClick={() => onIndent(node.id)} className="gap-2">
                    <ArrowRight className="size-3.5" />
                    <span>Indent (Nest)</span>
                  </DropdownMenuItem>
                )}

                {canOutdent && onOutdent && (
                  <DropdownMenuItem onClick={() => onOutdent(node.id)} className="gap-2">
                    <ArrowLeft className="size-3.5" />
                    <span>Outdent</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => onMoveOrder(node.id, -1)} className="gap-2">
                  <ArrowUp className="size-3.5" />
                  <span>Move Up</span>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => onMoveOrder(node.id, 1)} className="gap-2">
                  <ArrowDown className="size-3.5" />
                  <span>Move Down</span>
                </DropdownMenuItem>

                {isFolderNode && isFolder && onUngroup && (
                  <DropdownMenuItem
                    onClick={() => onUngroup(node.id)}
                    className="gap-2 text-amber-500"
                  >
                    <FolderMinus className="size-3.5" />
                    <span>Ungroup</span>
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onDelete(node.id)}
                  className="gap-2 text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* On Desktop (>= sm): Full Inline Action Buttons */}
        <div className="hidden sm:flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
          {/* Visibility Toggle Button */}
          {!isReadOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(node.id, { isVisible: !isVisible });
              }}
              className={cn(
                "h-6 w-6 transition-colors",
                isVisible
                  ? "text-emerald-500 hover:text-emerald-600"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={isVisible ? "Visible (Click to hide)" : "Hidden (Click to show)"}
            >
              {isVisible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
            </Button>
          )}

          {!isReadOnly && isFolderNode && isFolder && onUngroup && (
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
    </div>
  );
}

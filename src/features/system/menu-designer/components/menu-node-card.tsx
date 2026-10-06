"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  GripVertical,
  Minus,
  Plus,
  Terminal,
  Trash2,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { MenuNode } from "../types";

interface MenuNodeCardProps {
  node: MenuNode;
  level: number;
  isCollapsed: boolean;
  onToggleCollapse: (id: string) => void;
  onUpdate: (id: string, patch: Partial<MenuNode>) => void;
  onDelete: (id: string) => void;
  onAddSubgroup: (parentId: string) => void;
  onMoveOrder: (id: string, direction: -1 | 1) => void;
  isReadOnly?: boolean;
}

export function MenuNodeCard({
  node,
  level,
  isCollapsed,
  onToggleCollapse,
  onUpdate,
  onDelete,
  onAddSubgroup,
  onMoveOrder,
  isReadOnly,
}: MenuNodeCardProps) {
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
      className="group flex items-center justify-between gap-2 p-2 rounded-lg border border-border/70 bg-card hover:border-primary/40 hover:shadow-xs transition-all text-xs"
      style={{ marginLeft: `${Math.min(level * 20, 160)}px` }}
    >
      {/* Left section: drag handle, expand toggle, icon, label, command badge */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {!isReadOnly && (
          <GripVertical className="size-3.5 text-muted-foreground/60 cursor-grab active:cursor-grabbing shrink-0" />
        )}

        {isFolder ? (
          <button
            type="button"
            onClick={() => onToggleCollapse(node.id)}
            className="size-5 rounded hover:bg-muted flex items-center justify-center text-muted-foreground shrink-0"
          >
            {isCollapsed ? (
              <ChevronRight className="size-3.5" />
            ) : (
              <ChevronDown className="size-3.5" />
            )}
          </button>
        ) : (
          <div className="size-5 flex items-center justify-center shrink-0">
            <span className="size-1.5 rounded-full bg-border" />
          </div>
        )}

        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          {isCustomGroup ? (
            <Folder className="size-3.5 text-amber-500 shrink-0" />
          ) : (
            <Terminal className="size-3.5 text-sky-500 shrink-0" />
          )}

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
              className="h-6 py-0 px-1 text-xs font-medium w-48 bg-background"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={() => !isReadOnly && setIsEditingLabel(true)}
              className="font-medium text-foreground truncate cursor-text text-left bg-transparent border-0 p-0 hover:underline"
              title="Double click to edit label"
            >
              {node.label}
            </button>
          )}

          {node.command && (
            <Badge
              variant="outline"
              className="font-mono text-[10px] px-1.5 py-0 bg-muted/30 text-muted-foreground shrink-0 max-w-[200px] truncate"
            >
              {node.command}
            </Badge>
          )}

          {isFolder && (
            <span className="text-[10px] text-muted-foreground/80 shrink-0">
              ({node.children.length})
            </span>
          )}
        </div>
      </div>

      {/* Right section: action buttons */}
      {!isReadOnly && (
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={() => onMoveOrder(node.id, -1)}
            title="Move Up"
            className="size-6 rounded hover:bg-muted text-muted-foreground flex items-center justify-center"
          >
            <ChevronDown className="size-3.5 rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => onMoveOrder(node.id, 1)}
            title="Move Down"
            className="size-6 rounded hover:bg-muted text-muted-foreground flex items-center justify-center"
          >
            <ChevronDown className="size-3.5" />
          </button>

          {isCustomGroup && (
            <button
              type="button"
              onClick={() => onAddSubgroup(node.id)}
              title="Add Subgroup"
              className="size-6 rounded hover:bg-primary/10 hover:text-primary text-muted-foreground flex items-center justify-center"
            >
              <Plus className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => onUpdate(node.id, { isVisible: !node.isVisible })}
            title={node.isVisible ? "Visible (Click to hide)" : "Hidden (Click to show)"}
            className={`size-6 rounded flex items-center justify-center transition-colors ${
              node.isVisible
                ? "text-muted-foreground hover:bg-muted"
                : "text-amber-500 bg-amber-500/10"
            }`}
          >
            <Minus className="size-3" />
          </button>

          <button
            type="button"
            onClick={() => onDelete(node.id)}
            title="Delete Node"
            className="size-6 rounded hover:bg-destructive/10 hover:text-destructive text-muted-foreground flex items-center justify-center"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

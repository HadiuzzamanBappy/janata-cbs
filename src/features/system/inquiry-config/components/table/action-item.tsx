"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/core-utils";
import type { INQCmd } from "@/lib/data-schemas/inquiry-config-schema";

export interface ActionItemProps {
  action: INQCmd;
  index: number;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function ActionItem({
  action,
  isSelected,
  disabled = false,
  onSelect,
  onRemove,
}: ActionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `action-${action.cmdButton}-${action.cmdFor}`,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 40 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-1.5 rounded border transition-all flex items-center gap-1.5 text-xs select-none",
        isSelected
          ? "bg-primary/10 border-primary text-foreground shadow-2xs font-medium"
          : "bg-background/90 hover:bg-muted/30 border-border/70 text-foreground/90",
        isDragging && "ring-1 ring-primary shadow-md bg-accent/30",
      )}
    >
      {!disabled && (
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground shrink-0 p-0.5"
          title="Drag to reorder"
        >
          <GripVertical className="size-3.5" />
        </span>
      )}

      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0 text-left outline-none cursor-pointer"
      >
        <Play className="size-3 text-primary shrink-0" />

        <div className="flex-1 min-w-0">
          <span className="font-medium truncate block">{action.cmdButton}</span>
          <span className="text-[10px] font-mono text-muted-foreground/70 truncate block">
            {action.cmdFor}
          </span>
        </div>
      </button>

      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground/50 transition-opacity p-1 cursor-pointer"
          title="Remove action"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

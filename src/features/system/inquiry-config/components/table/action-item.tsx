"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  index,
  isSelected,
  disabled = false,
  onSelect,
  onRemove,
}: ActionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `action-${action.cmdButton}-${index}`,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs transition-colors",
        isSelected
          ? "bg-primary/10 border-primary/50 text-foreground shadow-xs"
          : "bg-card border-border/70 hover:bg-muted/50 text-muted-foreground",
        isDragging && "opacity-50 z-50 shadow-md",
      )}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {!disabled && (
          <span
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-0.5 inline-flex items-center"
          >
            <GripVertical className="size-3.5" />
          </span>
        )}

        <Play className="size-3 text-primary shrink-0" />

        <button
          type="button"
          onClick={onSelect}
          className="flex flex-col min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-hidden"
        >
          <span className="font-semibold text-foreground truncate">
            {action.cmdButton}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground/80 truncate">
            {action.cmdFor}
          </span>
        </button>
      </div>

      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={onRemove}
          title="Remove Action"
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}

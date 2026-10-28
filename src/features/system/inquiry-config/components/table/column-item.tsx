"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";

export interface ColumnItemProps {
  col: INQDef;
  index: number;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function ColumnItem({
  col,
  index,
  isSelected,
  disabled = false,
  onSelect,
  onRemove,
}: ColumnItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `col-${col.fieldName}-${index}`,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [lenPart, alignPart] = (col.fieldLength || "20,L").split(",");

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

        <button
          type="button"
          onClick={onSelect}
          className="flex flex-col min-w-0 flex-1 text-left cursor-pointer focus-visible:outline-hidden"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">
              {col.fieldDisplay || col.fieldName}
            </span>
            <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 uppercase">
              {col.fieldType}
            </Badge>
          </div>
          <span className="font-mono text-[10px] text-muted-foreground/80 truncate">
            {col.fieldName} • {lenPart}ch • {alignPart || "L"}
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
          title="Remove Column"
        >
          <Trash2 className="size-3" />
        </Button>
      )}
    </div>
  );
}

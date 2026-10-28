"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pin, Trash2 } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { InquiryColumnConfig } from "@/lib/data-schemas/inquiry-config-schema";

export interface SortableColumnItemProps {
  id: string;
  index: number;
  col: InquiryColumnConfig;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function SortableColumnItem({
  id,
  index,
  col,
  isSelected,
  disabled,
  onSelect,
  onRemove,
}: SortableColumnItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
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
        "group flex items-center justify-between p-1.5 rounded border transition-all gap-1.5 text-xs select-none",
        isSelected
          ? "bg-primary/10 border-primary text-foreground shadow-2xs font-medium"
          : "bg-background/90 hover:bg-muted/30 border-border/70 text-foreground/90",
        isDragging && "ring-1 ring-primary shadow-md bg-accent/30",
      )}
    >
      {/* Reordering drag handle */}
      {!disabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground shrink-0 p-0.5 rounded touch-none focus-visible:outline-none"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-2 min-w-0 flex-1 text-left outline-none cursor-pointer"
      >
        <span className="font-mono text-[11px] text-muted-foreground/80 w-4 text-center shrink-0">
          {index + 1}.
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold truncate">{col.label || col.id}</span>
            {col.isPinned && <Pin className="size-2.5 text-amber-500 shrink-0 fill-amber-500/20" />}
            {!col.visible && (
              <span className="text-[9px] uppercase px-1 py-0 bg-muted text-muted-foreground rounded">
                Hidden
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] text-muted-foreground">
            <span className="text-foreground/70">{col.id}</span>
            <span>&bull;</span>
            <span className="uppercase">{col.format || "text"}</span>
            <span>&bull;</span>
            <span>{col.align || "left"}</span>
          </div>
        </div>
      </button>

      {/* Badges and Remove */}
      <div className="flex items-center gap-1 shrink-0 ml-1">
        <Badge variant="secondary" className="text-[10px] font-mono px-1 py-0 uppercase">
          {col.format || "text"}
        </Badge>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
            title="Delete column"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

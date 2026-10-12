"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/core-utils";
import type { FormFieldItem } from "@/lib/data-schemas/form-config-schema";

export interface DesignerFieldCardProps {
  field: FormFieldItem;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  disabled?: boolean;
}

export function DesignerFieldCard({
  field,
  isSelected,
  onSelect,
  onRemove,
  disabled,
}: DesignerFieldCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded border px-2 py-1.5 flex items-center justify-between text-xs transition-all bg-card/80 hover:border-primary/50",
        isSelected ? "border-primary ring-1 ring-primary/30 bg-primary/5" : "border-border/70",
        isDragging && "shadow-md",
      )}
    >
      <div className="flex items-center gap-1.5 min-w-0 flex-1">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab text-muted-foreground/50 hover:text-foreground shrink-0 p-0.5"
          aria-label="Reorder field"
        >
          <GripVertical className="size-3" />
        </button>

        <button
          type="button"
          onClick={onSelect}
          className="min-w-0 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-foreground truncate">{field.label}</span>
            {field.required && <span className="text-destructive font-bold text-xs">*</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground font-mono">
            <span>{field.fieldKey}</span>
            <span>&bull;</span>
            <Badge variant="outline" className="text-[9px] h-3.5 px-1 uppercase">
              {field.widget}
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px] h-3.5 px-1 text-emerald-500 border-emerald-500/40 bg-emerald-500/5 font-mono"
            >
              Model
            </Badge>
            {field.formula && (
              <Badge
                variant="secondary"
                className="text-[9px] h-3.5 px-1 bg-amber-500/10 text-amber-500"
              >
                Formula
              </Badge>
            )}
          </div>
        </button>
      </div>

      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="text-muted-foreground/40 hover:text-destructive p-1 rounded transition-colors"
        >
          <Trash2 className="size-3" />
        </button>
      )}
    </div>
  );
}

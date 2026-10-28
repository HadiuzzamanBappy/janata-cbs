"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { INQUIRY_OPERAND_OPTIONS } from "@/features/inquiry-engine";
import { cn } from "@/lib/core-utils";
import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";

export interface FilterItemProps {
  field: INQSelectField;
  index: number;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function FilterItem({
  field,
  index,
  isSelected,
  disabled = false,
  onSelect,
  onRemove,
}: FilterItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `filter-${field.selectFieldName}`,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 40 : undefined,
  };

  const operandBadge =
    INQUIRY_OPERAND_OPTIONS.find((o) => o.value === field.selectFieldOperator)?.badge ||
    field.selectFieldOperator ||
    "EQ";

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
        <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">
          {index + 1}.
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium truncate">
              {field.selectFieldDisplay || field.selectFieldName}
            </span>
            {field.selectFieldRequired && (
              <span className="text-destructive font-bold text-xs" title="Mandatory criterion">
                *
              </span>
            )}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground/70 truncate block">
            {field.selectFieldName}
          </span>
        </div>

        <Badge
          variant="outline"
          className="text-[9px] font-mono px-1 py-0 h-4 border-border/60 shrink-0 text-muted-foreground"
        >
          {operandBadge}
        </Badge>
      </button>

      {!disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground/50 transition-opacity p-1 cursor-pointer"
          title="Remove criterion"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

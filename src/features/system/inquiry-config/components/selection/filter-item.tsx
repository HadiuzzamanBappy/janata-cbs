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
  hasError?: boolean;
  errorCount?: number;
  onSelect: () => void;
  onRemove: () => void;
}

export function FilterItem({
  field,
  index,
  isSelected,
  disabled = false,
  hasError = false,
  errorCount,
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
        "group py-1.5 px-2.5 transition-colors flex items-center gap-1.5 text-xs select-none w-full",
        hasError && !isSelected && "bg-destructive/5 hover:bg-destructive/10",
        isSelected
          ? hasError
            ? "bg-destructive/15 text-destructive border-l-3 border-l-destructive"
            : "bg-primary/10 text-foreground font-semibold border-l-3 border-l-primary"
          : hasError
            ? "border-l-3 border-l-destructive/80 text-foreground"
            : "hover:bg-muted/40 text-foreground border-l-3 border-l-transparent",
        isDragging && "ring-1 ring-primary shadow-md bg-accent/30 z-40",
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
        <span
          className={cn(
            "text-[10px] font-mono px-1 py-0.5 rounded shrink-0",
            isSelected
              ? "bg-primary/15 text-primary font-bold border border-primary/25"
              : "bg-muted text-muted-foreground font-medium",
          )}
        >
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
        </div>

        {hasError && (
          <span className="text-destructive font-mono text-[9px] font-bold px-1 py-0.5 rounded bg-destructive/10 shrink-0">
            {errorCount ? `${errorCount} ERR` : "ERR"}
          </span>
        )}

        <Badge
          variant="outline"
          className={cn(
            "text-[9px] font-mono px-1 py-0 h-4 shrink-0 uppercase",
            isSelected
              ? "border-primary/30 bg-primary/10 text-primary font-medium"
              : "border-border/60 text-muted-foreground",
          )}
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
          className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded p-1 transition-colors cursor-pointer shrink-0"
          title="Remove criterion"
        >
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/**
 * @fileoverview Palette variable item component for Form Designer.
 * Displays draggable model variable pills with SN, column code, type badges, and selection states.
 *
 * @module features/system/form-config/components/designer/palette/palette-variable-item
 */

import { Plus } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { modelPropToFormElement } from "@/lib/cbs-form-spec";
import { cn } from "@/lib/core-utils";
import type { FormElement, ModelProperty } from "@/lib/data-schemas";

export interface PaletteVariableItemProps {
  property: ModelProperty;
  isPlaced: boolean;
  isSelected?: boolean;
  disabled?: boolean;
  onAddField: (template: Partial<FormElement>) => void;
  onHighlightField?: (fieldName: string) => void;
}

export function PaletteVariableItem({
  property,
  isPlaced,
  isSelected = false,
  disabled,
  onAddField,
  onHighlightField,
}: PaletteVariableItemProps) {
  const handleDragStart = (e: React.DragEvent) => {
    if (disabled || isPlaced) {
      e.preventDefault();
      return;
    }
    const payload = {
      type: "palette-variable",
      element: modelPropToFormElement(property),
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleClick = () => {
    if (isPlaced) {
      onHighlightField?.(property.NAME);
    } else {
      onAddField(modelPropToFormElement(property));
    }
  };

  const isRequired = Boolean(property.REQUIRED);
  const isMulti = property.STRUCTURE === "M";

  return (
    <button
      type="button"
      draggable={!disabled && !isPlaced}
      onDragStart={handleDragStart}
      onClick={handleClick}
      className={cn(
        "w-full h-7 flex items-center justify-between px-2 rounded border text-[11px] transition-all text-left",
        isSelected
          ? "bg-primary/10 border-primary ring-1 ring-primary/40 text-primary font-semibold shadow-2xs cursor-pointer"
          : isPlaced
            ? "bg-muted/15 border-border text-muted-foreground hover:bg-muted/30 cursor-pointer"
            : "bg-background/80 border-border/70 text-foreground hover:border-primary/50 hover:bg-accent/40 shadow-2xs cursor-grab active:cursor-grabbing",
      )}
      title={
        isPlaced
          ? `Field '${property.NAME}' is placed on canvas. Click to inspect.`
          : `Drag or click to add '${property.NAME}' (${property.TYPE}) to canvas`
      }
    >
      <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 font-mono">
        {isSelected ? (
          <span className="size-1.5 rounded-full bg-primary ring-2 ring-primary/30 shrink-0" />
        ) : isPlaced ? (
          <span className="size-1.5 rounded-full bg-primary/70 shrink-0" />
        ) : (
          <Plus className="size-3 text-primary shrink-0" />
        )}
        <span className="text-[10px] text-muted-foreground shrink-0">#{property.SN}</span>
        <span className="truncate text-[11px] font-medium">{property.NAME}</span>
        {isRequired && <span className="text-destructive font-bold text-xs shrink-0">*</span>}
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-1">
        {isMulti && (
          <Badge
            variant="outline"
            className="text-[8px] h-3.5 px-0.5 font-mono text-primary border-primary/40 bg-primary/5"
            title="Multi-value property"
          >
            M
          </Badge>
        )}
        <Badge
          variant="outline"
          className={cn(
            "text-[8px] h-3.5 px-1 font-mono uppercase",
            isSelected
              ? "text-primary border-primary/50 bg-primary/10 font-bold"
              : isPlaced
                ? "text-muted-foreground border-border bg-muted/20 font-semibold"
                : "",
          )}
        >
          {property.TYPE}
        </Badge>
      </div>
    </button>
  );
}

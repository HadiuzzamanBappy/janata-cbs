import { Plus } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn, formatNameToLabel } from "@/lib/core-utils";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { modelPropToFormElement } from "./palette-types";

export interface PaletteVariableItemProps {
  property: ModelProperty;
  isPlaced: boolean;
  disabled?: boolean;
  onAddField: (template: Partial<FormElement>) => void;
  onHighlightField?: (fieldName: string) => void;
}

export function PaletteVariableItem({
  property,
  isPlaced,
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
        isPlaced
          ? "bg-muted/15 border-emerald-500/30 text-muted-foreground cursor-default"
          : "bg-background/80 border-border/70 text-foreground hover:border-primary/50 hover:bg-accent/40 shadow-2xs cursor-grab active:cursor-grabbing",
      )}
      title={
        isPlaced
          ? `Field '${property.NAME}' is placed on canvas. Click to inspect.`
          : `Drag or click to add '${property.NAME}' (${property.TYPE}) to canvas`
      }
    >
      <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
        {isPlaced ? (
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
        ) : (
          <Plus className="size-3 text-primary shrink-0" />
        )}
        <span className="truncate font-medium">{formatNameToLabel(property.NAME)}</span>
        {isRequired && <span className="text-destructive font-bold text-xs shrink-0">*</span>}
      </div>

      <div className="flex items-center gap-1 shrink-0 ml-1">
        {isMulti && (
          <Badge
            variant="outline"
            className="text-[8px] h-3.5 px-0.5 font-mono text-sky-500 border-sky-500/40 bg-sky-500/5"
            title="Multi-value property"
          >
            M
          </Badge>
        )}
        <Badge
          variant="outline"
          className={cn(
            "text-[8px] h-3.5 px-1 font-mono uppercase",
            isPlaced && "text-emerald-500 border-emerald-500/40 bg-emerald-500/5 font-semibold",
          )}
        >
          {property.TYPE}
        </Badge>
      </div>
    </button>
  );
}

import { ChevronDown, ChevronRight, Pin, Plus } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { modelPropToFormElement } from "@/lib/cbs-form-spec";
import { cn, formatNameToLabel } from "@/lib/core-utils";
import {
  CBS_PROPERTY_STRUCTURE,
  CBS_PROPERTY_TYPE,
  type FormElement,
  type ModelProperty,
} from "@/lib/data-schemas";
import { writeDragPayload } from "../canvas/drag-payload";

export interface PaletteObjectGroupProps {
  parent: ModelProperty;
  childProperties: ModelProperty[];
  isCollapsed: boolean;
  usedFieldNames: Set<string>;
  isSelected?: boolean;
  disabled?: boolean;
  onToggleCollapse: (sn: string) => void;
  onAddField: (template: Partial<FormElement>) => void;
  onHighlightField?: (fieldName: string) => void;
  /** The group as placed on the canvas, if it is; its missing inner fields can be put back. */
  placedObject?: FormElement;
  onUpdatePlacedObject?: (fieldId: string, patch: Partial<FormElement>) => void;
}

export function PaletteObjectGroup({
  parent,
  childProperties,
  isCollapsed,
  usedFieldNames,
  isSelected = false,
  disabled,
  onToggleCollapse,
  onAddField,
  onHighlightField,
  placedObject,
  onUpdatePlacedObject,
}: PaletteObjectGroupProps) {
  const isParentPlaced = usedFieldNames.has(parent.NAME);
  const childSubFields: FormElement[] = childProperties.map((child, idx) => ({
    ...modelPropToFormElement(child),
    SN: child.SN || `${parent.SN || "1"}_${idx + 1}`,
  }));

  const objectFieldElement: FormElement = {
    ...modelPropToFormElement(parent),
    TYPE: CBS_PROPERTY_TYPE.ARRAY,
    STRUCTURE:
      parent.STRUCTURE === CBS_PROPERTY_STRUCTURE.MULTI
        ? CBS_PROPERTY_STRUCTURE.MULTI
        : CBS_PROPERTY_STRUCTURE.SINGLE,
    PROP: childSubFields,
  };

  const handleDragObjectField = (e: React.DragEvent) => {
    if (disabled || isParentPlaced) {
      e.preventDefault();
      return;
    }
    writeDragPayload(e, { type: "palette-variable", element: objectFieldElement });
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleHeaderClick = () => {
    if (isParentPlaced) {
      onHighlightField?.(parent.NAME);
    } else if (!disabled) {
      onAddField(objectFieldElement);
    }
  };

  // Inner fields removed from the placed group, which can be added back to it
  const placedInnerNames = new Set((placedObject?.PROP ?? []).map((f) => f.NAME));
  const restoreInnerField = (sub: FormElement) => {
    if (!placedObject || !onUpdatePlacedObject) return;
    onUpdatePlacedObject(String(placedObject.SN || placedObject.NAME), {
      PROP: [...(placedObject.PROP ?? []), sub],
    });
  };

  return (
    <div
      className={cn(
        "rounded border text-2xs transition-all bg-card/60 shadow-2xs overflow-hidden",
        isSelected
          ? "border-primary bg-primary/10 ring-1 ring-primary/40 font-semibold shadow-2xs"
          : isParentPlaced
            ? "border-primary/40 bg-primary/5"
            : "border-border/70 bg-card hover:border-primary/50",
      )}
    >
      {/* Object Group Header */}
      <section
        aria-label={`Drag ${parent.NAME} onto the canvas`}
        draggable={!disabled && !isParentPlaced}
        onDragStart={handleDragObjectField}
        className={cn(
          "px-2 py-1.5 flex items-center justify-between gap-1 transition-colors select-none",
          !disabled && !isParentPlaced
            ? "cursor-grab active:cursor-grabbing hover:bg-muted/40"
            : "hover:bg-muted/30",
        )}
      >
        <button
          type="button"
          onClick={handleHeaderClick}
          className="flex items-center justify-between gap-1 min-w-0 flex-1 text-left cursor-pointer"
          title={
            isParentPlaced
              ? `Object '${parent.NAME}' is placed on canvas. Click to inspect.`
              : `Drag or click to add '${parent.NAME}' (${parent.TYPE}) to canvas`
          }
        >
          <div className="flex items-center gap-1.5 min-w-0 flex-1 font-mono">
            {isParentPlaced ? (
              <Pin className="size-3 text-primary fill-current rotate-45 shrink-0" />
            ) : (
              <Plus
                className={cn(
                  "size-3 shrink-0",
                  disabled ? "text-muted-foreground" : "text-primary",
                )}
              />
            )}

            <span className="text-3xs text-muted-foreground shrink-0">#{parent.SN}</span>

            <span className="font-medium text-foreground truncate text-2xs">{parent.NAME}</span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {parent.STRUCTURE === CBS_PROPERTY_STRUCTURE.MULTI && (
              <Badge
                variant="outline"
                className="text-3xs h-3.5 px-0.5 font-mono text-primary border-primary/40 bg-primary/5"
                title="Multi-value property"
              >
                M
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "text-3xs h-3.5 px-1 font-mono uppercase",
                isSelected
                  ? "text-primary border-primary/50 bg-primary/10 font-bold"
                  : isParentPlaced
                    ? "text-muted-foreground border-border/70 bg-muted/30 font-semibold"
                    : "text-muted-foreground border-border bg-muted/20",
              )}
            >
              {parent.TYPE}
            </Badge>
          </div>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse(parent.SN);
          }}
          className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer rounded shrink-0"
          aria-label={isCollapsed ? "Expand object group" : "Collapse object group"}
        >
          {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
      </section>

      {/* Sub-fields preview if expanded */}
      {!isCollapsed && childProperties.length > 0 && (
        <div className="border-t border-border/40 bg-muted/10 p-1.5 space-y-1">
          {childProperties.map((child, idx) => {
            const canRestore =
              Boolean(placedObject) && !disabled && !placedInnerNames.has(child.NAME);
            return (
              <div
                key={child.SN}
                className="flex items-center justify-between gap-1 text-3xs px-1 py-0.5 rounded text-muted-foreground"
              >
                <span className="truncate">{formatNameToLabel(child.NAME)}</span>
                <span className="flex items-center gap-1 shrink-0">
                  <span className="font-mono text-3xs opacity-70">{child.TYPE}</span>
                  {canRestore && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => restoreInnerField(childSubFields[idx])}
                      className="size-4 p-0 text-primary hover:bg-primary/20 rounded cursor-pointer"
                      title={`Add ${child.NAME} back to ${parent.NAME}`}
                    >
                      <Plus className="size-3" />
                    </Button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

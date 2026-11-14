import { Boxes, ChevronDown, ChevronRight, Plus } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { modelPropToFormElement } from "@/lib/cbs-form-spec";
import { cn, formatNameToLabel } from "@/lib/core-utils";
import type { FormElement, ModelProperty } from "@/lib/data-schemas";

export interface PaletteObjectGroupProps {
  parent: ModelProperty;
  childProperties: ModelProperty[];
  isCollapsed: boolean;
  usedFieldNames: Set<string>;
  disabled?: boolean;
  onToggleCollapse: (sn: string) => void;
  onAddField: (template: Partial<FormElement>) => void;
  onHighlightField?: (fieldName: string) => void;
}

export function PaletteObjectGroup({
  parent,
  childProperties,
  isCollapsed,
  usedFieldNames,
  disabled,
  onToggleCollapse,
  onAddField,
  onHighlightField,
}: PaletteObjectGroupProps) {
  const isParentPlaced = usedFieldNames.has(parent.NAME);
  const childSubFields: FormElement[] = childProperties.map((child, idx) => ({
    ...modelPropToFormElement(child),
    SN: child.SN || `${parent.SN || "1"}_${idx + 1}`,
  }));

  const objectFieldElement: FormElement = {
    ...modelPropToFormElement(parent),
    TYPE: "Json",
    STRUCTURE: parent.STRUCTURE === "M" ? "M" : "S",
    PROP: childSubFields,
  };

  const handleDragObjectField = (e: React.DragEvent) => {
    if (disabled || isParentPlaced) {
      e.preventDefault();
      return;
    }
    const payload = {
      type: "palette-variable",
      element: objectFieldElement,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleAddObjectField = () => {
    onAddField(objectFieldElement);
  };

  return (
    <div
      className={cn(
        "rounded border text-[11px] transition-all bg-card/60 shadow-2xs overflow-hidden",
        isParentPlaced ? "border-border bg-muted/15" : "border-primary/30 bg-primary/5",
      )}
    >
      {/* Object Group Header */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: draggable palette drag source */}
      <div
        draggable={!disabled && !isParentPlaced}
        onDragStart={handleDragObjectField}
        className={cn(
          "px-2 py-1.5 flex items-center justify-between gap-1 transition-colors select-none",
          !disabled && !isParentPlaced
            ? "cursor-grab active:cursor-grabbing hover:bg-muted/40"
            : "",
        )}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(parent.SN);
            }}
            className="text-muted-foreground hover:text-foreground p-0.5 cursor-pointer rounded"
            aria-label={isCollapsed ? "Expand object group" : "Collapse object group"}
          >
            {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
          </button>

          <Boxes className="size-3 text-primary shrink-0" />

          <button
            type="button"
            onClick={() => onHighlightField?.(parent.NAME)}
            className="font-medium text-foreground truncate cursor-pointer hover:underline text-left"
            title={`${formatNameToLabel(parent.NAME)} (${parent.STRUCTURE === "M" ? "Multi" : "Single"} Object)`}
          >
            {formatNameToLabel(parent.NAME)}
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Badge
            variant="outline"
            className="text-[9px] h-3.5 px-1 font-mono uppercase border-primary/40 text-primary bg-primary/10"
          >
            {parent.STRUCTURE === "M" ? "M-Obj" : "S-Obj"}
          </Badge>

          {!disabled && !isParentPlaced && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={handleAddObjectField}
              className="size-5 p-0 text-primary hover:bg-primary/20 rounded cursor-pointer"
              title="Add Object Field to Canvas"
            >
              <Plus className="size-3" />
            </Button>
          )}

          {isParentPlaced && <span className="text-[10px] text-primary font-semibold">✓</span>}
        </div>
      </div>

      {/* Sub-fields preview if expanded */}
      {!isCollapsed && childProperties.length > 0 && (
        <div className="border-t border-border/40 bg-muted/10 p-1.5 space-y-1">
          {childProperties.map((child) => {
            return (
              <div
                key={child.SN}
                className="flex items-center justify-between text-[10px] px-1 py-0.5 rounded text-muted-foreground"
              >
                <span className="truncate">{formatNameToLabel(child.NAME)}</span>
                <span className="font-mono text-[9px] opacity-70">{child.TYPE}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

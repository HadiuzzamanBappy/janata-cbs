import { Boxes, ChevronDown, ChevronRight, Plus } from "lucide-react";
import type * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { modelPropToFormElement } from "./palette-types";

export interface PaletteObjectGroupProps {
  parent: ModelProperty;
  childProperties: ModelProperty[];
  isCollapsed: boolean;
  usedFieldNames: Set<string>;
  disabled?: boolean;
  onToggleCollapse: (sn: string) => void;
  onAddField: (template: Partial<FormElement>) => void;
  onHighlightField?: (fieldName: string) => void;
  onAddSection: (
    type: "standard" | "object-group" | "array-table",
    zone?: "header" | "tab" | "standard",
    initialFields?: FormElement[],
    layoutStyle?: "card" | "plain",
    customTitle?: string,
    tabGroupId?: string,
    tabTitle?: string,
    insertIndex?: number,
    columns?: number,
    bindKey?: string,
    structure?: "S" | "M",
  ) => void;
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
  onAddSection,
}: PaletteObjectGroupProps) {
  const allPlaced =
    childProperties.length > 0 && childProperties.every((c) => usedFieldNames.has(c.NAME));
  const placedChildrenCount = childProperties.filter((c) => usedFieldNames.has(c.NAME)).length;

  const handleDragGroup = (e: React.DragEvent) => {
    if (disabled || allPlaced) {
      e.preventDefault();
      return;
    }
    const initialFields: FormElement[] = childProperties.map((child, idx) => ({
      ...modelPropToFormElement(child),
      SN: child.SN || `${parent.SN || "1"}_${idx + 1}`,
    }));
    const payload = {
      type: "palette-container",
      containerType: "object-group",
      zone: "standard",
      initialFields,
      layoutStyle: "plain",
      title: parent.LABEL || parent.NAME,
      bindKey: parent.NAME,
      structure: parent.STRUCTURE === "M" ? "M" : "S",
      columns: 1,
    };
    e.dataTransfer.setData("application/json", JSON.stringify(payload));
    e.dataTransfer.effectAllowed = "copy";
  };

  const handleAddEntireObjectGroup = () => {
    const initialFields: FormElement[] = childProperties.map((child, idx) => ({
      ...modelPropToFormElement(child),
      SN: child.SN || `${parent.SN || "1"}_${idx + 1}`,
    }));

    onAddSection(
      "object-group",
      "standard",
      initialFields,
      "plain",
      parent.LABEL || parent.NAME,
      undefined,
      undefined,
      undefined,
      1,
      parent.NAME,
      parent.STRUCTURE === "M" ? "M" : "S",
    );
  };

  return (
    <div
      className={cn(
        "rounded border text-[11px] transition-all bg-card/60 shadow-2xs overflow-hidden",
        allPlaced ? "border-emerald-500/40 bg-muted/15" : "border-primary/30 bg-primary/5",
      )}
    >
      {/* Object Group Header */}
      <div className="flex items-center justify-between p-1.5 bg-muted/30 border-b border-border/50 gap-1">
        <button
          type="button"
          onClick={() => onToggleCollapse(parent.SN)}
          className="flex items-center gap-1 min-w-0 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="size-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="size-3 text-muted-foreground shrink-0" />
          )}
          <Boxes className="size-3 text-primary shrink-0" />
          <span className="truncate font-semibold text-foreground text-[11px]">
            {parent.LABEL || parent.NAME}
          </span>
        </button>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            draggable={!disabled && !allPlaced}
            onDragStart={handleDragGroup}
            className={cn(
              "border rounded text-[8px] h-3.5 px-1 font-mono uppercase transition-colors cursor-grab active:cursor-grabbing",
              "text-primary border-primary/40 bg-primary/10 hover:bg-primary/20",
            )}
            title="Drag to place complete Object Group on Canvas or into any Tab"
          >
            {parent.STRUCTURE === "M" ? "OBJECT.M" : "OBJECT"}
          </button>
          <span className="text-[9px] font-mono text-muted-foreground">
            ({placedChildrenCount}/{childProperties.length})
          </span>
        </div>
      </div>

      {/* Add Entire Object Group Button & Children */}
      {!isCollapsed && (
        <div className="p-1.5 space-y-1.5 bg-background/50">
          {!allPlaced && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddEntireObjectGroup}
              className="w-full h-6 text-[10px] gap-1 px-2 text-primary border-primary/30 hover:bg-primary/10 rounded font-medium cursor-pointer"
              title={`Add complete ${parent.LABEL || parent.NAME} group section with all child fields`}
            >
              <Plus className="size-3 stroke-[2.5]" />
              <span>Add Entire Group to Canvas</span>
            </Button>
          )}

          {/* Children List */}
          <div className="space-y-1 pl-1 border-l-2 border-primary/20">
            {childProperties.map((child) => {
              const isChildPlaced = usedFieldNames.has(child.NAME);

              return (
                <button
                  key={child.NAME}
                  type="button"
                  draggable={!disabled && !isChildPlaced}
                  onDragStart={(e) => {
                    if (disabled || isChildPlaced) {
                      e.preventDefault();
                      return;
                    }
                    const payload = {
                      type: "palette-variable",
                      element: modelPropToFormElement(child),
                    };
                    e.dataTransfer.setData("application/json", JSON.stringify(payload));
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => {
                    if (isChildPlaced) {
                      onHighlightField?.(child.NAME);
                    } else {
                      onAddField(modelPropToFormElement(child));
                    }
                  }}
                  className={cn(
                    "w-full flex items-center justify-between px-1.5 py-1 rounded border text-[10px] transition-all text-left cursor-pointer",
                    isChildPlaced
                      ? "bg-muted/20 border-emerald-500/30 text-muted-foreground cursor-default"
                      : "bg-background border-border/70 text-foreground hover:border-primary/50 shadow-2xs cursor-grab active:cursor-grabbing",
                  )}
                  title={
                    isChildPlaced
                      ? `Child field '${child.NAME}' is already placed`
                      : `Drag or click to place '${child.NAME}'`
                  }
                >
                  <div className="flex items-center gap-1 truncate flex-1 min-w-0">
                    {isChildPlaced ? (
                      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                    ) : (
                      <Plus className="size-2.5 text-primary shrink-0" />
                    )}
                    <span className="truncate font-medium">{child.LABEL}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[7px] h-3 px-1 font-mono uppercase",
                        isChildPlaced && "text-emerald-500 border-emerald-500/40 bg-emerald-500/5",
                      )}
                    >
                      {isChildPlaced ? "PLACED" : child.TYPE}
                    </Badge>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

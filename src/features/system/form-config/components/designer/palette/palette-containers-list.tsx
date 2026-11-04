import { Layers, LayoutList, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";

import type { FormElement } from "@/lib/data-schemas/form-engine-schema";

export interface PaletteContainersListProps {
  disabled?: boolean;
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

export function PaletteContainersList({ disabled, onAddSection }: PaletteContainersListProps) {
  return (
    <div className="p-2 space-y-1.5">
      {/* Standard Container */}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        draggable={!disabled}
        onDragStart={(e) => {
          if (disabled) return;
          const payload = {
            type: "palette-container",
            containerType: "standard",
            zone: "standard",
            layoutStyle: "card",
            title: "Standard Container",
            columns: 1,
          };
          e.dataTransfer.setData("application/json", JSON.stringify(payload));
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() =>
          onAddSection(
            "standard",
            "standard",
            [],
            "card",
            "Standard Container",
            undefined,
            undefined,
            undefined,
            1,
          )
        }
        className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs cursor-grab active:cursor-grabbing"
      >
        <LayoutList className="size-3.5 text-blue-500" />
        <div className="flex flex-col text-left">
          <span className="font-semibold">+ Standard</span>
          <span className="text-[9px] text-muted-foreground">General section container</span>
        </div>
      </Button>

      {/* Object Group */}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        draggable={!disabled}
        onDragStart={(e) => {
          if (disabled) return;
          const payload = {
            type: "palette-container",
            containerType: "object-group",
            zone: "standard",
            layoutStyle: "card",
            title: "Object Group",
            columns: 1,
          };
          e.dataTransfer.setData("application/json", JSON.stringify(payload));
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() =>
          onAddSection(
            "object-group",
            "standard",
            [],
            "card",
            "Object Group",
            undefined,
            undefined,
            undefined,
            1,
          )
        }
        className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs cursor-grab active:cursor-grabbing"
      >
        <Layers className="size-3.5 text-purple-500" />
        <div className="flex flex-col text-left">
          <span className="font-semibold">+ Object Group</span>
          <span className="text-[9px] text-muted-foreground">Nested sub-model binding</span>
        </div>
      </Button>

      {/* Array Table */}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        draggable={!disabled}
        onDragStart={(e) => {
          if (disabled) return;
          const payload = {
            type: "palette-container",
            containerType: "array-table",
            zone: "standard",
            layoutStyle: "card",
            title: "Array Table",
            columns: 1,
          };
          e.dataTransfer.setData("application/json", JSON.stringify(payload));
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() =>
          onAddSection(
            "array-table",
            "standard",
            [],
            "card",
            "Array Table",
            undefined,
            undefined,
            undefined,
            1,
          )
        }
        className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs cursor-grab active:cursor-grabbing"
      >
        <Table2 className="size-3.5 text-emerald-500" />
        <div className="flex flex-col text-left">
          <span className="font-semibold">+ Array Table</span>
          <span className="text-[9px] text-muted-foreground">Repeating tabular records</span>
        </div>
      </Button>

      {/* Tab Group */}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        draggable={!disabled}
        onDragStart={(e) => {
          if (disabled) return;
          const payload = {
            type: "palette-container",
            containerType: "standard",
            zone: "tab",
            layoutStyle: "card",
            title: "Tab 1",
            tabTitle: "Tab 1",
            columns: 1,
          };
          e.dataTransfer.setData("application/json", JSON.stringify(payload));
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() =>
          onAddSection("standard", "tab", [], "card", "Tab 1", undefined, "Tab 1", undefined, 1)
        }
        className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs cursor-grab active:cursor-grabbing"
      >
        <Layers className="size-3.5 text-sky-500" />
        <div className="flex flex-col text-left">
          <span className="font-semibold">+ Tab Group</span>
          <span className="text-[9px] text-muted-foreground">Tab container with addable tabs</span>
        </div>
      </Button>
    </div>
  );
}

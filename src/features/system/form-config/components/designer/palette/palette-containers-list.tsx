import { Layers, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormContainerType } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";

export interface PaletteContainersListProps {
  disabled?: boolean;
  onAddSection: (
    containerType?: FormContainerType,
    initialFields?: FormElement[],
    customTitle?: string,
    groupId?: string,
    groupTitle?: string,
    insertIndex?: number,
    columns?: number,
  ) => void;
}

export function PaletteContainersList({ disabled, onAddSection }: PaletteContainersListProps) {
  return (
    <div className="p-2 space-y-1.5">
      {/* Card Container */}
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        draggable={!disabled}
        onDragStart={(e) => {
          if (disabled) return;
          const payload = {
            type: "palette-container",
            containerType: "card",
            title: "Card Section",
            columns: 1,
          };
          e.dataTransfer.setData("application/json", JSON.stringify(payload));
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => onAddSection("card", [], "Card Section", undefined, undefined, undefined, 1)}
        className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs cursor-grab active:cursor-grabbing"
      >
        <LayoutList className="size-3.5 text-blue-500" />
        <div className="flex flex-col text-left">
          <span className="font-semibold">+ Card Container</span>
          <span className="text-[9px] text-muted-foreground">Titled visual section for fields</span>
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
            containerType: "tab",
            title: "Tab 1",
            groupTitle: "Tab 1",
            columns: 1,
          };
          e.dataTransfer.setData("application/json", JSON.stringify(payload));
          e.dataTransfer.effectAllowed = "copy";
        }}
        onClick={() => onAddSection("tab", [], "Tab 1", undefined, "Tab 1", undefined, 1)}
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

import { Columns2, Columns3, Columns4, Layers, LayoutList, PanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormContainerType, FormElement } from "@/lib/data-schemas";

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
  const containerPresets = [
    {
      title: "1-Col Card Section",
      subtitle: "Single-column full width scanline",
      icon: <LayoutList className="size-3.5 text-primary shrink-0" />,
      containerType: "card" as const,
      columns: 1,
    },
    {
      title: "2-Col Card Section",
      subtitle: "Compact dual-column banking pair",
      icon: <Columns2 className="size-3.5 text-primary/80 shrink-0" />,
      containerType: "card" as const,
      columns: 2,
    },
    {
      title: "3-Col Card Section",
      subtitle: "Standard 3-column workstation layout",
      icon: <Columns3 className="size-3.5 text-primary/70 shrink-0" />,
      containerType: "card" as const,
      columns: 3,
    },
    {
      title: "4-Col Card Section",
      subtitle: "High-density 4-column financial grid",
      icon: <Columns4 className="size-3.5 text-primary/60 shrink-0" />,
      containerType: "card" as const,
      columns: 4,
    },
    {
      title: "Tab Group Container",
      subtitle: "Multi-page tabbed container",
      icon: <Layers className="size-3.5 text-primary shrink-0" />,
      containerType: "tab" as const,
      columns: 2,
    },
    {
      title: "Header Summary Card",
      subtitle: "Readonly compact top summary card",
      icon: <PanelTop className="size-3.5 text-muted-foreground shrink-0" />,
      containerType: "card" as const,
      columns: 4,
    },
  ];

  return (
    <div className="p-2 space-y-1.5 overflow-y-auto">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block px-1 mb-1">
        Structural Containers
      </span>
      {containerPresets.map((preset) => {
        const isTab = preset.containerType === "tab";
        return (
          <Button
            key={preset.title}
            variant="outline"
            size="sm"
            disabled={disabled}
            draggable={!disabled}
            onDragStart={(e) => {
              if (disabled) return;
              const payload = {
                type: "palette-container",
                containerType: preset.containerType,
                title: preset.title,
                groupTitle: isTab ? "Tab 1" : undefined,
                columns: preset.columns,
              };
              e.dataTransfer.setData("application/json", JSON.stringify(payload));
              e.dataTransfer.effectAllowed = "copy";
            }}
            onClick={() =>
              onAddSection(
                preset.containerType,
                [],
                preset.title,
                undefined,
                isTab ? "Tab 1" : undefined,
                undefined,
                preset.columns,
              )
            }
            className="w-full h-8 text-xs justify-start gap-1.5 bg-background/80 hover:bg-muted/40 border-border/70 shadow-2xs cursor-grab active:cursor-grabbing text-left px-2"
          >
            {preset.icon}
            <div className="flex flex-col truncate min-w-0 flex-1">
              <span className="font-semibold text-foreground text-[10px] truncate leading-tight">
                + {preset.title}
              </span>
              <span className="text-[9px] text-muted-foreground truncate leading-tight">
                {preset.subtitle}
              </span>
            </div>
          </Button>
        );
      })}
    </div>
  );
}

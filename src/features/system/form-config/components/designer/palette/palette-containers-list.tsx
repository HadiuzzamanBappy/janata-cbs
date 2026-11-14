import { Layers, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContainerConfig, FormContainerType, FormElement } from "@/lib/data-schemas";

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
    containerConfig?: ContainerConfig,
  ) => void;
}

export function PaletteContainersList({ disabled, onAddSection }: PaletteContainersListProps) {
  const containerPresets = [
    {
      title: "Card Container",
      subtitle: "Multi-column grouped card section",
      icon: <LayoutList className="size-3.5 text-muted-foreground shrink-0" />,
      containerType: "card" as const,
      containerConfig: undefined,
      columns: 1,
    },
    {
      title: "Tab Group",
      subtitle: "Multi-page tabbed cluster",
      icon: <Layers className="size-3.5 text-muted-foreground shrink-0" />,
      containerType: "tab" as const,
      containerConfig: undefined,
      columns: 1,
    },
  ];

  return (
    <div className="p-2 space-y-1.5 overflow-y-auto">
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
                containerConfig: preset.containerConfig,
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
                preset.containerConfig,
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

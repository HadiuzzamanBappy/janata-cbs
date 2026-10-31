import { Database, Layers } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/core-utils";
import { PaletteContainersList } from "./palette/palette-containers-list";
import { PaletteObjectGroup } from "./palette/palette-object-group";
import type { FieldPaletteProps, PaletteItem } from "./palette/palette-types";
import { PaletteVariableItem } from "./palette/palette-variable-item";
import { usePaletteVariables } from "./palette/use-palette-variables";

export function FieldPalette({
  targetModel,
  modelProperties: propsModelProperties,
  usedFieldNames = new Set(),
  onHighlightField,
  onAddField,
  onAddSection,
  disabled,
}: FieldPaletteProps) {
  const [activePaletteTab, setActivePaletteTab] = React.useState<"variables" | "containers">(
    "variables",
  );

  const {
    modelProperties,
    loadingModel,
    modelFilter,
    setModelFilter,
    placedCount,
    paletteItems,
    collapsedGroups,
    toggleGroupCollapse,
  } = usePaletteVariables({
    targetModel,
    propsModelProperties,
    usedFieldNames,
  });

  return (
    <div className="w-60 border-r border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0">
      {/* Palette Navigation Tabs */}
      <div className="border-b border-border/70 bg-muted/20 flex items-center p-1 gap-1">
        <button
          type="button"
          onClick={() => setActivePaletteTab("variables")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-0",
            activePaletteTab === "variables"
              ? "bg-background text-primary shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground bg-transparent",
          )}
        >
          <Database className="size-3 text-primary" />
          <span>Variables</span>
          {modelProperties.length > 0 && (
            <span className="text-[9px] font-mono opacity-70">
              ({placedCount}/{modelProperties.length})
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActivePaletteTab("containers")}
          className={cn(
            "flex-1 py-1.5 px-2 rounded text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border-0",
            activePaletteTab === "containers"
              ? "bg-background text-primary shadow-xs font-bold"
              : "text-muted-foreground hover:text-foreground bg-transparent",
          )}
        >
          <Layers className="size-3 text-emerald-500" />
          <span>Containers</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* TAB 1: VARIABLES */}
        {activePaletteTab === "variables" && (
          <div className="p-2 space-y-2">
            {modelProperties.length > 0 && (
              <div className="flex items-center w-full bg-muted/30 p-0.5 rounded border border-border/60">
                <button
                  type="button"
                  onClick={() => setModelFilter("all")}
                  className={cn(
                    "flex-1 py-1 text-[10px] font-semibold text-center rounded transition-all cursor-pointer border-0",
                    modelFilter === "all"
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground bg-transparent",
                  )}
                >
                  All ({modelProperties.length})
                </button>
                <button
                  type="button"
                  onClick={() => setModelFilter("unplaced")}
                  className={cn(
                    "flex-1 py-1 text-[10px] font-semibold text-center rounded transition-all cursor-pointer border-0",
                    modelFilter === "unplaced"
                      ? "bg-background text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground bg-transparent",
                  )}
                >
                  Unplaced ({modelProperties.length - placedCount})
                </button>
              </div>
            )}

            {loadingModel ? (
              <div className="text-[10px] text-muted-foreground italic px-2 py-4 text-center font-mono">
                Loading schema variables...
              </div>
            ) : paletteItems.length > 0 ? (
              <div className="space-y-1.5">
                {paletteItems.map((item: PaletteItem) => {
                  if (item.kind === "single") {
                    return (
                      <PaletteVariableItem
                        key={item.property.NAME}
                        property={item.property}
                        isPlaced={usedFieldNames.has(item.property.NAME)}
                        disabled={disabled}
                        onAddField={onAddField}
                        onHighlightField={onHighlightField}
                      />
                    );
                  }

                  return (
                    <PaletteObjectGroup
                      key={item.parent.SN}
                      parent={item.parent}
                      childProperties={item.children}
                      isCollapsed={collapsedGroups[item.parent.SN] ?? false}
                      usedFieldNames={usedFieldNames}
                      disabled={disabled}
                      onToggleCollapse={toggleGroupCollapse}
                      onAddField={onAddField}
                      onHighlightField={onHighlightField}
                      onAddSection={onAddSection}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground/60 italic px-2 py-6 text-center">
                {modelFilter === "unplaced"
                  ? "✓ All model variables placed on canvas!"
                  : "No variables found for this model"}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONTAINERS */}
        {activePaletteTab === "containers" && (
          <PaletteContainersList disabled={disabled} onAddSection={onAddSection} />
        )}
      </div>
    </div>
  );
}

export type { FieldPaletteProps };

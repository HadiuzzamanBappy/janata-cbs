import { Columns, Database, Layers, LayoutGrid, Plus } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type { FormFieldItem, FormWidgetType } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface FieldPaletteProps {
  targetModel?: string;
  usedFieldKeys?: Set<string>;
  onHighlightField?: (fieldKey: string) => void;
  onAddField: (template: {
    label: string;
    widget: FormWidgetType;
    colSpan: number;
    fieldKey?: string;
    currencyPrefix?: string;
    options?: string[];
  }) => void;
  onAddSection: (
    type: "standard" | "object-group" | "array-table",
    zone?: "header" | "tab" | "standard",
    initialFields?: FormFieldItem[],
    layoutStyle?: "card" | "plain",
    customTitle?: string,
    tabGroupId?: string,
    tabTitle?: string,
    insertIndex?: number,
    columns?: number,
  ) => void;
  disabled?: boolean;
}

export function FieldPalette({
  targetModel,
  usedFieldKeys = new Set(),
  onHighlightField,
  onAddField,
  onAddSection,
  disabled,
}: FieldPaletteProps) {
  const [modelProperties, setModelProperties] = React.useState<ModelProperty[]>([]);
  const [loadingModel, setLoadingModel] = React.useState<boolean>(false);
  const [modelFilter, setModelFilter] = React.useState<"all" | "unplaced">("all");

  React.useEffect(() => {
    if (!targetModel) {
      setModelProperties([]);
      return;
    }

    let isMounted = true;
    setLoadingModel(true);

    cbs
      .send<ModelConfigRecord>(cbs.modelConfig.getModelConfig(targetModel))
      .then((res) => {
        if (isMounted && res.data?.properties) {
          setModelProperties(res.data.properties);
        }
      })
      .catch(() => {
        if (isMounted) setModelProperties([]);
      })
      .finally(() => {
        if (isMounted) setLoadingModel(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetModel]);

  const [activePaletteTab, setActivePaletteTab] = React.useState<"variables" | "containers">(
    "variables",
  );

  const mapPropertyToWidget = (
    prop: ModelProperty,
  ): { widget: FormWidgetType; currencyPrefix?: string } => {
    if (
      prop.name.toLowerCase().includes("deposit") ||
      prop.name.toLowerCase().includes("amount") ||
      prop.name.toLowerCase().includes("balance")
    ) {
      return { widget: "amount", currencyPrefix: "BDT" };
    }
    if (prop.type === "Number") return { widget: "number" };
    if (prop.type === "Date") return { widget: "date" };
    if (prop.type === "Boolean") return { widget: "switch" };
    return { widget: "text" };
  };

  const placedCount = React.useMemo(() => {
    return modelProperties.filter((p) => usedFieldKeys.has(p.name)).length;
  }, [modelProperties, usedFieldKeys]);

  const displayedProperties = React.useMemo(() => {
    if (modelFilter === "unplaced") {
      return modelProperties.filter((p) => !usedFieldKeys.has(p.name));
    }
    return modelProperties;
  }, [modelProperties, modelFilter, usedFieldKeys]);

  return (
    <div className="w-60 border-r border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0">
      {/* Palette Navigation Tabs: Variables (First & Default) vs Containers */}
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
        {/* TAB 1: VARIABLES (Model Schema Fields) - DEFAULT & FIRST */}
        {activePaletteTab === "variables" && (
          <div className="p-2 space-y-2">
            {/* Full-width Sub-Tab Strip under Root Tabs */}
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
            ) : displayedProperties.length > 0 ? (
              <div className="grid grid-cols-1 gap-1">
                {displayedProperties.map((prop) => {
                  const mapped = mapPropertyToWidget(prop);
                  const isPlaced = usedFieldKeys.has(prop.name);

                  return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: Draggable palette variable item
                    <div
                      key={prop.name}
                      draggable={!disabled && !isPlaced}
                      onDragStart={(e) => {
                        if (disabled || isPlaced) {
                          e.preventDefault();
                          return;
                        }
                        const payload = {
                          type: "palette-variable",
                          template: {
                            label: prop.label,
                            fieldKey: prop.name,
                            widget: mapped.widget,
                            currencyPrefix: mapped.currencyPrefix,
                            colSpan: 12,
                          },
                        };
                        e.dataTransfer.setData("application/json", JSON.stringify(payload));
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      className={cn(
                        "flex items-center justify-between px-2 py-1.5 rounded border text-[11px] transition-all",
                        isPlaced
                          ? "bg-muted/20 border-emerald-500/30 text-muted-foreground cursor-default"
                          : "bg-background border-border/70 text-foreground hover:border-primary/50 shadow-2xs cursor-grab active:cursor-grabbing",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (isPlaced) {
                            onHighlightField?.(prop.name);
                          } else {
                            onAddField({
                              label: prop.label,
                              fieldKey: prop.name,
                              widget: mapped.widget,
                              currencyPrefix: mapped.currencyPrefix,
                              colSpan: 12,
                            });
                          }
                        }}
                        className="flex items-center gap-1.5 truncate flex-1 min-w-0 bg-transparent border-0 p-0 text-left cursor-pointer"
                        title={
                          isPlaced
                            ? `Field '${prop.name}' is already on canvas. Click to inspect.`
                            : `Drag or click to add '${prop.name}' to canvas`
                        }
                      >
                        {isPlaced ? (
                          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                        ) : (
                          <Plus className="size-3 text-primary shrink-0" />
                        )}
                        <span className="truncate font-medium">{prop.label}</span>
                      </button>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[8px] h-3.5 px-1 font-mono uppercase",
                            isPlaced && "text-emerald-500 border-emerald-500/40 bg-emerald-500/5",
                          )}
                        >
                          {isPlaced ? "PLACED" : prop.type}
                        </Badge>
                      </div>
                    </div>
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

        {/* TAB 2: CONTAINERS (Layout Containers: 2-Col, 3-Col, Card, Group, Tab) */}
        {activePaletteTab === "containers" && (
          <div className="p-2 space-y-1.5">
            {/* 2-Column Row Container */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable container button wrapper */}
            <div
              draggable={!disabled}
              onDragStart={(e) => {
                if (disabled) return;
                const payload = {
                  type: "palette-container",
                  containerType: "standard",
                  zone: "standard",
                  layoutStyle: "card",
                  title: "2-Column Row",
                  columns: 2,
                };
                e.dataTransfer.setData("application/json", JSON.stringify(payload));
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  onAddSection(
                    "standard",
                    "standard",
                    [],
                    "card",
                    "2-Column Row",
                    undefined,
                    undefined,
                    undefined,
                    2,
                  )
                }
                className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs pointer-events-auto"
              >
                <Columns className="size-3.5 text-blue-500" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold">+ 2-Column Row</span>
                  <span className="text-[9px] text-muted-foreground">
                    2 columns layout (50% / 50%)
                  </span>
                </div>
              </Button>
            </div>

            {/* 3-Column Row Container */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable container button wrapper */}
            <div
              draggable={!disabled}
              onDragStart={(e) => {
                if (disabled) return;
                const payload = {
                  type: "palette-container",
                  containerType: "standard",
                  zone: "standard",
                  layoutStyle: "card",
                  title: "3-Column Row",
                  columns: 3,
                };
                e.dataTransfer.setData("application/json", JSON.stringify(payload));
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  onAddSection(
                    "standard",
                    "standard",
                    [],
                    "card",
                    "3-Column Row",
                    undefined,
                    undefined,
                    undefined,
                    3,
                  )
                }
                className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs pointer-events-auto"
              >
                <LayoutGrid className="size-3.5 text-emerald-500" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold">+ 3-Column Row</span>
                  <span className="text-[9px] text-muted-foreground">
                    3 columns layout (33% each / free columns)
                  </span>
                </div>
              </Button>
            </div>

            {/* Standard 1-Col Card Container */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable container button wrapper */}
            <div
              draggable={!disabled}
              onDragStart={(e) => {
                if (disabled) return;
                const payload = {
                  type: "palette-container",
                  containerType: "standard",
                  zone: "standard",
                  layoutStyle: "card",
                  title: "Card Container",
                  columns: 1,
                };
                e.dataTransfer.setData("application/json", JSON.stringify(payload));
                e.dataTransfer.effectAllowed = "copy";
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  onAddSection(
                    "standard",
                    "standard",
                    [],
                    "card",
                    "Card Container",
                    undefined,
                    undefined,
                    undefined,
                    1,
                  )
                }
                className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs pointer-events-auto"
              >
                <Layers className="size-3.5 text-amber-500" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold">+ Card Container</span>
                  <span className="text-[9px] text-muted-foreground">
                    Standard 1-column visual section card
                  </span>
                </div>
              </Button>
            </div>

            {/* Object Group */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable container button wrapper */}
            <div
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
              className="cursor-grab active:cursor-grabbing"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
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
                className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs pointer-events-auto"
              >
                <Layers className="size-3.5 text-purple-500" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold">+ Object Group</span>
                  <span className="text-[9px] text-muted-foreground">Nested sub-model binding</span>
                </div>
              </Button>
            </div>

            {/* Tab Group */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: Draggable container button wrapper */}
            <div
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
              className="cursor-grab active:cursor-grabbing"
            >
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  onAddSection(
                    "standard",
                    "tab",
                    [],
                    "card",
                    "Tab 1",
                    undefined,
                    "Tab 1",
                    undefined,
                    1,
                  )
                }
                className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs pointer-events-auto"
              >
                <Layers className="size-3.5 text-sky-500" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold">+ Tab Group</span>
                  <span className="text-[9px] text-muted-foreground">
                    Tab container with addable tabs
                  </span>
                </div>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

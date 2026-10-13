import { ChevronDown, ChevronRight, Database, FolderPlus, Layers, Plus } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type { FormWidgetType } from "@/lib/data-schemas/form-config-schema";
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

  // Accordion open/close states - default expanded
  const [isContainersOpen, setIsContainersOpen] = React.useState<boolean>(true);
  const [isFieldsOpen, setIsFieldsOpen] = React.useState<boolean>(true);

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
    <div className="w-56 border-r border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0">
      {/* Palette Header */}
      <div className="px-2.5 py-1.5 border-b border-border/60 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Layers className="size-3 text-primary" />
          <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground">
            Structure & Fields
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Accordion 1: Containers & Groups */}
        <div className="border-b border-border/70">
          <button
            type="button"
            onClick={() => setIsContainersOpen((prev) => !prev)}
            className="w-full px-2.5 py-1.5 bg-muted/20 hover:bg-muted/40 flex items-center justify-between cursor-pointer border-0 text-left transition-colors"
          >
            <div className="flex items-center gap-1.5">
              {isContainersOpen ? (
                <ChevronDown className="size-3 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-3 text-muted-foreground" />
              )}
              <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
                Containers & Groups
              </span>
            </div>
            <span className="text-[9px] font-mono text-muted-foreground">4</span>
          </button>

          {isContainersOpen && (
            <div className="p-1.5 space-y-1">
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onAddSection("standard", "standard")}
                className="w-full h-7 text-xs justify-start gap-2 bg-background/80 hover:bg-muted/30"
              >
                <Layers className="size-3 text-emerald-500" />
                <span>+ Standard Card</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onAddSection("standard", "standard")}
                className="w-full h-7 text-xs justify-start gap-2 bg-background/80 hover:bg-muted/30"
              >
                <FolderPlus className="size-3 text-amber-500" />
                <span>+ Plain Block (No Card)</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onAddSection("object-group", "standard")}
                className="w-full h-7 text-xs justify-start gap-2 bg-background/80 hover:bg-muted/30"
              >
                <Layers className="size-3 text-purple-500" />
                <span>+ Object Group</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onAddSection("standard", "tab")}
                className="w-full h-7 text-xs justify-start gap-2 bg-background/80 hover:bg-muted/30"
              >
                <Layers className="size-3 text-sky-500" />
                <span>+ Body Tab Page</span>
              </Button>
            </div>
          )}
        </div>

        {/* Accordion 2: Model Schema Fields */}
        {targetModel && (
          <div className="border-b border-border/70">
            <button
              type="button"
              onClick={() => setIsFieldsOpen((prev) => !prev)}
              className="w-full px-2.5 py-1.5 bg-muted/20 hover:bg-muted/40 flex items-center justify-between cursor-pointer border-0 text-left transition-colors"
            >
              <div className="flex items-center gap-1.5">
                {isFieldsOpen ? (
                  <ChevronDown className="size-3 text-muted-foreground" />
                ) : (
                  <ChevronRight className="size-3 text-muted-foreground" />
                )}
                <Database className="size-2.5 text-primary" />
                <span className="text-[10px] font-semibold text-foreground uppercase tracking-wider">
                  {targetModel} Fields
                </span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground">
                {placedCount}/{modelProperties.length}
              </span>
            </button>

            {isFieldsOpen && (
              <div className="p-1.5 space-y-1.5">
                {/* Filter Toggle */}
                {modelProperties.length > 0 && (
                  <div className="flex items-center gap-1 px-0.5">
                    <button
                      type="button"
                      onClick={() => setModelFilter("all")}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors border-0",
                        modelFilter === "all"
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground hover:text-foreground bg-transparent",
                      )}
                    >
                      All ({modelProperties.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setModelFilter("unplaced")}
                      className={cn(
                        "text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors border-0",
                        modelFilter === "unplaced"
                          ? "bg-primary/10 text-primary font-bold"
                          : "text-muted-foreground hover:text-foreground bg-transparent",
                      )}
                    >
                      Unplaced ({modelProperties.length - placedCount})
                    </button>
                  </div>
                )}

                {loadingModel ? (
                  <div className="text-[10px] text-muted-foreground italic px-1 py-1 font-mono">
                    Loading schema...
                  </div>
                ) : displayedProperties.length > 0 ? (
                  <div className="grid grid-cols-1 gap-1">
                    {displayedProperties.map((prop) => {
                      const mapped = mapPropertyToWidget(prop);
                      const isPlaced = usedFieldKeys.has(prop.name);

                      return (
                        <div
                          key={prop.name}
                          className={cn(
                            "flex items-center justify-between px-2 py-1 rounded border text-[11px] transition-all",
                            isPlaced
                              ? "bg-muted/20 border-emerald-500/30 text-muted-foreground"
                              : "bg-background border-border/70 text-foreground hover:border-primary/50",
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
                                  colSpan: 6,
                                });
                              }
                            }}
                            className="flex items-center gap-1.5 truncate flex-1 min-w-0 bg-transparent border-0 p-0 text-left cursor-pointer"
                            title={
                              isPlaced
                                ? `Field '${prop.name}' is already on canvas. Click to select.`
                                : `Add '${prop.name}' to canvas`
                            }
                          >
                            {isPlaced ? (
                              <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                            ) : (
                              <Plus className="size-2.5 text-primary shrink-0" />
                            )}
                            <span className="truncate">{prop.label}</span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[8px] h-3.5 px-1 font-mono uppercase",
                                isPlaced && "text-emerald-500 border-emerald-500/40",
                              )}
                            >
                              {isPlaced ? "ON CANVAS" : prop.type}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] text-muted-foreground/60 italic px-1 py-2 text-center">
                    {modelFilter === "unplaced"
                      ? "✓ All model fields placed on canvas!"
                      : "No properties found"}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

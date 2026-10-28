import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Columns,
  Database,
  Layers,
  LayoutGrid,
  Plus,
} from "lucide-react";
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
    modelType?: string;
    parameter?: unknown;
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
      .send<ModelConfigRecord>(cbs.modelConfig.get(targetModel))
      .then((res) => {
        if (isMounted && res.data?.PROPERTIES) {
          setModelProperties(res.data.PROPERTIES);
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
  ): {
    widget: FormWidgetType;
    currencyPrefix?: string;
    options?: string[];
    modelType?: string;
    parameter?: unknown;
  } => {
    const isAmount =
      prop.NAME.toLowerCase().includes("deposit") ||
      prop.NAME.toLowerCase().includes("amount") ||
      prop.NAME.toLowerCase().includes("balance");

    if (isAmount) {
      return {
        widget: "amount",
        currencyPrefix: "BDT",
        modelType: prop.TYPE,
        parameter: prop.PARAMETER,
      };
    }

    const staticOptions =
      prop.PARAMETER?.TYPE === "O" && Array.isArray(prop.PARAMETER.DATA)
        ? prop.PARAMETER.DATA.map((d) => d.ITEMLABEL || d.ITEMCODE)
        : undefined;

    let widget: FormWidgetType = "text";
    if (prop.TYPE === "Number") {
      widget = staticOptions?.length ? "select" : "number";
    } else if (prop.TYPE === "Date") {
      widget = "date";
    } else if (prop.TYPE === "Boolean") {
      widget = "switch";
    } else if (prop.TYPE === "Dropdown") {
      widget = "select";
    } else if (prop.TYPE === "Radio") {
      widget = "radio-group";
    } else if (prop.TYPE === "Checkbox" || prop.TYPE === "Array") {
      widget = "checkbox-group";
    } else if (prop.TYPE === "Textarea") {
      widget = "textarea";
    }

    return {
      widget,
      options: staticOptions,
      modelType: prop.TYPE,
      parameter: prop.PARAMETER,
    };
  };

  const placedCount = React.useMemo(() => {
    return modelProperties.filter((p) => usedFieldKeys.has(p.NAME)).length;
  }, [modelProperties, usedFieldKeys]);

  // Group properties into standalone fields and hierarchical object groups
  type PaletteItem =
    | { kind: "single"; property: ModelProperty }
    | { kind: "object-group"; parent: ModelProperty; children: ModelProperty[] };

  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});
  const toggleGroupCollapse = (sn: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [sn]: !prev[sn] }));
  };

  const paletteItems: PaletteItem[] = React.useMemo(() => {
    const objectMap = new Map<string, { parent: ModelProperty; children: ModelProperty[] }>();
    const childSet = new Set<string>();

    for (const p of modelProperties) {
      if (p.TYPE === "Object") {
        objectMap.set(p.SN, { parent: p, children: [] });
      }
    }

    for (const p of modelProperties) {
      if (p.TYPE !== "Object" && p.SN.includes("_")) {
        const parentSn = p.SN.substring(0, p.SN.lastIndexOf("_"));
        const parentEntry = objectMap.get(parentSn);
        if (parentEntry) {
          parentEntry.children.push(p);
          childSet.add(p.NAME);
        }
      }
    }

    const items: PaletteItem[] = [];
    for (const p of modelProperties) {
      if (p.TYPE === "Object") {
        const grp = objectMap.get(p.SN);
        if (grp) {
          items.push({ kind: "object-group", parent: grp.parent, children: grp.children });
        }
      } else if (!childSet.has(p.NAME)) {
        items.push({ kind: "single", property: p });
      }
    }

    // Filter by modelFilter ("all" | "unplaced")
    if (modelFilter === "unplaced") {
      return items.filter((item) => {
        if (item.kind === "single") {
          return !usedFieldKeys.has(item.property.NAME);
        }
        // For object group, show if any child is unplaced or parent is not fully placed
        return item.children.some((c) => !usedFieldKeys.has(c.NAME));
      });
    }

    return items;
  }, [modelProperties, modelFilter, usedFieldKeys]);

  const handleAddEntireObjectGroup = (parent: ModelProperty, children: ModelProperty[]) => {
    const initialFields: FormFieldItem[] = children.map((child, idx) => {
      const mapped = mapPropertyToWidget(child);
      return {
        id: `f_${child.NAME}_${Date.now()}_${idx}`,
        fieldKey: child.NAME,
        label: child.LABEL,
        widget: mapped.widget,
        currencyPrefix: mapped.currencyPrefix,
        colSpan: 12,
        options: mapped.options,
        modelType: mapped.modelType,
        parameter: mapped.parameter,
        structure: child.STRUCTURE || "S",
        groupKey: parent.NAME,
        groupSn: parent.SN,
        groupLabel: parent.LABEL || parent.NAME,
        groupStructure: parent.STRUCTURE,
        isFirstInGroup: idx === 0,
      };
    });

    onAddSection(
      "object-group",
      "standard",
      initialFields,
      "card",
      parent.LABEL || parent.NAME,
      undefined,
      undefined,
      undefined,
      1,
    );
  };

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
            ) : paletteItems.length > 0 ? (
              <div className="space-y-1.5">
                {paletteItems.map((item) => {
                  if (item.kind === "single") {
                    const prop = item.property;
                    const mapped = mapPropertyToWidget(prop);
                    const isPlaced = usedFieldKeys.has(prop.NAME);

                    return (
                      // biome-ignore lint/a11y/noStaticElementInteractions: Draggable palette variable item
                      <div
                        key={prop.NAME}
                        draggable={!disabled && !isPlaced}
                        onDragStart={(e) => {
                          if (disabled || isPlaced) {
                            e.preventDefault();
                            return;
                          }
                          const payload = {
                            type: "palette-variable",
                            template: {
                              label: prop.LABEL,
                              fieldKey: prop.NAME,
                              widget: mapped.widget,
                              currencyPrefix: mapped.currencyPrefix,
                              colSpan: 12,
                              options: mapped.options,
                              modelType: mapped.modelType,
                              parameter: mapped.parameter,
                              structure: prop.STRUCTURE || "S",
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
                              onHighlightField?.(prop.NAME);
                            } else {
                              onAddField({
                                label: prop.LABEL,
                                fieldKey: prop.NAME,
                                widget: mapped.widget,
                                currencyPrefix: mapped.currencyPrefix,
                                colSpan: 12,
                                options: mapped.options,
                                modelType: mapped.modelType,
                                parameter: mapped.parameter,
                              });
                            }
                          }}
                          className="flex items-center gap-1.5 truncate flex-1 min-w-0 bg-transparent border-0 p-0 text-left cursor-pointer"
                          title={
                            isPlaced
                              ? `Field '${prop.NAME}' is already on canvas. Click to inspect.`
                              : `Drag or click to add '${prop.NAME}' to canvas`
                          }
                        >
                          {isPlaced ? (
                            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                          ) : (
                            <Plus className="size-3 text-primary shrink-0" />
                          )}
                          <span className="truncate font-medium">{prop.LABEL}</span>
                        </button>

                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[8px] h-3.5 px-1 font-mono uppercase",
                              isPlaced && "text-emerald-500 border-emerald-500/40 bg-emerald-500/5",
                            )}
                          >
                            {isPlaced ? "PLACED" : prop.TYPE}
                          </Badge>
                        </div>
                      </div>
                    );
                  }

                  // Object Group Card with hierarchical child fields
                  const parent = item.parent;
                  const children = item.children;
                  const isCollapsed = collapsedGroups[parent.SN] ?? false;
                  const allPlaced =
                    children.length > 0 && children.every((c) => usedFieldKeys.has(c.NAME));
                  const placedChildrenCount = children.filter((c) =>
                    usedFieldKeys.has(c.NAME),
                  ).length;

                  return (
                    <div
                      key={parent.SN}
                      className={cn(
                        "rounded border text-[11px] transition-all bg-card/60 shadow-2xs overflow-hidden",
                        allPlaced
                          ? "border-emerald-500/40 bg-muted/15"
                          : "border-primary/30 bg-primary/5",
                      )}
                    >
                      {/* Object Group Header */}
                      <div className="flex items-center justify-between p-1.5 bg-muted/30 border-b border-border/50 gap-1">
                        <button
                          type="button"
                          onClick={() => toggleGroupCollapse(parent.SN)}
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
                          <Badge
                            variant="outline"
                            className="text-[8px] h-3.5 px-1 font-mono uppercase text-primary border-primary/40 bg-primary/10"
                          >
                            {parent.STRUCTURE === "M" ? "OBJECT.M" : "OBJECT"}
                          </Badge>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            ({placedChildrenCount}/{children.length})
                          </span>
                        </div>
                      </div>

                      {/* Add Entire Object Group Button & Drag Handle */}
                      {!isCollapsed && (
                        <div className="p-1.5 space-y-1.5 bg-background/50">
                          {!allPlaced && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddEntireObjectGroup(parent, children)}
                              className="w-full h-6 text-[10px] gap-1 px-2 text-primary border-primary/30 hover:bg-primary/10 rounded font-medium cursor-pointer"
                              title={`Add complete ${parent.LABEL || parent.NAME} group section with all child fields`}
                            >
                              <Plus className="size-3 stroke-[2.5]" />
                              <span>Add Entire Group to Canvas</span>
                            </Button>
                          )}

                          {/* Children List */}
                          <div className="space-y-1 pl-1 border-l-2 border-primary/20">
                            {children.map((child, childIdx) => {
                              const mapped = mapPropertyToWidget(child);
                              const isChildPlaced = usedFieldKeys.has(child.NAME);

                              return (
                                // biome-ignore lint/a11y/noStaticElementInteractions: Draggable child variable
                                <div
                                  key={child.NAME}
                                  draggable={!disabled && !isChildPlaced}
                                  onDragStart={(e) => {
                                    if (disabled || isChildPlaced) {
                                      e.preventDefault();
                                      return;
                                    }
                                    const payload = {
                                      type: "palette-variable",
                                      template: {
                                        label: child.LABEL,
                                        fieldKey: child.NAME,
                                        widget: mapped.widget,
                                        currencyPrefix: mapped.currencyPrefix,
                                        colSpan: 12,
                                        options: mapped.options,
                                        modelType: mapped.modelType,
                                        parameter: mapped.parameter,
                                        structure: child.STRUCTURE || "S",
                                        groupKey: parent.NAME,
                                        groupSn: parent.SN,
                                        groupLabel: parent.LABEL || parent.NAME,
                                        groupStructure: parent.STRUCTURE,
                                        isFirstInGroup: childIdx === 0,
                                      },
                                    };
                                    e.dataTransfer.setData(
                                      "application/json",
                                      JSON.stringify(payload),
                                    );
                                    e.dataTransfer.effectAllowed = "copy";
                                  }}
                                  className={cn(
                                    "flex items-center justify-between px-1.5 py-1 rounded border text-[10px] transition-all",
                                    isChildPlaced
                                      ? "bg-muted/20 border-emerald-500/30 text-muted-foreground cursor-default"
                                      : "bg-background border-border/70 text-foreground hover:border-primary/50 shadow-2xs cursor-grab active:cursor-grabbing",
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (isChildPlaced) {
                                        onHighlightField?.(child.NAME);
                                      } else {
                                        onAddField({
                                          label: child.LABEL,
                                          fieldKey: child.NAME,
                                          widget: mapped.widget,
                                          currencyPrefix: mapped.currencyPrefix,
                                          colSpan: 12,
                                          options: mapped.options,
                                          modelType: mapped.modelType,
                                          parameter: mapped.parameter,
                                        });
                                      }
                                    }}
                                    className="flex items-center gap-1 truncate flex-1 min-w-0 bg-transparent border-0 p-0 text-left cursor-pointer"
                                    title={
                                      isChildPlaced
                                        ? `Child field '${child.NAME}' is already placed`
                                        : `Drag or click to place '${child.NAME}'`
                                    }
                                  >
                                    {isChildPlaced ? (
                                      <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    ) : (
                                      <Plus className="size-2.5 text-primary shrink-0" />
                                    )}
                                    <span className="truncate font-medium">{child.LABEL}</span>
                                  </button>

                                  <div className="flex items-center gap-1 shrink-0 ml-1">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "text-[7px] h-3 px-1 font-mono uppercase",
                                        isChildPlaced &&
                                          "text-emerald-500 border-emerald-500/40 bg-emerald-500/5",
                                      )}
                                    >
                                      {isChildPlaced ? "PLACED" : child.TYPE}
                                    </Badge>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
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

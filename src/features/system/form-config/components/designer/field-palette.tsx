import {
  Boxes,
  ChevronDown,
  ChevronRight,
  Database,
  Layers,
  LayoutList,
  Plus,
  Table2,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type { FormElement } from "@/lib/data-schemas/form-config-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface FieldPaletteProps {
  targetModel?: string;
  modelProperties?: ModelProperty[];
  usedFieldNames?: Set<string>;
  onHighlightField?: (fieldName: string) => void;
  onAddField: (template: Partial<FormElement>) => void;
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
  disabled?: boolean;
}

function modelPropToFormElement(prop: ModelProperty): FormElement {
  return {
    SN: prop.SN || "1",
    NAME: prop.NAME,
    LABEL: prop.LABEL || prop.NAME,
    TYPE: prop.TYPE || "Text",
    LENGTH: prop.LENGTH ?? 35,
    STRUCTURE: prop.STRUCTURE || "S",
    REQUIRED: Boolean(prop.REQUIRED),
    DISABLED: false,
    WIDTH: prop.WIDTH || "md",
    POSITION: "",
    PARAMETER: {
      type: "O",
      data: [],
      modelName: "",
      displayField: "",
      condition: "",
      reference: "",
    },
    ENRICHTEXT: "",
    DEFAULTVALUE: "",
  };
}

export function FieldPalette({
  targetModel,
  modelProperties: propsModelProperties,
  usedFieldNames = new Set(),
  onHighlightField,
  onAddField,
  onAddSection,
  disabled,
}: FieldPaletteProps) {
  const [fetchedProperties, setFetchedProperties] = React.useState<ModelProperty[]>([]);
  const modelProperties =
    propsModelProperties && propsModelProperties.length > 0
      ? propsModelProperties
      : fetchedProperties;
  const [loadingModel, setLoadingModel] = React.useState<boolean>(false);
  const [modelFilter, setModelFilter] = React.useState<"all" | "unplaced">("all");

  React.useEffect(() => {
    if ((propsModelProperties && propsModelProperties.length > 0) || !targetModel) {
      setFetchedProperties([]);
      return;
    }

    let isMounted = true;
    setLoadingModel(true);

    cbs
      .send<ModelConfigRecord>(cbs.modelConfig.get(targetModel))
      .then((res) => {
        if (isMounted && res.data?.PROPERTIES) {
          setFetchedProperties(res.data.PROPERTIES);
        }
      })
      .catch(() => {
        if (isMounted) setFetchedProperties([]);
      })
      .finally(() => {
        if (isMounted) setLoadingModel(false);
      });

    return () => {
      isMounted = false;
    };
  }, [targetModel, propsModelProperties]);

  const [activePaletteTab, setActivePaletteTab] = React.useState<"variables" | "containers">(
    "variables",
  );

  const placedCount = React.useMemo(() => {
    return modelProperties.filter((p) => usedFieldNames.has(p.NAME)).length;
  }, [modelProperties, usedFieldNames]);

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
      if ((p.TYPE as string) === "Object") {
        objectMap.set(p.SN, { parent: p, children: [] });
      }
    }

    for (const p of modelProperties) {
      if ((p.TYPE as string) !== "Object" && p.SN.includes("_")) {
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
      if ((p.TYPE as string) === "Object") {
        const grp = objectMap.get(p.SN);
        if (grp) {
          items.push({ kind: "object-group", parent: grp.parent, children: grp.children });
        }
      } else if (!childSet.has(p.NAME)) {
        items.push({ kind: "single", property: p });
      }
    }

    if (modelFilter === "unplaced") {
      return items.filter((item) => {
        if (item.kind === "single") {
          return !usedFieldNames.has(item.property.NAME);
        }
        return item.children.some((c) => !usedFieldNames.has(c.NAME));
      });
    }

    return items;
  }, [modelProperties, modelFilter, usedFieldNames]);

  const handleAddEntireObjectGroup = (parent: ModelProperty, children: ModelProperty[]) => {
    const initialFields: FormElement[] = children.map((child, idx) => ({
      ...modelPropToFormElement(child),
      SN: child.SN || `${parent.SN || "1"}_${idx + 1}`,
    }));

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
      parent.NAME,
      parent.STRUCTURE === "M" ? "M" : "S",
    );
  };

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
                {paletteItems.map((item) => {
                  if (item.kind === "single") {
                    const prop = item.property;
                    const isPlaced = usedFieldNames.has(prop.NAME);

                    return (
                      <button
                        key={prop.NAME}
                        type="button"
                        draggable={!disabled && !isPlaced}
                        onDragStart={(e) => {
                          if (disabled || isPlaced) {
                            e.preventDefault();
                            return;
                          }
                          const payload = {
                            type: "palette-variable",
                            element: modelPropToFormElement(prop),
                          };
                          e.dataTransfer.setData("application/json", JSON.stringify(payload));
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                        onClick={() => {
                          if (isPlaced) {
                            onHighlightField?.(prop.NAME);
                          } else {
                            onAddField(modelPropToFormElement(prop));
                          }
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-2 py-1.5 rounded border text-[11px] transition-all text-left cursor-pointer",
                          isPlaced
                            ? "bg-muted/20 border-emerald-500/30 text-muted-foreground cursor-default"
                            : "bg-background border-border/70 text-foreground hover:border-primary/50 shadow-2xs cursor-grab active:cursor-grabbing",
                        )}
                        title={
                          isPlaced
                            ? `Field '${prop.NAME}' is already on canvas. Click to inspect.`
                            : `Drag or click to add '${prop.NAME}' to canvas`
                        }
                      >
                        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0">
                          {isPlaced ? (
                            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                          ) : (
                            <Plus className="size-3 text-primary shrink-0" />
                          )}
                          <span className="truncate font-medium">{prop.LABEL}</span>
                        </div>

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
                      </button>
                    );
                  }

                  // Object Group Card
                  const parent = item.parent;
                  const children = item.children;
                  const isCollapsed = collapsedGroups[parent.SN] ?? false;
                  const allPlaced =
                    children.length > 0 && children.every((c) => usedFieldNames.has(c.NAME));
                  const placedChildrenCount = children.filter((c) =>
                    usedFieldNames.has(c.NAME),
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
                          <button
                            type="button"
                            draggable={!disabled && !allPlaced}
                            onDragStart={(e) => {
                              if (disabled || allPlaced) {
                                e.preventDefault();
                                return;
                              }
                              const initialFields: FormElement[] = children.map((child, idx) => ({
                                ...modelPropToFormElement(child),
                                SN: child.SN || `${parent.SN || "1"}_${idx + 1}`,
                              }));
                              const payload = {
                                type: "palette-container",
                                containerType: "object-group",
                                zone: "standard",
                                initialFields,
                                layoutStyle: "card",
                                title: parent.LABEL || parent.NAME,
                                bindKey: parent.NAME,
                                structure: parent.STRUCTURE === "M" ? "M" : "S",
                                columns: 1,
                              };
                              e.dataTransfer.setData("application/json", JSON.stringify(payload));
                              e.dataTransfer.effectAllowed = "copy";
                            }}
                            className={cn(
                              "border rounded text-[8px] h-3.5 px-1 font-mono uppercase transition-colors cursor-grab active:cursor-grabbing",
                              parent.STRUCTURE === "M"
                                ? "text-primary border-primary/40 bg-primary/10 hover:bg-primary/20"
                                : "text-primary border-primary/40 bg-primary/10 hover:bg-primary/20",
                            )}
                            title="Drag to place complete Object Group on Canvas or into any Tab"
                          >
                            {parent.STRUCTURE === "M" ? "OBJECT.M" : "OBJECT"}
                          </button>
                          <span className="text-[9px] font-mono text-muted-foreground">
                            ({placedChildrenCount}/{children.length})
                          </span>
                        </div>
                      </div>

                      {/* Add Entire Object Group Button */}
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
                            {children.map((child) => {
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
                                    e.dataTransfer.setData(
                                      "application/json",
                                      JSON.stringify(payload),
                                    );
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
                                        isChildPlaced &&
                                          "text-emerald-500 border-emerald-500/40 bg-emerald-500/5",
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
              className="w-full h-8 text-xs justify-start gap-2 bg-background hover:bg-muted/30 shadow-2xs cursor-grab active:cursor-grabbing"
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
        )}
      </div>
    </div>
  );
}

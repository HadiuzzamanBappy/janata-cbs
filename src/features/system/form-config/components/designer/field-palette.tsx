"use client";

import { Database, Layers, Search, X } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/core-utils";
import type { FormElement } from "@/lib/data-schemas";
import { findFieldDeep } from "../../hooks/fc-field-tree";
import { useOptionalDesignerContext } from "./context/designer-context";
import { PaletteContainersList } from "./palette/palette-containers-list";
import { PaletteObjectGroup } from "./palette/palette-object-group";
import type { FieldPaletteProps, PaletteItem, PaletteTypeFilter } from "./palette/palette-types";
import { PaletteVariableItem } from "./palette/palette-variable-item";
import { usePaletteVariables } from "./palette/use-palette-variables";

export function FieldPalette({
  targetModel: propsTargetModel,
  modelProperties: propsModelProperties,
  usedFieldNames: propsUsedFieldNames,
  onHighlightField: propsOnHighlightField,
  onAddField: propsOnAddField,
  onAddSection: propsOnAddSection,
  disabled: propsDisabled,
  className,
  onClose,
}: FieldPaletteProps) {
  const ctx = useOptionalDesignerContext();

  const targetModel = propsTargetModel ?? ctx?.targetModel;
  const modelProperties = propsModelProperties ?? ctx?.modelProperties;
  const usedFieldNames = propsUsedFieldNames ?? ctx?.usedFieldNames ?? new Set<string>();
  const onHighlightField = propsOnHighlightField ?? ctx?.handleHighlightField;
  const onAddField = propsOnAddField ?? ctx?.handlePaletteAddField;
  const onAddSection = propsOnAddSection ?? ctx?.onAddSection;
  const disabled = propsDisabled ?? ctx?.disabled ?? false;

  const handleSafeAddField = React.useCallback(
    (tpl: Partial<FormElement>) => {
      onAddField?.(tpl);
    },
    [onAddField],
  );

  const [activePaletteTab, setActivePaletteTab] = React.useState<"variables" | "containers">(
    "variables",
  );

  const {
    loadingModel,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    totalCount,
    placedCount,
    unplacedCount,
    paletteItems,
    collapsedGroups,
    toggleGroupCollapse,
  } = usePaletteVariables({
    targetModel,
    propsModelProperties: modelProperties,
    usedFieldNames,
    sections: ctx?.sections,
  });

  return (
    <div
      className={cn(
        "w-60 border-r border-border/70 bg-card/40 flex flex-col h-full select-none text-xs shrink-0 overflow-hidden",
        className,
      )}
    >
      <Tabs
        value={activePaletteTab}
        onValueChange={(v) => setActivePaletteTab(v as "variables" | "containers")}
        className="flex flex-col flex-1 min-h-0 gap-0"
      >
        {/* Compact Header with Tabs */}
        <div className="px-1.5 py-1 border-b border-border/60 bg-muted/20 flex items-center justify-between gap-1 shrink-0">
          <TabsList className="h-6.5 p-0.5 bg-muted/40 flex-1">
            <TabsTrigger
              value="variables"
              className="h-5.5 px-2 text-2xs gap-1 flex-1 data-[state=active]:bg-background data-[state=active]:shadow-xs"
            >
              <Database className="size-3 text-primary shrink-0" />
              <span className="truncate">Variables</span>
              {totalCount > 0 && (
                <span className="text-3xs font-mono opacity-70 shrink-0">
                  ({placedCount}/{totalCount})
                </span>
              )}
            </TabsTrigger>

            <TabsTrigger
              value="containers"
              className="h-5.5 px-2 text-2xs gap-1 flex-1 data-[state=active]:bg-background data-[state=active]:shadow-xs"
            >
              <Layers className="size-3 text-primary shrink-0" />
              <span className="truncate">Containers</span>
            </TabsTrigger>
          </TabsList>

          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-6 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
              title="Close Palette"
            >
              <X className="size-3" />
            </Button>
          )}
        </div>

        {/* TAB 1: VARIABLES */}
        <TabsContent
          value="variables"
          className="flex-1 flex flex-col min-h-0 m-0 p-0 border-0 outline-none"
        >
          {/* Search & Filter Row */}
          <div className="px-1.5 py-1 border-b border-border/60 bg-muted/10 flex items-center gap-1.5 shrink-0">
            <div className="relative flex-1 min-w-0">
              <Search className="size-3 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="h-7 pl-6.5 pr-5 text-2xs bg-background/80 border-border/60 w-full rounded-md shadow-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                  title="Clear search"
                >
                  <X className="size-2.5" />
                </button>
              )}
            </div>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as PaletteTypeFilter)}>
              <SelectTrigger
                size="sm"
                className="h-7 w-23 text-3xs py-0 px-2 shrink-0 bg-background/80 border-border/60 font-medium shadow-none rounded-md [&_svg]:size-3 cursor-pointer"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="text-xs min-w-32">
                <SelectItem value="all" className="text-xs cursor-pointer">
                  All ({totalCount})
                </SelectItem>
                <SelectItem value="placed" className="text-xs cursor-pointer">
                  Placed ({placedCount})
                </SelectItem>
                <SelectItem value="unplaced" className="text-xs cursor-pointer">
                  Not Placed ({unplacedCount})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Variables List View */}
          <div className="flex-1 overflow-y-auto p-2">
            {loadingModel ? (
              <div className="text-3xs text-muted-foreground italic px-2 py-4 text-center font-mono">
                Loading schema variables...
              </div>
            ) : paletteItems.length > 0 ? (
              <div className="space-y-1">
                {paletteItems.map((item: PaletteItem) => {
                  if (item.kind === "single") {
                    const isSelected =
                      ctx?.selectedFieldId === item.property.NAME ||
                      ctx?.selectedFieldId === item.property.SN;
                    return (
                      <PaletteVariableItem
                        key={item.property.NAME}
                        property={item.property}
                        isPlaced={usedFieldNames.has(item.property.NAME)}
                        isSelected={isSelected}
                        disabled={disabled}
                        onAddField={handleSafeAddField}
                        onHighlightField={onHighlightField}
                      />
                    );
                  }

                  const isGroupSelected =
                    ctx?.selectedFieldId === item.parent.NAME ||
                    ctx?.selectedFieldId === item.parent.SN;

                  return (
                    <PaletteObjectGroup
                      key={item.parent.SN}
                      parent={item.parent}
                      childProperties={item.children}
                      isCollapsed={collapsedGroups[item.parent.SN] ?? false}
                      usedFieldNames={usedFieldNames}
                      isSelected={isGroupSelected}
                      disabled={disabled}
                      onToggleCollapse={toggleGroupCollapse}
                      onAddField={handleSafeAddField}
                      onHighlightField={onHighlightField}
                      placedObject={
                        ctx
                          ? findFieldDeep(ctx.sections, item.parent.SN || item.parent.NAME)?.field
                          : undefined
                      }
                      onUpdatePlacedObject={ctx?.onUpdateField}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="text-3xs text-muted-foreground/60 italic px-2 py-6 text-center">
                {searchQuery
                  ? `No variables matching "${searchQuery}"`
                  : typeFilter === "unplaced"
                    ? "✓ All model variables placed on canvas!"
                    : "No variables found for this model"}
              </div>
            )}
          </div>
        </TabsContent>

        {/* TAB 2: CONTAINERS */}
        <TabsContent
          value="containers"
          className="flex-1 overflow-y-auto m-0 p-0 border-0 outline-none"
        >
          {onAddSection && (
            <PaletteContainersList disabled={disabled} onAddSection={onAddSection} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export type { FieldPaletteProps };

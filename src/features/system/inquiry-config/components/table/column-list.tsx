"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CheckCircle2, Columns, Plus, Search } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/core-utils";
import type { InquiryColumnConfig } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { SortableColumnItem } from "./column-item";

export interface ColumnListProps {
  columns: InquiryColumnConfig[];
  columnKeys: string[];
  selectedColIdx: number;
  targetModel?: string;
  disabled?: boolean;
  availableProps: ModelProperty[];
  configuredColIds: Set<string>;
  sensors: SensorDescriptor<SensorOptions>[];
  onSelectColumn: (index: number) => void;
  onAddFromModel: (prop: ModelProperty) => void;
  onAddCustomColumn: () => void;
  onRemoveColumn: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function ColumnList({
  columns,
  columnKeys,
  selectedColIdx,
  targetModel = "ACCOUNT",
  disabled = false,
  availableProps,
  configuredColIds,
  sensors,
  onSelectColumn,
  onAddFromModel,
  onAddCustomColumn,
  onRemoveColumn,
  onDragEnd,
}: ColumnListProps) {
  const [fieldSearch, setFieldSearch] = React.useState("");
  const [colLookupOpen, setColLookupOpen] = React.useState(false);

  const filteredProps = React.useMemo(() => {
    if (!fieldSearch.trim()) return availableProps;
    const q = fieldSearch.trim().toLowerCase();
    return availableProps.filter(
      (p) => p.NAME.toLowerCase().includes(q) || Boolean(p.LABEL?.toLowerCase().includes(q)),
    );
  }, [availableProps, fieldSearch]);

  return (
    <div className="w-72 sm:w-80 shrink-0 border-r border-border/70 flex flex-col min-h-0 bg-muted/10">
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <Columns className="size-3.5 text-primary shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">
            Columns ({columns.length})
          </span>
        </div>

        {!disabled && (
          <div className="flex items-center gap-1">
            <Popover open={colLookupOpen} onOpenChange={setColLookupOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs gap-1 rounded bg-background border-border/80 cursor-pointer"
                    disabled={availableProps.length === 0}
                    title={`Search & add fields from ${targetModel}`}
                  >
                    <Plus className="size-3 text-primary" />
                    <span>Add Field</span>
                  </Button>
                }
              />
              <PopoverContent className="w-72 p-0 gap-0 overflow-hidden shadow-md" align="start">
                <div className="p-2 space-y-1.5 border-b border-border/60 bg-muted/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                      Model: {targetModel}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onAddCustomColumn();
                        setColLookupOpen(false);
                        setFieldSearch("");
                      }}
                      className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 hover:bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                      title="Add custom column"
                    >
                      <Plus className="size-2.5" />
                      <span>Custom</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Search className="size-3 text-muted-foreground absolute left-2 top-2" />
                    <Input
                      placeholder="Search model field..."
                      value={fieldSearch}
                      onChange={(e) => setFieldSearch(e.target.value)}
                      className="h-7 text-xs pl-7 bg-background font-mono"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                  {filteredProps.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground font-mono">
                      No matching fields
                    </div>
                  ) : (
                    filteredProps.map((prop) => {
                      const isAdded = configuredColIds.has(prop.NAME.toLowerCase());
                      return (
                        <button
                          key={prop.NAME}
                          type="button"
                          disabled={isAdded}
                          onClick={() => {
                            onAddFromModel(prop);
                            setColLookupOpen(false);
                            setFieldSearch("");
                          }}
                          className={cn(
                            "w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors cursor-pointer group",
                            isAdded
                              ? "opacity-50 cursor-not-allowed bg-muted/20"
                              : "hover:bg-primary/10",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-mono text-xs font-medium block truncate group-hover:text-primary">
                              {prop.NAME}
                            </span>
                            {prop.LABEL && (
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {prop.LABEL}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <span className="text-[9px] font-mono uppercase px-1 py-0 bg-muted rounded text-muted-foreground">
                              {prop.TYPE}
                            </span>
                            {isAdded && <CheckCircle2 className="size-3 text-muted-foreground" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Scrollable Column Cards */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 min-h-0">
        {columns.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <Columns className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-medium">No table columns defined</p>
            <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-xs">
              Use &ldquo;+ Add Field&rdquo; to pick columns from {targetModel} or click &ldquo;+
              Custom&rdquo;.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={columnKeys} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {columns.map((col, index) => (
                  <SortableColumnItem
                    key={columnKeys[index]}
                    id={columnKeys[index]}
                    index={index}
                    col={col}
                    isSelected={index === selectedColIdx}
                    disabled={disabled}
                    onSelect={() => onSelectColumn(index)}
                    onRemove={() => onRemoveColumn(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

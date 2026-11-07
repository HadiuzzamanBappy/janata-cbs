"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Filter, Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useContainerWidth } from "@/hooks";
import { cn } from "@/lib/core-utils";
import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import type { InquiryValidationErrorItem } from "../hooks/ic-validation";
import { FilterInspector } from "./selection/filter-inspector";
import { FilterItem } from "./selection/filter-item";
import { FilterModelPopover } from "./selection/filter-model-popover";

export interface IcSelectionTabProps {
  filters: INQSelectField[];
  targetModel?: string;
  onAddFilter: (filter?: Partial<INQSelectField>) => void;
  onUpdateFilter: (index: number, patch: Partial<INQSelectField>) => void;
  onRemoveFilter: (index: number) => void;
  onReorderFilters: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
}

export function IcSelectionTab({
  filters,
  targetModel,
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onReorderFilters,
  disabled = false,
  validationErrors = [],
}: IcSelectionTabProps) {
  const { ref: containerRef, isCompact } = useContainerWidth<HTMLDivElement>(860);
  const [selectedIdx, setSelectedIdx] = React.useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleSelectFilter = (idx: number) => {
    setSelectedIdx(idx);
    if (isCompact) {
      setIsSidebarOpen(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const filterKeys = React.useMemo(
    () => filters.map((f) => `filter-${f.selectFieldName}`),
    [filters],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = filterKeys.indexOf(String(active.id));
    const toIndex = filterKeys.indexOf(String(over.id));

    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderFilters(fromIndex, toIndex);
      if (selectedIdx === fromIndex) {
        setSelectedIdx(toIndex);
      } else if (selectedIdx > fromIndex && selectedIdx <= toIndex) {
        setSelectedIdx(selectedIdx - 1);
      } else if (selectedIdx < fromIndex && selectedIdx >= toIndex) {
        setSelectedIdx(selectedIdx + 1);
      }
    }
  };

  // Keep selectedIdx in bounds
  React.useEffect(() => {
    if (filters.length === 0) {
      setSelectedIdx(0);
    } else if (selectedIdx >= filters.length) {
      setSelectedIdx(filters.length - 1);
    }
  }, [filters.length, selectedIdx]);

  const activeFilter = filters[selectedIdx] || null;

  const configuredFieldNames = React.useMemo(
    () => new Set(filters.map((f) => f.selectFieldName.toLowerCase())),
    [filters],
  );

  const handleImportProperty = (prop: ModelProperty) => {
    const typeUpper = (prop.TYPE || "CHAR").toUpperCase();
    let selectFieldType = "text";
    let defaultOperand = "EQ";

    if (typeUpper === "AMOUNT" || typeUpper === "INTEGER" || typeUpper === "NUMBER") {
      selectFieldType = "number";
    } else if (typeUpper === "DATE") {
      selectFieldType = "date";
    } else {
      defaultOperand = "LK";
    }

    onAddFilter({
      selectFieldName: prop.NAME,
      selectFieldDisplay: prop.LABEL || prop.NAME,
      selectFieldType,
      selectFieldOperator: defaultOperand,
      selectFieldValue: "",
      selectFieldRequired: false,
      selectFieldOperatorFixed: "",
    });
    setSelectedIdx(filters.length);
    if (isCompact) {
      setIsSidebarOpen(false);
    }
  };

  const handleAddCustomFilter = () => {
    onAddFilter({
      selectFieldName: `field_${filters.length + 1}`,
      selectFieldDisplay: `Filter ${filters.length + 1}`,
      selectFieldType: "text",
      selectFieldOperator: "EQ",
      selectFieldValue: "",
      selectFieldRequired: false,
      selectFieldOperatorFixed: "",
    });
    setSelectedIdx(filters.length);
    if (isCompact) {
      setIsSidebarOpen(false);
    }
  };

  const renderFilterPanel = () => (
    <div className="w-full h-full flex flex-col min-h-0 bg-card overflow-hidden">
      {/* Header with Title + Lookup Popover */}
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            Criteria ({filters.length})
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <FilterModelPopover
            targetModel={targetModel}
            configuredFieldNames={configuredFieldNames}
            onImportField={handleImportProperty}
            disabled={disabled}
          />

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddCustomFilter}
            disabled={disabled}
            className="h-7 text-xs px-2 sm:px-2.5 gap-1 rounded cursor-pointer"
            title="Add a custom selection criterion"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </div>

      {/* Scrollable Criteria Items */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {filters.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <Filter className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-medium">No Criteria Defined</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-50">
              Import properties from {targetModel || "the model"} or add a custom filter.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={filterKeys} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border/30">
                {filters.map((filter, index) => {
                  const filterErrors = validationErrors.filter(
                    (err) => err.tab === "selection" && err.itemIndex === index,
                  );
                  return (
                    <FilterItem
                      key={filterKeys[index]}
                      index={index}
                      field={filter}
                      isSelected={index === selectedIdx}
                      disabled={disabled}
                      hasError={filterErrors.length > 0}
                      errorCount={filterErrors.length}
                      onSelect={() => handleSelectFilter(index)}
                      onRemove={() => onRemoveFilter(index)}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full rounded border border-border/80 bg-card/60 flex overflow-hidden shadow-2xs min-h-0 select-none"
    >
      {/* 1. Left Panel / Offcanvas Drawer */}
      {isCompact ? (
        <>
          {/* Backdrop */}
          {isSidebarOpen && (
            <div
              className="absolute inset-0 bg-black/40 z-20 backdrop-blur-xs transition-opacity"
              onClick={() => setIsSidebarOpen(false)}
              aria-hidden="true"
            />
          )}
          {/* Offcanvas Drawer */}
          <div
            className={cn(
              "absolute inset-y-0 left-0 z-30 w-72 sm:w-80 shadow-2xl transition-transform duration-200 ease-in-out border-r border-border rounded-r overflow-hidden",
              isSidebarOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
            )}
          >
            {renderFilterPanel()}
          </div>
        </>
      ) : (
        <div className="w-72 sm:w-80 shrink-0 border-r border-border/70 flex flex-col min-h-0 bg-muted/10">
          {renderFilterPanel()}
        </div>
      )}

      {/* 2. Right Panel: Criteria Details Inspector (Expands to Full Width) */}
      <div className="flex-1 flex flex-col min-h-0 bg-background/50">
        {activeFilter ? (
          <FilterInspector
            field={activeFilter}
            selectedIdx={selectedIdx}
            disabled={disabled}
            validationErrors={validationErrors}
            onUpdate={(patch) => onUpdateFilter(selectedIdx, patch)}
            onRemove={() => onRemoveFilter(selectedIdx)}
            onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
            isSidebarOpen={isSidebarOpen}
            showSidebarToggle={isCompact}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
            <Filter className="size-7 text-muted-foreground/35 mb-2" />
            <p className="text-xs text-muted-foreground/80">
              Select a criterion on the left to inspect or edit details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

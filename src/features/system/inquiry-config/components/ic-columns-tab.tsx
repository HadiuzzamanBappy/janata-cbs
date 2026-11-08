"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { useContainerWidth } from "@/hooks";
import { cn } from "@/lib/core-utils";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import type { InquiryValidationErrorItem } from "../hooks/ic-validation";
import { ColumnInspector } from "./columns/column-inspector";
import { ColumnModelPopover } from "./columns/column-model-popover";
import { ColumnsPanel } from "./columns/columns-panel";

export interface IcColumnsTabProps {
  columns: INQDef[];
  targetModel?: string;
  onAddColumn: (col?: Partial<INQDef>) => void;
  onUpdateColumn: (index: number, patch: Partial<INQDef>) => void;
  onRemoveColumn: (index: number) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
}

export function IcColumnsTab({
  columns,
  targetModel,
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  onReorderColumns,
  disabled = false,
  validationErrors = [],
}: IcColumnsTabProps) {
  const { ref: containerRef, isCompact } = useContainerWidth<HTMLDivElement>(860);
  const [selectedColIdx, setSelectedColIdx] = React.useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleSelectColumn = (idx: number) => {
    setSelectedColIdx(idx);
    if (isCompact) {
      setIsSidebarOpen(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  React.useEffect(() => {
    if (columns.length === 0) {
      setSelectedColIdx(0);
    } else if (selectedColIdx >= columns.length) {
      setSelectedColIdx(columns.length - 1);
    }
  }, [columns.length, selectedColIdx]);

  const columnKeys = React.useMemo(
    () => columns.map((c, i) => `col-${c.fieldName || i}-${i}`),
    [columns],
  );

  const configuredFieldNames = React.useMemo(
    () => new Set(columns.map((c) => c.fieldName.toLowerCase())),
    [columns],
  );

  const columnsErrors = React.useMemo(
    () => validationErrors.filter((e) => e.tab === "columns"),
    [validationErrors],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = columnKeys.indexOf(String(active.id));
    const toIndex = columnKeys.indexOf(String(over.id));

    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderColumns(fromIndex, toIndex);
      if (selectedColIdx === fromIndex) {
        setSelectedColIdx(toIndex);
      } else if (selectedColIdx > fromIndex && selectedColIdx <= toIndex) {
        setSelectedColIdx(selectedColIdx - 1);
      } else if (selectedColIdx < fromIndex && selectedColIdx >= toIndex) {
        setSelectedColIdx(selectedColIdx + 1);
      }
    }
  };

  const handleImportProperty = (prop: ModelProperty) => {
    const typeUpper = (prop.TYPE || "CHAR").toUpperCase();
    const alignment =
      typeUpper === "AMOUNT" || typeUpper === "INTEGER" || typeUpper === "NUMBER"
        ? "R"
        : typeUpper === "DATE" || typeUpper === "DATETIME"
          ? "C"
          : "L";

    const rawLen = typeof prop.LENGTH === "string" ? Number.parseInt(prop.LENGTH, 10) : prop.LENGTH;
    const defaultLength = Math.min(Math.max(rawLen || 20, 10), 100);

    onAddColumn({
      fieldName: prop.NAME,
      fieldDisplay: prop.LABEL || prop.NAME,
      fieldType: "DC",
      fieldLength: `${defaultLength},${alignment}`,
      fieldRowCol: "1,1",
      dataPassable: true,
    });
    setSelectedColIdx(columns.length);
    if (isCompact) {
      setIsSidebarOpen(false);
    }
  };

  const activeCol = columns[selectedColIdx] || null;

  const renderColumnsPanel = () => (
    <div className="w-full h-full flex flex-col min-h-0 bg-card overflow-hidden">
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            Columns ({columns.length})
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <ColumnModelPopover
            targetModel={targetModel}
            disabled={disabled}
            configuredFieldNames={configuredFieldNames}
            onImportProperty={handleImportProperty}
          />
          {!disabled && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => {
                onAddColumn();
                setSelectedColIdx(columns.length);
                if (isCompact) {
                  setIsSidebarOpen(false);
                }
              }}
              className="h-7 text-xs px-2 sm:px-2.5 gap-1 rounded cursor-pointer"
              title="Add a custom column"
            >
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          )}
        </div>
      </div>

      <ColumnsPanel
        columns={columns}
        selectedColIdx={selectedColIdx}
        onSelectColumn={handleSelectColumn}
        onRemoveColumn={onRemoveColumn}
        disabled={disabled}
        validationErrors={columnsErrors}
        sensors={sensors}
        columnKeys={columnKeys}
        onDragEnd={handleDragEnd}
      />
    </div>
  );

  return (
    <div ref={containerRef} className="relative h-full flex min-h-0 overflow-hidden pr-1 gap-2">
      {/* 1. Left Columns List: Side Panel on Desktop, Offcanvas Drawer on Mobile/Compact */}
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
            {renderColumnsPanel()}
          </div>
        </>
      ) : (
        <div className="w-80 shrink-0 flex flex-col min-h-0 rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden">
          {renderColumnsPanel()}
        </div>
      )}

      {/* 2. Right Column Inspector */}
      <div className="flex-1 flex flex-col min-h-0 rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden">
        <ColumnInspector
          activeCol={activeCol || undefined}
          selectedColIdx={selectedColIdx}
          disabled={disabled}
          validationErrors={columnsErrors}
          onUpdateColumn={onUpdateColumn}
          onRemoveColumn={onRemoveColumn}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          showSidebarToggle={isCompact}
        />
      </div>
    </div>
  );
}

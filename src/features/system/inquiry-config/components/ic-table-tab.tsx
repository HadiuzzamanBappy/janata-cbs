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
import { Columns, MousePointerClick, Plus } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { INQCmd, INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelProperty } from "@/lib/data-schemas/model-config-schema";
import type { InquiryValidationErrorItem } from "../hooks/ic-validation";
import { ActionInspector } from "./table/action-inspector";
import { ActionItem } from "./table/action-item";
import { ColumnInspector } from "./table/column-inspector";
import { ColumnItem } from "./table/column-item";
import { ColumnModelPopover } from "./table/column-model-popover";
import { inferInqDefFromModelProperty } from "./table/table-constants";

export interface IcTableTabProps {
  columns: INQDef[];
  actions: INQCmd[];
  targetModel?: string;
  onAddColumn: (col?: Partial<INQDef>) => void;
  onUpdateColumn: (index: number, patch: Partial<INQDef>) => void;
  onRemoveColumn: (index: number) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  onAddAction: (action?: Partial<INQCmd>) => void;
  onUpdateAction: (index: number, patch: Partial<INQCmd>) => void;
  onRemoveAction: (index: number) => void;
  onReorderActions: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
}

export function IcTableTab({
  columns = [],
  actions = [],
  targetModel = "ACCOUNT",
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  onReorderColumns,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
  onReorderActions,
  disabled = false,
  validationErrors = [],
}: IcTableTabProps) {
  const [activeSegment, setActiveSegment] = React.useState<"columns" | "actions">("columns");
  const [selectedColIdx, setSelectedColIdx] = React.useState<number>(0);
  const [selectedActionIdx, setSelectedActionIdx] = React.useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Keep selection indices within bounds
  React.useEffect(() => {
    if (columns.length === 0) {
      setSelectedColIdx(0);
    } else if (selectedColIdx >= columns.length) {
      setSelectedColIdx(columns.length - 1);
    }
  }, [columns.length, selectedColIdx]);

  React.useEffect(() => {
    if (actions.length === 0) {
      setSelectedActionIdx(0);
    } else if (selectedActionIdx >= actions.length) {
      setSelectedActionIdx(actions.length - 1);
    }
  }, [actions.length, selectedActionIdx]);

  const columnKeys = React.useMemo(() => columns.map((c) => `col-${c.fieldName}`), [columns]);

  const actionKeys = React.useMemo(
    () => actions.map((a) => `action-${a.cmdButton}-${a.cmdFor}`),
    [actions],
  );

  const configuredFieldNames = React.useMemo(
    () => new Set(columns.map((c) => c.fieldName.toLowerCase())),
    [columns],
  );

  const columnsErrors = React.useMemo(
    () => validationErrors.filter((e) => e.tab === "table" && e.subSegment !== "actions"),
    [validationErrors],
  );

  const actionsErrors = React.useMemo(
    () => validationErrors.filter((e) => e.tab === "table" && e.subSegment === "actions"),
    [validationErrors],
  );

  const handleDragEndColumns = (event: DragEndEvent) => {
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

  const handleDragEndActions = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = actionKeys.indexOf(String(active.id));
    const toIndex = actionKeys.indexOf(String(over.id));

    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderActions(fromIndex, toIndex);
      if (selectedActionIdx === fromIndex) {
        setSelectedActionIdx(toIndex);
      } else if (selectedActionIdx > fromIndex && selectedActionIdx <= toIndex) {
        setSelectedActionIdx(selectedActionIdx - 1);
      } else if (selectedActionIdx < fromIndex && selectedActionIdx >= toIndex) {
        setSelectedActionIdx(selectedActionIdx + 1);
      }
    }
  };

  const handleImportProperty = (prop: ModelProperty) => {
    const newCol = inferInqDefFromModelProperty(prop, columns.length + 1);
    onAddColumn(newCol);
    setSelectedColIdx(columns.length);
  };

  const handleAddCustomColumn = () => {
    onAddColumn({
      fieldName: `column_${columns.length + 1}`,
      fieldDisplay: `Column ${columns.length + 1}`,
      fieldType: "CH",
      fieldFunc: "",
      fieldRowCol: `1,${columns.length + 1}`,
      fieldLength: "20,L",
      dataPassable: null,
    });
    setSelectedColIdx(columns.length);
  };

  const handleAddCustomAction = () => {
    onAddAction({
      cmdButton: "View",
      cmdFor: `${targetModel || "ACCOUNT"},1.0.0 S recordId`,
    });
    setSelectedActionIdx(actions.length);
  };

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden select-none">
      {/* 1. Header Segment Switcher & Add Actions */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2 px-0.5 shrink-0">
        <div className="flex items-center gap-1.5 p-0.5 bg-muted/40 rounded border border-border/60">
          <button
            type="button"
            onClick={() => setActiveSegment("columns")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer",
              activeSegment === "columns"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Columns className="size-3.5" />
            <span>Columns</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-mono">
              {columns.length}
            </Badge>
            {columnsErrors.length > 0 && (
              <Badge variant="destructive" className="text-[9px] h-3.5 px-1 font-mono rounded">
                {columnsErrors.length}
              </Badge>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment("actions")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer",
              activeSegment === "actions"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MousePointerClick className="size-3.5" />
            <span>Actions</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-mono">
              {actions.length}
            </Badge>
            {actionsErrors.length > 0 && (
              <Badge variant="destructive" className="text-[9px] h-3.5 px-1 font-mono rounded">
                {actionsErrors.length}
              </Badge>
            )}
          </button>
        </div>

        {activeSegment === "columns" && !disabled && (
          <div className="flex items-center gap-1.5">
            <ColumnModelPopover
              targetModel={targetModel}
              configuredFieldNames={configuredFieldNames}
              onImportProperty={handleImportProperty}
              disabled={disabled}
            />

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleAddCustomColumn}
              className="h-7 text-xs px-2 gap-1 rounded"
              title="Add a custom column"
            >
              <Plus className="size-3" />
              <span>Add Column</span>
            </Button>
          </div>
        )}

        {activeSegment === "actions" && !disabled && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleAddCustomAction}
            className="h-7 text-xs px-2 gap-1 rounded"
            title="Add a command action button"
          >
            <Plus className="size-3" />
            <span>Add Action</span>
          </Button>
        )}
      </div>

      {/* 2. Main Studio: Master-Detail Panels */}
      <div className="flex-1 w-full rounded border border-border/80 bg-card/60 flex overflow-hidden shadow-2xs min-h-0">
        {activeSegment === "columns" ? (
          <>
            {/* Left Panel: Columns Navigator */}
            <div className="w-72 sm:w-80 shrink-0 border-r border-border/70 flex flex-col min-h-0 bg-muted/10">
              <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Columns className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    Columns ({columns.length})
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {columns.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <Columns className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-medium">No Columns Defined</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-50">
                      Import properties from {targetModel || "the model"} or add a custom column.
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndColumns}
                  >
                    <SortableContext items={columnKeys} strategy={verticalListSortingStrategy}>
                      <div className="divide-y divide-border/30">
                        {columns.map((col, idx) => {
                          const colErrors = validationErrors.filter(
                            (e) =>
                              e.tab === "table" &&
                              e.itemIndex === idx &&
                              e.subSegment !== "actions",
                          );
                          return (
                            <ColumnItem
                              key={columnKeys[idx]}
                              col={col}
                              index={idx}
                              isSelected={selectedColIdx === idx}
                              disabled={disabled}
                              hasError={colErrors.length > 0}
                              errorCount={colErrors.length}
                              onSelect={() => setSelectedColIdx(idx)}
                              onRemove={() => onRemoveColumn(idx)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            {/* Right Panel: Column Inspector */}
            <ColumnInspector
              activeCol={columns[selectedColIdx]}
              selectedColIdx={selectedColIdx}
              disabled={disabled}
              validationErrors={validationErrors}
              onUpdateColumn={onUpdateColumn}
              onRemoveColumn={onRemoveColumn}
            />
          </>
        ) : (
          <>
            {/* Left Panel: Actions Navigator */}
            <div className="w-72 sm:w-80 shrink-0 border-r border-border/70 flex flex-col min-h-0 bg-muted/10">
              <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
                <div className="flex items-center gap-1.5 min-w-0">
                  <MousePointerClick className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    Actions ({actions.length})
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {actions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                    <MousePointerClick className="size-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs font-medium">No Actions Defined</p>
                    <p className="text-[11px] text-muted-foreground/70 mt-1 max-w-50">
                      Add row command buttons (e.g. View, Edit, Auth).
                    </p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEndActions}
                  >
                    <SortableContext items={actionKeys} strategy={verticalListSortingStrategy}>
                      <div className="divide-y divide-border/30">
                        {actions.map((action, idx) => {
                          const actErrors = validationErrors.filter(
                            (e) =>
                              e.tab === "table" &&
                              e.itemIndex === idx &&
                              e.subSegment === "actions",
                          );
                          return (
                            <ActionItem
                              key={actionKeys[idx]}
                              action={action}
                              index={idx}
                              isSelected={selectedActionIdx === idx}
                              disabled={disabled}
                              hasError={actErrors.length > 0}
                              errorCount={actErrors.length}
                              onSelect={() => setSelectedActionIdx(idx)}
                              onRemove={() => onRemoveAction(idx)}
                            />
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </div>

            {/* Right Panel: Action Inspector */}
            <ActionInspector
              activeAction={actions[selectedActionIdx]}
              selectedActionIdx={selectedActionIdx}
              disabled={disabled}
              validationErrors={validationErrors}
              onUpdateAction={onUpdateAction}
              onRemoveAction={onRemoveAction}
            />
          </>
        )}
      </div>
    </div>
  );
}

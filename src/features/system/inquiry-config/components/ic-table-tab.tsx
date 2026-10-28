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
import { Columns, MousePointerClick, Plus, Sparkles } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type { INQCmd, INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";
import { ActionInspector } from "./table/action-inspector";
import { ActionItem } from "./table/action-item";
import { ColumnInspector } from "./table/column-inspector";
import { ColumnItem } from "./table/column-item";
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
}: IcTableTabProps) {
  const [activeSegment, setActiveSegment] = React.useState<"columns" | "actions">("columns");
  const [selectedColIdx, setSelectedColIdx] = React.useState<number>(0);
  const [selectedActionIdx, setSelectedActionIdx] = React.useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEndColumns = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = columns.findIndex((c, i) => `col-${c.fieldName}-${i}` === active.id);
      const to = columns.findIndex((c, i) => `col-${c.fieldName}-${i}` === over.id);
      if (from !== -1 && to !== -1) {
        onReorderColumns(from, to);
        setSelectedColIdx(to);
      }
    }
  };

  const handleDragEndActions = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = actions.findIndex((a, i) => `action-${a.cmdButton}-${i}` === active.id);
      const to = actions.findIndex((a, i) => `action-${a.cmdButton}-${i}` === over.id);
      if (from !== -1 && to !== -1) {
        onReorderActions(from, to);
        setSelectedActionIdx(to);
      }
    }
  };

  // Import fields directly from Model table
  const handleImportFromModel = React.useCallback(async () => {
    if (!targetModel) return;
    try {
      const res = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(targetModel), {
        silent: true,
      });
      if (res.status === "SUCCESS" && res.data?.PROPERTIES) {
        res.data.PROPERTIES.forEach((prop, idx) => {
          const exists = columns.some((c) => c.fieldName === prop.NAME);
          if (!exists) {
            const inferred = inferInqDefFromModelProperty(prop, columns.length + idx + 1);
            onAddColumn(inferred);
          }
        });
      }
    } catch {
      // Ignore background import errors
    }
  }, [targetModel, columns, onAddColumn]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-card rounded-b-lg border-t-0">
      {/* Sub-header Navigation */}
      <div className="flex items-center justify-between px-3 h-10 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-1.5 p-0.5 bg-muted/60 rounded-md border border-border/50">
          <button
            type="button"
            onClick={() => setActiveSegment("columns")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all",
              activeSegment === "columns"
                ? "bg-background text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Columns className="size-3.5" />
            <span>Columns (INQDef)</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-mono">
              {columns.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment("actions")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all",
              activeSegment === "actions"
                ? "bg-background text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MousePointerClick className="size-3.5" />
            <span>Actions (INQCmds)</span>
            <Badge variant="secondary" className="text-[10px] h-4 px-1 font-mono">
              {actions.length}
            </Badge>
          </button>
        </div>

        {activeSegment === "columns" && !disabled && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportFromModel}
              className="h-7 text-xs gap-1.5"
            >
              <Sparkles className="size-3 text-primary" />
              <span>Import Model Fields</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onAddColumn()}
              className="h-7 text-xs gap-1"
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
            onClick={() => onAddAction()}
            className="h-7 text-xs gap-1"
          >
            <Plus className="size-3" />
            <span>Add Action</span>
          </Button>
        )}
      </div>

      {/* Master-Detail Layout */}
      <div className="flex-1 flex min-h-0 divide-x divide-border">
        {activeSegment === "columns" ? (
          <>
            <div className="w-72 flex flex-col min-h-0 bg-muted/10 p-2 overflow-y-auto space-y-1.5 shrink-0">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndColumns}>
                <SortableContext
                  items={columns.map((c, i) => `col-${c.fieldName}-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {columns.map((col, idx) => (
                    <ColumnItem
                      key={`col-${col.fieldName}-${idx}`}
                      col={col}
                      index={idx}
                      isSelected={selectedColIdx === idx}
                      disabled={disabled}
                      onSelect={() => setSelectedColIdx(idx)}
                      onRemove={() => onRemoveColumn(idx)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <ColumnInspector
              activeCol={columns[selectedColIdx]}
              selectedColIdx={selectedColIdx}
              disabled={disabled}
              onUpdateColumn={onUpdateColumn}
              onRemoveColumn={onRemoveColumn}
            />
          </>
        ) : (
          <>
            <div className="w-72 flex flex-col min-h-0 bg-muted/10 p-2 overflow-y-auto space-y-1.5 shrink-0">
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndActions}>
                <SortableContext
                  items={actions.map((a, i) => `action-${a.cmdButton}-${i}`)}
                  strategy={verticalListSortingStrategy}
                >
                  {actions.map((action, idx) => (
                    <ActionItem
                      key={`action-${action.cmdButton}-${idx}`}
                      action={action}
                      index={idx}
                      isSelected={selectedActionIdx === idx}
                      disabled={disabled}
                      onSelect={() => setSelectedActionIdx(idx)}
                      onRemove={() => onRemoveAction(idx)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
            <ActionInspector
              activeAction={actions[selectedActionIdx]}
              selectedActionIdx={selectedActionIdx}
              disabled={disabled}
              onUpdateAction={onUpdateAction}
              onRemoveAction={onRemoveAction}
            />
          </>
        )}
      </div>
    </div>
  );
}

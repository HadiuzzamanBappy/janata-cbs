import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Columns } from "lucide-react";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";
import { ColumnItem } from "./column-item";

export interface TableColumnsPanelProps {
  columns: INQDef[];
  columnKeys: string[];
  selectedColIdx: number;
  disabled?: boolean;
  targetModel?: string;
  sensors: SensorDescriptor<SensorOptions>[];
  validationErrors?: InquiryValidationErrorItem[];
  onSelectColumn: (index: number) => void;
  onRemoveColumn: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function TableColumnsPanel({
  columns,
  columnKeys,
  selectedColIdx,
  disabled,
  targetModel,
  sensors,
  validationErrors = [],
  onSelectColumn,
  onRemoveColumn,
  onDragEnd,
}: TableColumnsPanelProps) {
  return (
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={columnKeys} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border/30">
                {columns.map((col, idx) => {
                  const colErrors = validationErrors.filter(
                    (e) => e.tab === "table" && e.itemIndex === idx && e.subSegment !== "actions",
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
                      onSelect={() => onSelectColumn(idx)}
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
  );
}

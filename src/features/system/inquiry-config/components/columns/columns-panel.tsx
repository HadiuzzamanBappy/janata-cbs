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

export interface ColumnsPanelProps {
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

export function ColumnsPanel({
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
}: ColumnsPanelProps) {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
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
                    (e) => e.tab === "columns" && e.itemIndex === idx,
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

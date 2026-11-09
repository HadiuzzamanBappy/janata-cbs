import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Filter } from "lucide-react";
import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";
import { DesignerEmptyList } from "../shared/designer-empty-list";
import { FilterItem } from "./filter-item";

export interface SelectionPanelProps {
  filters: INQSelectField[];
  filterKeys: string[];
  selectedIdx: number;
  disabled?: boolean;
  targetModel?: string;
  sensors: SensorDescriptor<SensorOptions>[];
  validationErrors?: InquiryValidationErrorItem[];
  onSelectFilter: (index: number) => void;
  onRemoveFilter: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function SelectionPanel({
  filters,
  filterKeys,
  selectedIdx,
  disabled,
  targetModel,
  sensors,
  validationErrors = [],
  onSelectFilter,
  onRemoveFilter,
  onDragEnd,
}: SelectionPanelProps) {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0">
        {filters.length === 0 ? (
          <DesignerEmptyList
            icon={Filter}
            title="No Criteria Defined"
            description={`Import properties from ${targetModel || "the model"} or add a custom filter.`}
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={filterKeys} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border/30">
                {filters.map((filter, index) => {
                  const filterErrors = validationErrors.filter(
                    (err) => err.tab === "selection" && err.itemIndex === index,
                  );
                  return (
                    <FilterItem
                      key={filterKeys[index]}
                      field={filter}
                      index={index}
                      isSelected={selectedIdx === index}
                      disabled={disabled}
                      hasError={filterErrors.length > 0}
                      errorCount={filterErrors.length}
                      onSelect={() => onSelectFilter(index)}
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
}

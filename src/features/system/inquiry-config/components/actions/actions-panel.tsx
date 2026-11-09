import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { MousePointerClick } from "lucide-react";
import type { INQCmd } from "@/lib/data-schemas/inquiry-config-schema";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";
import { DesignerEmptyList } from "../shared/designer-empty-list";
import { ActionItem } from "./action-item";

export interface ActionsPanelProps {
  actions: INQCmd[];
  actionKeys: string[];
  selectedActionIdx: number;
  disabled?: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  validationErrors?: InquiryValidationErrorItem[];
  onSelectAction: (index: number) => void;
  onRemoveAction: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function ActionsPanel({
  actions,
  actionKeys,
  selectedActionIdx,
  disabled,
  sensors,
  validationErrors = [],
  onSelectAction,
  onRemoveAction,
  onDragEnd,
}: ActionsPanelProps) {
  return (
    <div className="w-full flex-1 flex flex-col min-h-0">
      <div className="flex-1 overflow-y-auto min-h-0">
        {actions.length === 0 ? (
          <DesignerEmptyList
            icon={MousePointerClick}
            title="No Actions Defined"
            description="Add row command buttons (e.g. View, Edit, Auth)."
          />
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={actionKeys} strategy={verticalListSortingStrategy}>
              <div className="divide-y divide-border/30">
                {actions.map((action, idx) => {
                  const actErrors = validationErrors.filter(
                    (e) => e.tab === "actions" && e.itemIndex === idx,
                  );
                  return (
                    <ActionItem
                      key={actionKeys[idx]}
                      id={actionKeys[idx]}
                      action={action}
                      index={idx}
                      isSelected={selectedActionIdx === idx}
                      disabled={disabled}
                      hasError={actErrors.length > 0}
                      errorCount={actErrors.length}
                      onSelect={() => onSelectAction(idx)}
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
  );
}

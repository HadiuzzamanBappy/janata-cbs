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

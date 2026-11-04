"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import * as React from "react";
import type { INQCmd } from "@/lib/data-schemas/inquiry-config-schema";
import type { InquiryValidationErrorItem } from "../hooks/ic-validation";
import { ActionInspector } from "./actions/action-inspector";
import { ActionsPanel } from "./actions/actions-panel";

export interface IcActionsTabProps {
  actions: INQCmd[];
  targetModel?: string;
  onAddAction: (action?: Partial<INQCmd>) => void;
  onUpdateAction: (index: number, patch: Partial<INQCmd>) => void;
  onRemoveAction: (index: number) => void;
  onReorderActions: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
}

export function IcActionsTab({
  actions,
  targetModel,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
  onReorderActions,
  disabled = false,
  validationErrors = [],
}: IcActionsTabProps) {
  const [selectedActionIdx, setSelectedActionIdx] = React.useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  React.useEffect(() => {
    if (actions.length === 0) {
      setSelectedActionIdx(0);
    } else if (selectedActionIdx >= actions.length) {
      setSelectedActionIdx(actions.length - 1);
    }
  }, [actions.length, selectedActionIdx]);

  const actionKeys = React.useMemo(() => actions.map((_, i) => `action-${i}`), [actions]);

  const actionsErrors = React.useMemo(
    () => validationErrors.filter((e) => e.tab === "actions"),
    [validationErrors],
  );

  const handleDragEnd = (event: DragEndEvent) => {
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

  const activeAction = actions[selectedActionIdx] || null;

  return (
    <div className="h-full flex min-h-0 overflow-hidden pr-1 gap-2">
      <div className="w-80 shrink-0 flex flex-col min-h-0 rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden">
        <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
              Actions ({actions.length})
            </span>
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={() => {
                onAddAction();
                setSelectedActionIdx(actions.length);
              }}
              className="h-6 text-xs px-2 gap-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 flex items-center cursor-pointer"
            >
              <span>+ Action</span>
            </button>
          )}
        </div>

        <ActionsPanel
          actions={actions}
          selectedActionIdx={selectedActionIdx}
          onSelectAction={setSelectedActionIdx}
          onRemoveAction={onRemoveAction}
          disabled={disabled}
          validationErrors={actionsErrors}
          sensors={sensors}
          actionKeys={actionKeys}
          onDragEnd={handleDragEnd}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden">
        <ActionInspector
          activeAction={activeAction || undefined}
          selectedActionIdx={selectedActionIdx}
          targetModel={targetModel}
          disabled={disabled}
          validationErrors={actionsErrors}
          onUpdateAction={onUpdateAction}
          onRemoveAction={onRemoveAction}
        />
      </div>
    </div>
  );
}

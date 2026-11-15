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
import type { INQCmd } from "@/lib/data-schemas";
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
  const { ref: containerRef, isCompact } = useContainerWidth<HTMLDivElement>(860);
  const [selectedActionIdx, setSelectedActionIdx] = React.useState<number>(0);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleSelectAction = (idx: number) => {
    setSelectedActionIdx(idx);
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
    if (actions.length === 0) {
      setSelectedActionIdx(0);
    } else if (selectedActionIdx >= actions.length) {
      setSelectedActionIdx(actions.length - 1);
    }
  }, [actions.length, selectedActionIdx]);

  const actionKeys = React.useMemo(
    () => actions.map((a, i) => `action-${a.cmdButton || i}-${i}`),
    [actions],
  );

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

  const renderActionsPanel = () => (
    <div className="w-full h-full flex flex-col min-h-0 bg-card overflow-hidden">
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
            Actions ({actions.length})
          </span>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => {
              onAddAction({
                cmdButton: "View",
                cmdFor: `${targetModel || "ACCOUNT"} S recordId`,
              });
              setSelectedActionIdx(actions.length);
              if (isCompact) {
                setIsSidebarOpen(false);
              }
            }}
            className="h-7 text-xs px-2 sm:px-2.5 gap-1 rounded cursor-pointer shrink-0"
            title="Add a custom row action"
          >
            <Plus className="size-3.5" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        )}
      </div>

      <ActionsPanel
        actions={actions}
        selectedActionIdx={selectedActionIdx}
        onSelectAction={handleSelectAction}
        onRemoveAction={onRemoveAction}
        disabled={disabled}
        validationErrors={actionsErrors}
        sensors={sensors}
        actionKeys={actionKeys}
        onDragEnd={handleDragEnd}
      />
    </div>
  );

  return (
    <div ref={containerRef} className="relative h-full flex min-h-0 overflow-hidden pr-1 gap-2">
      {/* 1. Left Actions List: Side Panel on Desktop, Offcanvas Drawer on Mobile/Compact */}
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
            {renderActionsPanel()}
          </div>
        </>
      ) : (
        <div className="w-80 shrink-0 flex flex-col min-h-0 rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden">
          {renderActionsPanel()}
        </div>
      )}

      {/* 2. Right Action Inspector */}
      <div className="flex-1 flex flex-col min-h-0 rounded border border-border/80 bg-card/60 shadow-2xs overflow-hidden">
        <ActionInspector
          activeAction={activeAction || undefined}
          selectedActionIdx={selectedActionIdx}
          targetModel={targetModel}
          disabled={disabled}
          validationErrors={actionsErrors}
          onUpdateAction={onUpdateAction}
          onRemoveAction={onRemoveAction}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          showSidebarToggle={isCompact}
        />
      </div>
    </div>
  );
}

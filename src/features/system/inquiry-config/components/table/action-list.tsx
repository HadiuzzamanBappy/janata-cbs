"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type SensorDescriptor,
  type SensorOptions,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Edit, Eye, History, Layers, MousePointerClick, Plus, RotateCcw } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { InquiryActionConfig } from "@/lib/data-schemas/inquiry-config-schema";
import { SortableActionItem } from "./action-item";

export interface ActionListProps {
  actions: InquiryActionConfig[];
  actionKeys: string[];
  selectedActIdx: number;
  targetModel?: string;
  disabled?: boolean;
  sensors: SensorDescriptor<SensorOptions>[];
  onSelectAction: (index: number) => void;
  onAddPresetAction: (preset: "VIEW" | "EDIT" | "REVERSE" | "AUDIT") => void;
  onAddCustomAction: () => void;
  onRemoveAction: (index: number) => void;
  onDragEnd: (event: DragEndEvent) => void;
}

export function ActionList({
  actions,
  actionKeys,
  selectedActIdx,
  targetModel = "ACCOUNT",
  disabled = false,
  sensors,
  onSelectAction,
  onAddPresetAction,
  onAddCustomAction,
  onRemoveAction,
  onDragEnd,
}: ActionListProps) {
  const [actPresetOpen, setActPresetOpen] = React.useState(false);

  return (
    <div className="w-72 sm:w-80 shrink-0 border-r border-border/70 flex flex-col min-h-0 bg-muted/10">
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers className="size-3.5 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-foreground truncate">
            Action Buttons ({actions.length})
          </span>
        </div>

        {!disabled && (
          <div className="flex items-center gap-1">
            <Popover open={actPresetOpen} onOpenChange={setActPresetOpen}>
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-6 text-xs gap-1 rounded bg-background border-border/80 cursor-pointer"
                    title="Add row action button"
                  >
                    <Plus className="size-3 text-amber-500" />
                    <span>Add Action</span>
                  </Button>
                }
              />
              <PopoverContent className="w-56 p-1.5 space-y-1" align="start">
                <div className="text-[10px] uppercase font-semibold text-muted-foreground px-2 py-1 border-b border-border/50 font-mono">
                  Quick Add Presets:
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onAddPresetAction("VIEW");
                    setActPresetOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted/60 text-left cursor-pointer"
                >
                  <Eye className="size-3 text-primary" />
                  <span>View Details (Tab)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddPresetAction("EDIT");
                    setActPresetOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted/60 text-left cursor-pointer"
                >
                  <Edit className="size-3 text-amber-500" />
                  <span>Amend Record (Tab)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddPresetAction("REVERSE");
                    setActPresetOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted/60 text-left cursor-pointer"
                >
                  <RotateCcw className="size-3 text-destructive" />
                  <span>Reverse / Void</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onAddPresetAction("AUDIT");
                    setActPresetOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted/60 text-left cursor-pointer"
                >
                  <History className="size-3 text-purple-500" />
                  <span>Audit History (Popup)</span>
                </button>
                <div className="border-t border-border/50 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onAddCustomAction();
                      setActPresetOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-muted/60 text-left text-primary font-medium cursor-pointer"
                  >
                    <Plus className="size-3" />
                    <span>Custom Action</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </div>

      {/* Scrollable Action Cards */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1 min-h-0">
        {actions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
            <MousePointerClick className="size-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs font-medium">No row actions configured</p>
            <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-xs">
              The inquiry table will render purely as a data grid without an actions column.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={actionKeys} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {actions.map((act, index) => (
                  <SortableActionItem
                    key={actionKeys[index]}
                    id={actionKeys[index]}
                    index={index}
                    act={act}
                    targetModel={targetModel}
                    isSelected={index === selectedActIdx}
                    disabled={disabled}
                    onSelect={() => onSelectAction(index)}
                    onRemove={() => onRemoveAction(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

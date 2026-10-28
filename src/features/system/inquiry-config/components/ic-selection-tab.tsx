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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Sparkles, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type { INQSelectField } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelConfigRecord } from "@/lib/data-schemas/model-config-schema";

export interface IcSelectionTabProps {
  filters: INQSelectField[];
  targetModel?: string;
  onAddFilter: (filter?: Partial<INQSelectField>) => void;
  onUpdateFilter: (index: number, patch: Partial<INQSelectField>) => void;
  onRemoveFilter: (index: number) => void;
  onReorderFilters: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}

const OPERAND_OPTIONS = [
  { value: "EQ", label: "Equals (=)", badge: "EQ" },
  { value: "LK", label: "Like (*)", badge: "LK" },
  { value: "RG", label: "Range (Between)", badge: "RG" },
  { value: "NE", label: "Not Equal (≠)", badge: "NE" },
  { value: "GT", label: "Greater Than (>)", badge: "GT" },
  { value: "LT", label: "Less Than (<)", badge: "LT" },
  { value: "CT", label: "Contains (Substring)", badge: "CT" },
];

function FilterCardItem({
  field,
  index,
  disabled,
  onUpdate,
  onRemove,
}: {
  field: INQSelectField;
  index: number;
  disabled?: boolean;
  onUpdate: (patch: Partial<INQSelectField>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `filter-${field.selectFieldName}-${index}`,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border border-border/80 rounded-lg p-3 space-y-3 transition-colors",
        isDragging && "opacity-50 shadow-md",
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div className="flex items-center gap-2">
          {!disabled && (
            <button
              type="button"
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground p-0.5"
            >
              <GripVertical className="size-3.5" />
            </button>
          )}
          <span className="text-xs font-bold text-foreground">
            {field.selectFieldDisplay || field.selectFieldName}
          </span>
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 uppercase">
            {field.selectFieldType}
          </Badge>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 px-1.5 text-muted-foreground hover:text-destructive text-xs"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Field Key</Label>
          <Input
            value={field.selectFieldName}
            disabled={disabled}
            onChange={(e) => onUpdate({ selectFieldName: e.target.value })}
            className="h-7 text-xs font-mono"
            placeholder="e.g. recordId"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Display Label</Label>
          <Input
            value={field.selectFieldDisplay}
            disabled={disabled}
            onChange={(e) => onUpdate({ selectFieldDisplay: e.target.value })}
            className="h-7 text-xs"
            placeholder="e.g. Record ID"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Default Operand</Label>
          <Select
            value={field.selectFieldOperator || "EQ"}
            disabled={disabled}
            onValueChange={(val) => onUpdate({ selectFieldOperator: val })}
          >
            <SelectTrigger className="h-7 text-xs font-mono">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPERAND_OPTIONS.map((op) => (
                <SelectItem key={op.value} value={op.value} className="text-xs">
                  {op.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Default Value</Label>
          <Input
            value={field.selectFieldValue}
            disabled={disabled}
            onChange={(e) => onUpdate({ selectFieldValue: e.target.value })}
            className="h-7 text-xs"
            placeholder="Optional default..."
          />
        </div>
      </div>

      <div className="pt-2 border-t border-border/30 flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={field.selectFieldRequired}
            disabled={disabled}
            onCheckedChange={(checked) => onUpdate({ selectFieldRequired: Boolean(checked) })}
          />
          <span className="text-xs text-foreground font-medium">Mandatory Filter</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox
            checked={Boolean(field.selectFieldOperatorFixed)}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onUpdate({ selectFieldOperatorFixed: checked ? field.selectFieldOperator || "EQ" : "" })
            }
          />
          <span className="text-xs text-foreground font-medium">Lock Operator (Fixed)</span>
        </label>
      </div>
    </div>
  );
}

export function IcSelectionTab({
  filters = [],
  targetModel = "ACCOUNT",
  onAddFilter,
  onUpdateFilter,
  onRemoveFilter,
  onReorderFilters,
  disabled = false,
}: IcSelectionTabProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = filters.findIndex((f, i) => `filter-${f.selectFieldName}-${i}` === active.id);
      const to = filters.findIndex((f, i) => `filter-${f.selectFieldName}-${i}` === over.id);
      if (from !== -1 && to !== -1) {
        onReorderFilters(from, to);
      }
    }
  };

  const handleImportFromModel = React.useCallback(async () => {
    if (!targetModel) return;
    try {
      const res = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(targetModel), {
        silent: true,
      });
      if (res.status === "SUCCESS" && res.data?.PROPERTIES) {
        res.data.PROPERTIES.forEach((prop) => {
          const exists = filters.some((f) => f.selectFieldName === prop.NAME);
          if (!exists) {
            onAddFilter({
              selectFieldName: prop.NAME,
              selectFieldDisplay: prop.LABEL || prop.NAME,
              selectFieldType: (prop.TYPE || "Text").toLowerCase(),
              selectFieldOperator: "EQ",
              selectFieldRequired: Boolean(prop.REQUIRED),
            });
          }
        });
      }
    } catch {
      // Ignore background import errors
    }
  }, [targetModel, filters, onAddFilter]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-card rounded-b-lg border-t-0">
      <div className="flex items-center justify-between px-4 h-10 border-b border-border bg-muted/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground">Filter Criteria (INQSelectField)</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1 font-mono">
            {filters.length}
          </Badge>
        </div>

        {!disabled && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleImportFromModel}
              className="h-7 text-xs gap-1.5"
            >
              <Sparkles className="size-3 text-primary" />
              <span>Import Model Filters</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={() => onAddFilter()}
              className="h-7 text-xs gap-1"
            >
              <Plus className="size-3" />
              <span>Add Filter Field</span>
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filters.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            No search filter criteria defined. Click "+ Add Filter Field" or "Import Model Filters".
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={filters.map((f, i) => `filter-${f.selectFieldName}-${i}`)}
              strategy={verticalListSortingStrategy}
            >
              {filters.map((field, idx) => (
                <FilterCardItem
                  key={`filter-${field.selectFieldName}-${idx}`}
                  field={field}
                  index={idx}
                  disabled={disabled}
                  onUpdate={(patch) => onUpdateFilter(idx, patch)}
                  onRemove={() => onRemoveFilter(idx)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

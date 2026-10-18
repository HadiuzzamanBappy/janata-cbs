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
import { getModelConfigRecord } from "@fixtures";
import { CheckCircle2, Filter, GripVertical, Plus, Search, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type { InquiryFilterConfig } from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface IcSelectionTabProps {
  filters: InquiryFilterConfig[];
  targetModel?: string;
  onAddFilter: (filter: InquiryFilterConfig) => void;
  onUpdateFilter: (index: number, patch: Partial<InquiryFilterConfig>) => void;
  onRemoveFilter: (index: number) => void;
  onReorderFilters: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}

const OPERAND_OPTIONS: Array<{
  value: InquiryFilterConfig["defaultOperand"];
  label: string;
  badge: string;
}> = [
  { value: "EQ", label: "Equals (Exact Match)", badge: "EQ =" },
  { value: "LK", label: "Like (Wildcard / Contains)", badge: "LK *" },
  { value: "RG", label: "Range (Between Two Values)", badge: "RG ↔" },
  { value: "NE", label: "Not Equal", badge: "NE ≠" },
  { value: "GT", label: "Greater Than", badge: "GT >" },
  { value: "LT", label: "Less Than", badge: "LT <" },
  { value: "CT", label: "Contains (Substring)", badge: "CT ⊂" },
];

interface SortableFilterItemProps {
  id: string;
  index: number;
  filter: InquiryFilterConfig;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableFilterItem({
  id,
  index,
  filter,
  isSelected,
  disabled,
  onSelect,
  onRemove,
}: SortableFilterItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
    zIndex: isDragging ? 40 : undefined,
  };

  const operandBadge =
    OPERAND_OPTIONS.find((o) => o.value === filter.defaultOperand)?.badge || filter.defaultOperand;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group p-1.5 rounded border transition-all flex items-center gap-1.5 text-xs select-none",
        isSelected
          ? "bg-primary/10 border-primary text-foreground shadow-2xs font-medium"
          : "bg-background/90 hover:bg-muted/30 border-border/70 text-foreground/90",
        isDragging && "ring-1 ring-primary shadow-md bg-accent/30",
      )}
    >
      {/* Drag Grip Handle */}
      {!disabled && (
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground shrink-0 p-0.5 rounded touch-none focus-visible:outline-none"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical className="size-3.5" />
        </button>
      )}

      {/* Filter Info Button */}
      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-2 flex-1 min-w-0 text-left outline-none cursor-pointer"
      >
        <span className="text-[10px] font-mono text-muted-foreground w-4 shrink-0">
          {index + 1}.
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-medium truncate">{filter.label}</span>
            {filter.required && (
              <span className="text-destructive font-bold text-xs" title="Mandatory search filter">
                *
              </span>
            )}
          </div>
          <div className="text-[10px] font-mono text-muted-foreground truncate">
            Key: {filter.id} • {filter.type}
          </div>
        </div>

        <Badge variant="outline" className="text-[9px] font-mono px-1 py-0 h-4 shrink-0">
          {operandBadge}
        </Badge>
      </button>

      {/* Delete Action */}
      {!disabled && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onRemove}
          className="size-6 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 shrink-0 rounded cursor-pointer"
          title="Remove criterion"
        >
          <Trash2 className="size-3" />
        </Button>
      )}
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
  const [selectedIdx, setSelectedIdx] = React.useState<number>(0);
  const [fieldSearch, setFieldSearch] = React.useState("");
  const [lookupOpen, setLookupOpen] = React.useState(false);

  // Dnd-kit sensors with pointer distance constraint so clicks work without dragging
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Filter keys for SortableContext
  const filterKeys = React.useMemo(
    () => filters.map((f, i) => `${f.id || "filter"}_${i}`),
    [filters],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;

    const fromIndex = filterKeys.indexOf(String(active.id));
    const toIndex = filterKeys.indexOf(String(over.id));

    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderFilters(fromIndex, toIndex);
      if (selectedIdx === fromIndex) {
        setSelectedIdx(toIndex);
      } else if (selectedIdx > fromIndex && selectedIdx <= toIndex) {
        setSelectedIdx(selectedIdx - 1);
      } else if (selectedIdx < fromIndex && selectedIdx >= toIndex) {
        setSelectedIdx(selectedIdx + 1);
      }
    }
  };

  const [modelProps, setModelProps] = React.useState<ModelProperty[]>(() => {
    return getModelConfigRecord(targetModel)?.properties || [];
  });

  // Fetch model properties dynamically when targetModel changes
  React.useEffect(() => {
    let mounted = true;
    async function loadModel() {
      try {
        const res = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(targetModel), {
          silent: true,
        });
        if (mounted && res.status === "SUCCESS" && res.data?.properties) {
          setModelProps(res.data.properties);
          return;
        }
      } catch {
        // Fallback to static model fixtures
      }
      if (mounted) {
        setModelProps(getModelConfigRecord(targetModel)?.properties || []);
      }
    }
    loadModel();
    return () => {
      mounted = false;
    };
  }, [targetModel]);

  // Keep selectedIdx in bounds
  React.useEffect(() => {
    if (filters.length === 0) {
      setSelectedIdx(0);
    } else if (selectedIdx >= filters.length) {
      setSelectedIdx(filters.length - 1);
    }
  }, [filters.length, selectedIdx]);

  const activeFilter = filters[selectedIdx] || null;
  const configuredIds = React.useMemo(
    () => new Set(filters.map((f) => f.id.toLowerCase())),
    [filters],
  );

  const availableProps = React.useMemo(() => {
    return modelProps.filter((p) => p.name && !p.disabled);
  }, [modelProps]);

  const filteredProps = React.useMemo(() => {
    if (!fieldSearch.trim()) return availableProps;
    const q = fieldSearch.trim().toLowerCase();
    return availableProps.filter(
      (p) => p.name.toLowerCase().includes(q) || Boolean(p.label?.toLowerCase().includes(q)),
    );
  }, [availableProps, fieldSearch]);

  const handleAddFromProperty = (prop: ModelProperty) => {
    let filterType: InquiryFilterConfig["type"] = "text";
    const propType = prop.type.toLowerCase();
    if (propType.includes("date")) filterType = "date";
    else if (propType.includes("number") || propType.includes("amount")) filterType = "number";
    else if (propType.includes("drop") || propType.includes("select") || propType.includes("radio"))
      filterType = "select";

    const newFilter: InquiryFilterConfig = {
      id: prop.name,
      label: prop.label || prop.name,
      type: filterType,
      defaultOperand: "EQ",
      defaultValue: "",
      required: prop.required || false,
    };

    onAddFilter(newFilter);
    setSelectedIdx(filters.length);
  };

  const handleAddCustomFilter = () => {
    const nextIdx = filters.length + 1;
    const newFilter: InquiryFilterConfig = {
      id: `filter_${nextIdx}`,
      label: `Filter Criterion ${nextIdx}`,
      type: "text",
      defaultOperand: "EQ",
      defaultValue: "",
      required: false,
    };
    onAddFilter(newFilter);
    setSelectedIdx(filters.length);
  };

  return (
    <div className="h-full w-full rounded border border-border/80 bg-card/60 flex overflow-hidden shadow-2xs min-h-0 select-none">
      {/* 1. Left Panel: Master Criteria Navigator (Fixed Compact Width) */}
      <div className="w-72 sm:w-80 shrink-0 border-r border-border/70 flex flex-col min-h-0 bg-muted/10">
        {/* Header with Title + Compact Lookup Popover */}
        <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-1.5 min-w-0">
            <Filter className="size-3.5 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground truncate">
              Criteria ({filters.length})
            </span>
          </div>

          {!disabled && (
            <div className="flex items-center gap-1">
              {/* Compact Field Lookup Popover */}
              <Popover open={lookupOpen} onOpenChange={setLookupOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs gap-1 rounded bg-background border-border/80 cursor-pointer"
                      disabled={availableProps.length === 0}
                      title={`Search & add field from ${targetModel}`}
                    >
                      <Plus className="size-3 text-primary" />
                      <span>Add Field</span>
                    </Button>
                  }
                />
                <PopoverContent className="w-72 p-0 gap-0 overflow-hidden shadow-md" align="start">
                  <div className="p-2 space-y-1.5 border-b border-border/60 bg-muted/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                        Model: {targetModel}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddCustomFilter();
                          setLookupOpen(false);
                          setFieldSearch("");
                        }}
                        className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 hover:bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                        title="Add custom criterion"
                      >
                        <Plus className="size-2.5" />
                        <span>Custom</span>
                      </button>
                    </div>
                    <div className="relative">
                      <Search className="size-3 text-muted-foreground absolute left-2 top-2" />
                      <Input
                        placeholder="Search model field..."
                        value={fieldSearch}
                        onChange={(e) => setFieldSearch(e.target.value)}
                        className="h-7 text-xs pl-7 bg-background font-mono"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto p-1 space-y-0.5">
                    {filteredProps.length === 0 ? (
                      <div className="p-3 text-center text-xs text-muted-foreground font-mono">
                        No matching fields
                      </div>
                    ) : (
                      filteredProps.map((prop) => {
                        const isAdded = configuredIds.has(prop.name.toLowerCase());
                        return (
                          <button
                            key={prop.name}
                            type="button"
                            disabled={isAdded}
                            onClick={() => {
                              handleAddFromProperty(prop);
                              setLookupOpen(false);
                              setFieldSearch("");
                            }}
                            className={cn(
                              "w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors cursor-pointer group",
                              isAdded
                                ? "opacity-50 cursor-not-allowed bg-muted/20"
                                : "hover:bg-primary/10",
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-mono text-xs font-medium block truncate group-hover:text-primary">
                                {prop.name}
                              </span>
                              {prop.label && (
                                <span className="text-[10px] text-muted-foreground block truncate">
                                  {prop.label}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0 ml-1">
                              <span className="text-[9px] font-mono uppercase px-1 py-0 bg-muted rounded text-muted-foreground">
                                {prop.type}
                              </span>
                              {isAdded && <CheckCircle2 className="size-3 text-muted-foreground" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Scrollable Criteria Items */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-1 min-h-0">
          {filters.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
              <Filter className="size-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs font-medium">No selection filters configured</p>
              <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-xs">
                Use &ldquo;+ Add Field&rdquo; to pick fields from {targetModel} or click &ldquo;+
                Custom&rdquo;.
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filterKeys} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {filters.map((filter, index) => (
                    <SortableFilterItem
                      key={filterKeys[index]}
                      id={filterKeys[index]}
                      index={index}
                      filter={filter}
                      isSelected={index === selectedIdx}
                      disabled={disabled}
                      onSelect={() => setSelectedIdx(index)}
                      onRemove={() => onRemoveFilter(index)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* 2. Right Panel: Criteria Details (Expands to Full Width) */}
      <div className="flex-1 flex flex-col min-h-0 bg-background/50">
        {/* Right Header: Exactly matching left header height and baseline */}
        <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Criterion Inspector:
            </span>
            {activeFilter && (
              <span className="text-xs font-bold text-foreground">
                #{selectedIdx + 1} &bull; {activeFilter.id}
              </span>
            )}
          </div>
          {!disabled && activeFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveFilter(selectedIdx)}
              className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded cursor-pointer"
            >
              <Trash2 className="size-3" /> Delete
            </Button>
          )}
        </div>

        {/* Scrollable Form Content */}
        {activeFilter ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* CBS Scanline Form */}
            <div className="space-y-2.5 text-xs">
              {/* Field Key */}
              <div className="flex items-center gap-2">
                <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                  Field Key
                </Label>
                <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
                <Input
                  disabled={disabled}
                  value={activeFilter.id}
                  onChange={(e) => onUpdateFilter(selectedIdx, { id: e.target.value })}
                  placeholder="e.g. accountNo"
                  className="h-7 text-xs w-56 bg-background rounded border-border/80 font-mono"
                />
              </div>

              {/* Display Label */}
              <div className="flex items-center gap-2">
                <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                  Display Label
                </Label>
                <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
                <Input
                  disabled={disabled}
                  value={activeFilter.label}
                  onChange={(e) => onUpdateFilter(selectedIdx, { label: e.target.value })}
                  placeholder="e.g. Account Number"
                  className="h-7 text-xs w-72 bg-background rounded border-border/80"
                />
              </div>

              {/* Widget Type */}
              <div className="flex items-center gap-2">
                <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                  Widget Type
                </Label>
                <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
                <Select
                  disabled={disabled}
                  value={activeFilter.type}
                  onValueChange={(val) =>
                    onUpdateFilter(selectedIdx, {
                      type: val as InquiryFilterConfig["type"],
                    })
                  }
                >
                  <SelectTrigger className="h-7 text-xs w-44 bg-background rounded border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="select">Dropdown / Selection</SelectItem>
                    <SelectItem value="date">Date Picker</SelectItem>
                    <SelectItem value="number">Numeric Input</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Default Operand */}
              <div className="flex items-center gap-2">
                <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                  Default Operand
                </Label>
                <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
                <Select
                  disabled={disabled}
                  value={activeFilter.defaultOperand}
                  onValueChange={(val) =>
                    onUpdateFilter(selectedIdx, {
                      defaultOperand: val as InquiryFilterConfig["defaultOperand"],
                    })
                  }
                >
                  <SelectTrigger className="h-7 text-xs w-44 bg-background rounded border-border/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {OPERAND_OPTIONS.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-primary font-semibold">{op.badge}</span>
                          <span className="text-muted-foreground font-sans">{op.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Default Pre-fill Value */}
              <div className="flex items-center gap-2">
                <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                  Pre-fill Value
                </Label>
                <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
                <Input
                  disabled={disabled}
                  value={activeFilter.defaultValue || ""}
                  onChange={(e) => onUpdateFilter(selectedIdx, { defaultValue: e.target.value })}
                  placeholder="Optional default / initial query value"
                  className="h-7 text-xs w-64 bg-background rounded border-border/80 font-mono"
                />
              </div>

              {/* Mandatory Requirement */}
              <div className="flex items-center gap-2 pt-1">
                <Label className="w-32 shrink-0 text-xs text-muted-foreground select-none">
                  Mandatory Flag
                </Label>
                <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
                <div className="flex items-center gap-1.5">
                  <Checkbox
                    id="ic-filter-mandatory"
                    disabled={disabled}
                    checked={activeFilter.required}
                    onCheckedChange={(checked) =>
                      onUpdateFilter(selectedIdx, { required: Boolean(checked) })
                    }
                  />
                  <Label
                    htmlFor="ic-filter-mandatory"
                    className="text-xs text-muted-foreground cursor-pointer font-normal"
                  >
                    Require operator to input this criterion before query execution
                  </Label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
            <Filter className="size-7 text-muted-foreground/35 mb-2" />
            <p className="text-xs text-muted-foreground/80">
              Select a criterion on the left to inspect or edit details
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

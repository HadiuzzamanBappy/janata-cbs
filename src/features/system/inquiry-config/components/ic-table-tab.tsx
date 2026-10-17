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
import {
  Calendar,
  CheckCircle2,
  Columns,
  DollarSign,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  GripVertical,
  Hash,
  History,
  Layers,
  MousePointerClick,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Type,
} from "lucide-react";
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
import type {
  InquiryActionConfig,
  InquiryColumnConfig,
} from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";

export interface IcTableTabProps {
  columns: InquiryColumnConfig[];
  actions: InquiryActionConfig[];
  targetModel?: string;
  onAddColumn: (col: InquiryColumnConfig) => void;
  onUpdateColumn: (index: number, patch: Partial<InquiryColumnConfig>) => void;
  onRemoveColumn: (index: number) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  onAddAction: (action: InquiryActionConfig) => void;
  onUpdateAction: (index: number, patch: Partial<InquiryActionConfig>) => void;
  onRemoveAction: (index: number) => void;
  onReorderActions: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}

const FORMAT_OPTIONS: Array<{
  value: InquiryColumnConfig["format"];
  label: string;
  icon: React.ReactNode;
}> = [
  {
    value: "text",
    label: "Text / String",
    icon: <Type className="size-3 text-muted-foreground" />,
  },
  {
    value: "currency",
    label: "Currency / Amount",
    icon: <DollarSign className="size-3 text-emerald-500" />,
  },
  {
    value: "date",
    label: "Date (YYYY-MM-DD)",
    icon: <Calendar className="size-3 text-sky-500" />,
  },
  {
    value: "account",
    label: "Account Number",
    icon: <Hash className="size-3 text-amber-500" />,
  },
  {
    value: "badge",
    label: "Status Badge",
    icon: <CheckCircle2 className="size-3 text-indigo-500" />,
  },
  {
    value: "number",
    label: "Numeric / Quantity",
    icon: <Hash className="size-3 text-purple-500" />,
  },
];

function inferColumnConfig(prop: ModelProperty): InquiryColumnConfig {
  const nameLower = prop.name.toLowerCase();
  const propType = prop.type.toLowerCase();

  let format: InquiryColumnConfig["format"] = "text";
  let align: InquiryColumnConfig["align"] = "left";
  let isMono = false;

  if (
    propType.includes("number") ||
    nameLower.includes("balance") ||
    nameLower.includes("amount") ||
    nameLower.includes("limit") ||
    nameLower.includes("rate")
  ) {
    if (
      nameLower.includes("rate") ||
      nameLower.includes("percent") ||
      nameLower.includes("count")
    ) {
      format = "number";
      align = "right";
      isMono = true;
    } else {
      format = "currency";
      align = "right";
      isMono = true;
    }
  } else if (propType.includes("date") || nameLower.includes("date") || nameLower.endsWith("at")) {
    format = "date";
    align = "center";
    isMono = true;
  } else if (
    nameLower.includes("account") ||
    nameLower.includes("accno") ||
    nameLower.endsWith("no")
  ) {
    format = "account";
    align = "left";
    isMono = true;
  } else if (
    nameLower.includes("status") ||
    nameLower.includes("state") ||
    nameLower.includes("flag")
  ) {
    format = "badge";
    align = "center";
    isMono = false;
  } else if (nameLower.includes("id") || nameLower.includes("code")) {
    format = "text";
    align = "left";
    isMono = true;
  }

  return {
    id: prop.name,
    label: prop.label || prop.name,
    align,
    format,
    isMono,
    sortable: true,
    visible: true,
    isPinned: false,
  };
}

function renderActionIcon(iconName: string) {
  switch (iconName) {
    case "eye":
      return <Eye className="size-3 text-primary" />;
    case "edit":
      return <Edit className="size-3 text-amber-500" />;
    case "rotate-ccw":
      return <RotateCcw className="size-3 text-destructive" />;
    case "history":
      return <History className="size-3 text-purple-500" />;
    case "file-text":
      return <FileText className="size-3 text-emerald-500" />;
    case "external-link":
      return <ExternalLink className="size-3 text-sky-500" />;
    default:
      return <Eye className="size-3 text-primary" />;
  }
}

interface SortableColumnItemProps {
  id: string;
  index: number;
  col: InquiryColumnConfig;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableColumnItem({
  id,
  index,
  col,
  isSelected,
  disabled,
  onSelect,
  onRemove,
}: SortableColumnItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between p-1.5 rounded border transition-all gap-1.5 text-xs select-none",
        isSelected
          ? "bg-primary/10 border-primary text-foreground shadow-2xs font-medium"
          : "bg-background/90 hover:bg-muted/30 border-border/70 text-foreground/90",
        isDragging && "ring-1 ring-primary shadow-md bg-accent/30",
      )}
    >
      {/* Reordering drag handle */}
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

      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-2 min-w-0 flex-1 text-left outline-none cursor-pointer"
      >
        <span className="font-mono text-[11px] text-muted-foreground/80 w-4 text-center shrink-0">
          {index + 1}.
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold truncate">{col.label || col.id}</span>
            {col.isPinned && <Pin className="size-2.5 text-amber-500 shrink-0 fill-amber-500/20" />}
            {!col.visible && (
              <span className="text-[9px] uppercase px-1 py-0 bg-muted text-muted-foreground rounded">
                Hidden
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] text-muted-foreground">
            <span className="text-foreground/70">{col.id}</span>
            <span>&bull;</span>
            <span className="uppercase">{col.format || "text"}</span>
            <span>&bull;</span>
            <span>{col.align || "left"}</span>
          </div>
        </div>
      </button>

      {/* Badges and Remove */}
      <div className="flex items-center gap-1 shrink-0 ml-1">
        <Badge variant="secondary" className="text-[10px] font-mono px-1 py-0 uppercase">
          {col.format || "text"}
        </Badge>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
            title="Delete column"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

interface SortableActionItemProps {
  id: string;
  index: number;
  act: InquiryActionConfig;
  targetModel?: string;
  isSelected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

function SortableActionItem({
  id,
  index,
  act,
  targetModel,
  isSelected,
  disabled,
  onSelect,
  onRemove,
}: SortableActionItemProps) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center justify-between p-1.5 rounded border transition-all gap-1.5 text-xs select-none",
        isSelected
          ? "bg-primary/10 border-primary text-foreground shadow-2xs font-medium"
          : "bg-background/90 hover:bg-muted/30 border-border/70 text-foreground/90",
        isDragging && "ring-1 ring-primary shadow-md bg-accent/30",
      )}
    >
      {/* Reordering handles */}
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

      <button
        type="button"
        onClick={onSelect}
        className="flex items-center gap-2 min-w-0 flex-1 text-left outline-none cursor-pointer"
      >
        <span className="font-mono text-[11px] text-muted-foreground/80 w-4 text-center shrink-0">
          {index + 1}.
        </span>

        <div className="size-6 rounded bg-muted/60 flex items-center justify-center shrink-0 border border-border/50">
          {renderActionIcon(act.icon)}
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-xs font-semibold truncate block">{act.label || act.id}</span>
          <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[10px] text-muted-foreground">
            <span className="truncate max-w-30 text-foreground/70">
              {act.targetCommand || `${targetModel || "ACCOUNT"},SEE`}
            </span>
            <span>&bull;</span>
            <span className="uppercase">{act.openMode || "tab"}</span>
          </div>
        </div>
      </button>

      {/* Badges and Remove */}
      <div className="flex items-center gap-1 shrink-0 ml-1">
        <Badge variant="secondary" className="text-[10px] font-mono px-1 py-0 uppercase">
          {act.actionType || "view"}
        </Badge>
        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
            title="Delete action"
          >
            <Trash2 className="size-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function IcTableTab({
  columns = [],
  actions = [],
  targetModel = "ACCOUNT",
  onAddColumn,
  onUpdateColumn,
  onRemoveColumn,
  onReorderColumns,
  onAddAction,
  onUpdateAction,
  onRemoveAction,
  onReorderActions,
  disabled = false,
}: IcTableTabProps) {
  // Sub-tab: "columns" vs "actions"
  const [activeSegment, setActiveSegment] = React.useState<"columns" | "actions">("columns");

  // Selection states for master-detail inspection
  const [selectedColIdx, setSelectedColIdx] = React.useState<number>(0);
  const [selectedActIdx, setSelectedActIdx] = React.useState<number>(0);

  // Field lookup popovers & search states
  const [fieldSearch, setFieldSearch] = React.useState("");
  const [colLookupOpen, setColLookupOpen] = React.useState(false);
  const [actPresetOpen, setActPresetOpen] = React.useState(false);

  // Model properties cache for lookup
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

  // Keep selection in bounds
  React.useEffect(() => {
    if (columns.length === 0) {
      setSelectedColIdx(0);
    } else if (selectedColIdx >= columns.length) {
      setSelectedColIdx(columns.length - 1);
    }
  }, [columns.length, selectedColIdx]);

  React.useEffect(() => {
    if (actions.length === 0) {
      setSelectedActIdx(0);
    } else if (selectedActIdx >= actions.length) {
      setSelectedActIdx(actions.length - 1);
    }
  }, [actions.length, selectedActIdx]);

  // Target model palette handling
  const configuredColIds = React.useMemo(() => {
    return new Set(columns.map((c) => c.id.toLowerCase()));
  }, [columns]);

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

  const handleAddFromModel = (prop: ModelProperty) => {
    if (configuredColIds.has(prop.name.toLowerCase())) return;
    const newCol = inferColumnConfig(prop);
    onAddColumn(newCol);
    setSelectedColIdx(columns.length);
  };

  const handleAddCustomColumn = () => {
    const id = `COL_${Date.now().toString().slice(-4)}`;
    onAddColumn({
      id,
      label: "New Column",
      align: "left",
      format: "text",
      isMono: false,
      sortable: true,
      visible: true,
      isPinned: false,
    });
    setSelectedColIdx(columns.length);
  };

  const handleAddPresetAction = (preset: "VIEW" | "EDIT" | "REVERSE" | "AUDIT") => {
    const model = targetModel || "ACCOUNT";
    const ts = Date.now().toString().slice(-3);
    let newAct: InquiryActionConfig;

    switch (preset) {
      case "VIEW":
        newAct = {
          id: `VIEW_${ts}`,
          label: "View Details",
          targetCommand: `${model},SEE`,
          actionType: "view",
          icon: "eye",
          openMode: "tab",
          idParamField: "recordId",
        };
        break;
      case "EDIT":
        newAct = {
          id: `EDIT_${ts}`,
          label: "Amend",
          targetCommand: `${model},AMEND`,
          actionType: "edit",
          icon: "edit",
          openMode: "tab",
          idParamField: "recordId",
        };
        break;
      case "REVERSE":
        newAct = {
          id: `REV_${ts}`,
          label: "Reverse",
          targetCommand: `${model},REVERSE`,
          actionType: "command",
          icon: "rotate-ccw",
          openMode: "tab",
          idParamField: "recordId",
        };
        break;
      case "AUDIT":
        newAct = {
          id: `HIST_${ts}`,
          label: "History",
          targetCommand: `${model},HIST`,
          actionType: "drilldown",
          icon: "history",
          openMode: "popup",
          idParamField: "recordId",
        };
        break;
    }

    onAddAction(newAct);
    setSelectedActIdx(actions.length);
  };

  const handleAddCustomAction = () => {
    const ts = Date.now().toString().slice(-3);
    const model = targetModel || "ACCOUNT";
    onAddAction({
      id: `ACT_${ts}`,
      label: "Custom Action",
      targetCommand: `${model},SEE`,
      actionType: "view",
      icon: "eye",
      openMode: "tab",
      idParamField: "recordId",
    });
    setSelectedActIdx(actions.length);
  };

  // Dnd-kit sensors with pointer distance constraint so clicks work without dragging
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnKeys = React.useMemo(() => columns.map((c, i) => `${c.id || "col"}_${i}`), [columns]);

  const handleDragEndColumns = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;

    const fromIndex = columnKeys.indexOf(String(active.id));
    const toIndex = columnKeys.indexOf(String(over.id));

    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderColumns(fromIndex, toIndex);
      if (selectedColIdx === fromIndex) {
        setSelectedColIdx(toIndex);
      } else if (selectedColIdx > fromIndex && selectedColIdx <= toIndex) {
        setSelectedColIdx(selectedColIdx - 1);
      } else if (selectedColIdx < fromIndex && selectedColIdx >= toIndex) {
        setSelectedColIdx(selectedColIdx + 1);
      }
    }
  };

  const actionKeys = React.useMemo(() => actions.map((a, i) => `${a.id || "act"}_${i}`), [actions]);

  const handleDragEndActions = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || disabled) return;

    const fromIndex = actionKeys.indexOf(String(active.id));
    const toIndex = actionKeys.indexOf(String(over.id));

    if (fromIndex !== -1 && toIndex !== -1) {
      onReorderActions(fromIndex, toIndex);
      if (selectedActIdx === fromIndex) {
        setSelectedActIdx(toIndex);
      } else if (selectedActIdx > fromIndex && selectedActIdx <= toIndex) {
        setSelectedActIdx(selectedActIdx - 1);
      } else if (selectedActIdx < fromIndex && selectedActIdx >= toIndex) {
        setSelectedActIdx(selectedActIdx + 1);
      }
    }
  };

  const activeCol = columns[selectedColIdx];
  const activeAct = actions[selectedActIdx];

  return (
    <div className="h-full flex flex-col gap-2 overflow-hidden select-none">
      {/* =================================================================== */}
      {/* Header Segment Switcher                                             */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between border-b border-border/70 pb-2 px-0.5 shrink-0">
        <div className="flex items-center gap-1.5 p-0.5 bg-muted/40 rounded border border-border/60">
          <button
            type="button"
            onClick={() => setActiveSegment("columns")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer",
              activeSegment === "columns"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Columns className="size-3 text-primary" />
            <span>Table Columns</span>
            <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1.5 h-4 ml-0.5">
              {columns.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveSegment("actions")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-all cursor-pointer",
              activeSegment === "actions"
                ? "bg-background text-foreground shadow-2xs font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <MousePointerClick className="size-3 text-amber-500" />
            <span>Row Action Buttons</span>
            <Badge variant="secondary" className="text-[10px] font-mono py-0 px-1.5 h-4 ml-0.5">
              {actions.length}
            </Badge>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-mono">Model:</span>
          <Badge variant="outline" className="text-xs font-mono font-medium px-2 py-0.5">
            {targetModel || "GENERIC"}
          </Badge>
        </div>
      </div>

      {/* =================================================================== */}
      {/* SEGMENT 1: TABLE COLUMNS STUDIO                                     */}
      {/* =================================================================== */}
      {activeSegment === "columns" && (
        <div className="flex-1 w-full rounded border border-border/80 bg-card/60 flex overflow-hidden shadow-2xs min-h-0">
          {/* Left Panel: Configured Columns Master List (Slim Width matching Model Config) */}
          <div className="w-72 sm:w-80 shrink-0 border-r border-border/70 flex flex-col min-h-0 bg-muted/10">
            <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
              <div className="flex items-center gap-1.5 min-w-0">
                <Columns className="size-3.5 text-primary shrink-0" />
                <span className="text-xs font-semibold text-foreground truncate">
                  Columns ({columns.length})
                </span>
              </div>

              {!disabled && (
                <div className="flex items-center gap-1">
                  {/* Compact Field Lookup Popover */}
                  <Popover open={colLookupOpen} onOpenChange={setColLookupOpen}>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs gap-1 rounded bg-background border-border/80 cursor-pointer"
                          disabled={availableProps.length === 0}
                          title={`Search & add fields from ${targetModel}`}
                        >
                          <Plus className="size-3 text-primary" />
                          <span>Add Field</span>
                        </Button>
                      }
                    />
                    <PopoverContent
                      className="w-72 p-0 gap-0 overflow-hidden shadow-md"
                      align="start"
                    >
                      <div className="p-2 space-y-1.5 border-b border-border/60 bg-muted/10">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                            Model: {targetModel}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              handleAddCustomColumn();
                              setColLookupOpen(false);
                              setFieldSearch("");
                            }}
                            className="flex items-center gap-1 text-[10px] font-medium text-primary hover:text-primary/80 hover:bg-primary/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                            title="Add custom column"
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
                            const isAdded = configuredColIds.has(prop.name.toLowerCase());
                            return (
                              <button
                                key={prop.name}
                                type="button"
                                disabled={isAdded}
                                onClick={() => {
                                  handleAddFromModel(prop);
                                  setColLookupOpen(false);
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
                                  {isAdded && (
                                    <CheckCircle2 className="size-3 text-muted-foreground" />
                                  )}
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

            {/* Scrollable Column Cards */}
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 min-h-0">
              {columns.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
                  <Columns className="size-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs font-medium">No table columns defined</p>
                  <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-xs">
                    Use &ldquo;+ Add Field&rdquo; to pick columns from {targetModel} or click
                    &ldquo;+ Custom&rdquo;.
                  </p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndColumns}
                >
                  <SortableContext items={columnKeys} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {columns.map((col, index) => (
                        <SortableColumnItem
                          key={columnKeys[index]}
                          id={columnKeys[index]}
                          index={index}
                          col={col}
                          isSelected={index === selectedColIdx}
                          disabled={disabled}
                          onSelect={() => setSelectedColIdx(index)}
                          onRemove={() => onRemoveColumn(index)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Right Panel: Column Inspector & Live Cell Simulation (Expands to Full Width) */}
          <div className="flex-1 flex flex-col min-h-0 bg-background/50">
            {/* Right Header: Exactly matching left header height and baseline */}
            <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Column Inspector:
                </span>
                {activeCol && (
                  <>
                    <span className="text-xs font-bold text-foreground">
                      {activeCol.label || activeCol.id}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono px-1.5 py-0 uppercase"
                    >
                      {activeCol.format || "text"}
                    </Badge>
                  </>
                )}
              </div>

              {!disabled && activeCol && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveColumn(selectedColIdx)}
                  className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded cursor-pointer"
                >
                  <Trash2 className="size-3" /> Delete
                </Button>
              )}
            </div>

            {/* Scrollable Form Content */}
            {activeCol ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* CBS Scanline Form */}
                <div className="space-y-2 text-xs">
                  {/* Field Key */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Field Key :
                    </Label>
                    <Input
                      value={activeCol.id}
                      disabled={disabled}
                      onChange={(e) =>
                        onUpdateColumn(selectedColIdx, { id: e.target.value.trim() })
                      }
                      className="h-7 text-xs font-mono bg-background rounded border-border/80 w-56"
                      placeholder="e.g. accountNo"
                    />
                  </div>

                  {/* Header Label */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Header Label :
                    </Label>
                    <Input
                      value={activeCol.label}
                      disabled={disabled}
                      onChange={(e) => onUpdateColumn(selectedColIdx, { label: e.target.value })}
                      className="h-7 text-xs bg-background rounded border-border/80 w-72"
                      placeholder="e.g. Account Number"
                    />
                  </div>

                  {/* Data Format */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Data Format :
                    </Label>
                    <Select
                      value={activeCol.format || "text"}
                      disabled={disabled}
                      onValueChange={(val) =>
                        onUpdateColumn(selectedColIdx, {
                          format: val as InquiryColumnConfig["format"],
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        {FORMAT_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className="flex items-center gap-1.5">
                              {opt.icon}
                              <span>{opt.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Cell Alignment */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Cell Alignment :
                    </Label>
                    <Select
                      value={activeCol.align || "left"}
                      disabled={disabled}
                      onValueChange={(val) =>
                        onUpdateColumn(selectedColIdx, {
                          align: val as InquiryColumnConfig["align"],
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="left">Left Aligned (Standard text & IDs)</SelectItem>
                        <SelectItem value="center">Center Aligned (Dates & Badges)</SelectItem>
                        <SelectItem value="right">Right Aligned (Amounts & Numbers)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Column Width */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Column Width :
                    </Label>
                    <div className="flex items-center gap-1.5 w-48">
                      <Input
                        value={activeCol.width || ""}
                        disabled={disabled}
                        onChange={(e) => onUpdateColumn(selectedColIdx, { width: e.target.value })}
                        className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1"
                        placeholder="auto (or e.g. 140px, 10rem)"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={disabled}
                        onClick={() => onUpdateColumn(selectedColIdx, { width: undefined })}
                        className="h-7 text-[10px] px-2 rounded cursor-pointer"
                        title="Reset to automatic flex width"
                      >
                        Auto
                      </Button>
                    </div>
                  </div>

                  {/* Options Toggles */}
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                        Typography :
                      </Label>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="mono-toggle"
                          checked={Boolean(activeCol.isMono)}
                          disabled={disabled}
                          onCheckedChange={(val) =>
                            onUpdateColumn(selectedColIdx, { isMono: Boolean(val) })
                          }
                          className="rounded"
                        />
                        <Label
                          htmlFor="mono-toggle"
                          className="text-xs text-foreground cursor-pointer font-mono"
                        >
                          Monospace Font (Recommended for Accounts, IDs & Amounts)
                        </Label>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                        Interactivity :
                      </Label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            id="sortable-toggle"
                            checked={activeCol.sortable !== false}
                            disabled={disabled}
                            onCheckedChange={(val) =>
                              onUpdateColumn(selectedColIdx, { sortable: Boolean(val) })
                            }
                            className="rounded"
                          />
                          <Label
                            htmlFor="sortable-toggle"
                            className="text-xs text-foreground cursor-pointer"
                          >
                            Sortable
                          </Label>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            id="pinned-toggle"
                            checked={Boolean(activeCol.isPinned)}
                            disabled={disabled}
                            onCheckedChange={(val) =>
                              onUpdateColumn(selectedColIdx, { isPinned: Boolean(val) })
                            }
                            className="rounded"
                          />
                          <Label
                            htmlFor="pinned-toggle"
                            className="text-xs text-foreground cursor-pointer"
                          >
                            Pin Left
                          </Label>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Checkbox
                            id="visible-toggle"
                            checked={activeCol.visible !== false}
                            disabled={disabled}
                            onCheckedChange={(val) =>
                              onUpdateColumn(selectedColIdx, { visible: Boolean(val) })
                            }
                            className="rounded"
                          />
                          <Label
                            htmlFor="visible-toggle"
                            className="text-xs text-foreground cursor-pointer"
                          >
                            Visible
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center p-6 text-center text-muted-foreground">
                <p className="text-xs font-mono">
                  Select a column from the list to inspect its properties.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SEGMENT 2: ROW ACTION BUTTONS STUDIO                                */}
      {/* =================================================================== */}
      {activeSegment === "actions" && (
        <div className="flex-1 w-full rounded border border-border/80 bg-card/60 flex overflow-hidden shadow-2xs min-h-0">
          {/* Left Panel: Configured Actions Master List (Slim Width matching Model Config) */}
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
                  {/* Preset Action Popover */}
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
                          handleAddPresetAction("VIEW");
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
                          handleAddPresetAction("EDIT");
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
                          handleAddPresetAction("REVERSE");
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
                          handleAddPresetAction("AUDIT");
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
                            handleAddCustomAction();
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
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEndActions}
                >
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
                          onSelect={() => setSelectedActIdx(index)}
                          onRemove={() => onRemoveAction(index)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>

          {/* Right Panel: Action Inspector & Button Simulation (Expands to Full Width) */}
          <div className="flex-1 flex flex-col min-h-0 bg-background/50">
            {/* Right Header: Exactly matching left header height and baseline */}
            <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Action Inspector:
                </span>
                {activeAct && (
                  <>
                    <span className="text-xs font-bold text-foreground">
                      {activeAct.label || activeAct.id}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono px-1.5 py-0 uppercase"
                    >
                      {activeAct.actionType || "view"}
                    </Badge>
                  </>
                )}
              </div>

              {!disabled && activeAct && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveAction(selectedActIdx)}
                  className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded cursor-pointer"
                >
                  <Trash2 className="size-3" /> Delete
                </Button>
              )}
            </div>

            {/* Scrollable Form Content */}
            {activeAct ? (
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* CBS Scanline Form */}
                <div className="space-y-2 text-xs">
                  {/* Action ID */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Action ID :
                    </Label>
                    <Input
                      value={activeAct.id}
                      disabled={disabled}
                      onChange={(e) =>
                        onUpdateAction(selectedActIdx, { id: e.target.value.toUpperCase() })
                      }
                      className="h-7 text-xs font-mono uppercase bg-background rounded border-border/80 w-56"
                      placeholder="e.g. VIEW_DETAILS"
                    />
                  </div>

                  {/* Button Label */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Button Label :
                    </Label>
                    <Input
                      value={activeAct.label}
                      disabled={disabled}
                      onChange={(e) => onUpdateAction(selectedActIdx, { label: e.target.value })}
                      className="h-7 text-xs bg-background rounded border-border/80 w-72"
                      placeholder="e.g. View Statement"
                    />
                  </div>

                  {/* Target Command */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Target Command :
                    </Label>
                    <Input
                      value={activeAct.targetCommand || ""}
                      disabled={disabled}
                      onChange={(e) =>
                        onUpdateAction(selectedActIdx, { targetCommand: e.target.value })
                      }
                      className="h-7 text-xs font-mono bg-background rounded border-border/80 w-64"
                      placeholder={`e.g. ${targetModel || "ACCOUNT"},SEE`}
                    />
                  </div>

                  {/* Action Type */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Action Type :
                    </Label>
                    <Select
                      value={activeAct.actionType || "view"}
                      disabled={disabled}
                      onValueChange={(val) =>
                        onUpdateAction(selectedActIdx, {
                          actionType: val as InquiryActionConfig["actionType"],
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="view">View (Read-Only Inspection)</SelectItem>
                        <SelectItem value="edit">Edit (Maintenance & Amend)</SelectItem>
                        <SelectItem value="command">Command (Execution / Reversal)</SelectItem>
                        <SelectItem value="drilldown">Drilldown (Sub-inquiry)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Action Icon */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Button Icon :
                    </Label>
                    <Select
                      value={activeAct.icon || "eye"}
                      disabled={disabled}
                      onValueChange={(val) =>
                        onUpdateAction(selectedActIdx, {
                          icon: val as InquiryActionConfig["icon"],
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="eye">
                          <div className="flex items-center gap-1.5">
                            <Eye className="size-3 text-primary" />
                            <span>Eye (Inspect / View)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="edit">
                          <div className="flex items-center gap-1.5">
                            <Edit className="size-3 text-amber-500" />
                            <span>Edit (Pencil / Amend)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="rotate-ccw">
                          <div className="flex items-center gap-1.5">
                            <RotateCcw className="size-3 text-destructive" />
                            <span>Rotate (Reverse / Undo)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="history">
                          <div className="flex items-center gap-1.5">
                            <History className="size-3 text-purple-500" />
                            <span>History (Audit Trail)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="file-text">
                          <div className="flex items-center gap-1.5">
                            <FileText className="size-3 text-emerald-500" />
                            <span>Document (Statement / Advice)</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="external-link">
                          <div className="flex items-center gap-1.5">
                            <ExternalLink className="size-3 text-sky-500" />
                            <span>External Link (Jump)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Open Mode */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      Open Mode :
                    </Label>
                    <Select
                      value={activeAct.openMode || "tab"}
                      disabled={disabled}
                      onValueChange={(val) =>
                        onUpdateAction(selectedActIdx, {
                          openMode: val as InquiryActionConfig["openMode"],
                        })
                      }
                    >
                      <SelectTrigger className="h-7 text-xs bg-background rounded border-border/80 w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="text-xs">
                        <SelectItem value="tab">New Workspace Tab</SelectItem>
                        <SelectItem value="popup">Modal Dialog / Pop-up</SelectItem>
                        <SelectItem value="drilldown">In-Place Drilldown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Parameter Field */}
                  <div className="flex items-center gap-2">
                    <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px]">
                      ID Param Field :
                    </Label>
                    <Input
                      value={activeAct.idParamField || "recordId"}
                      disabled={disabled}
                      onChange={(e) =>
                        onUpdateAction(selectedActIdx, { idParamField: e.target.value })
                      }
                      className="h-7 text-xs font-mono bg-background rounded border-border/80 w-56"
                      placeholder="e.g. recordId or accountNo"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
                <p className="text-xs font-mono">
                  Select an action button from the list to inspect its properties.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

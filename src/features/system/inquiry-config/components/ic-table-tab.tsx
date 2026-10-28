"use client";

import {
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Columns, MousePointerClick } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cbs } from "@/lib/cbs-client";
import { cn } from "@/lib/core-utils";
import type {
  InquiryActionConfig,
  InquiryColumnConfig,
} from "@/lib/data-schemas/inquiry-config-schema";
import type { ModelConfigRecord, ModelProperty } from "@/lib/data-schemas/model-config-schema";
import { ActionInspector } from "./table/action-inspector";
import { ActionList } from "./table/action-list";
import { ColumnInspector } from "./table/column-inspector";
import { ColumnList } from "./table/column-list";
import { inferColumnConfig } from "./table/table-constants";

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

  // Model properties cache for lookup
  const [modelProps, setModelProps] = React.useState<ModelProperty[]>([]);

  // Fetch model properties dynamically when targetModel changes
  React.useEffect(() => {
    let mounted = true;
    async function loadModel() {
      if (!targetModel) {
        setModelProps([]);
        return;
      }
      try {
        const res = await cbs.send<ModelConfigRecord>(cbs.modelConfig.get(targetModel), {
          silent: true,
        });
        if (mounted && res.status === "SUCCESS" && res.data?.PROPERTIES) {
          setModelProps(res.data.PROPERTIES);
        }
      } catch {
        if (mounted) setModelProps([]);
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
    return modelProps.filter((p) => Boolean(p.NAME));
  }, [modelProps]);

  const handleAddFromModel = (prop: ModelProperty) => {
    if (configuredColIds.has(prop.NAME.toLowerCase())) return;
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
          <ColumnList
            columns={columns}
            columnKeys={columnKeys}
            selectedColIdx={selectedColIdx}
            targetModel={targetModel}
            disabled={disabled}
            availableProps={availableProps}
            configuredColIds={configuredColIds}
            sensors={sensors}
            onSelectColumn={setSelectedColIdx}
            onAddFromModel={handleAddFromModel}
            onAddCustomColumn={handleAddCustomColumn}
            onRemoveColumn={onRemoveColumn}
            onDragEnd={handleDragEndColumns}
          />
          <ColumnInspector
            activeCol={activeCol}
            selectedColIdx={selectedColIdx}
            disabled={disabled}
            onUpdateColumn={onUpdateColumn}
            onRemoveColumn={onRemoveColumn}
          />
        </div>
      )}

      {/* =================================================================== */}
      {/* SEGMENT 2: ROW ACTION BUTTONS STUDIO                                */}
      {/* =================================================================== */}
      {activeSegment === "actions" && (
        <div className="flex-1 w-full rounded border border-border/80 bg-card/60 flex overflow-hidden shadow-2xs min-h-0">
          <ActionList
            actions={actions}
            actionKeys={actionKeys}
            selectedActIdx={selectedActIdx}
            targetModel={targetModel}
            disabled={disabled}
            sensors={sensors}
            onSelectAction={setSelectedActIdx}
            onAddPresetAction={handleAddPresetAction}
            onAddCustomAction={handleAddCustomAction}
            onRemoveAction={onRemoveAction}
            onDragEnd={handleDragEndActions}
          />
          <ActionInspector
            activeAct={activeAct}
            selectedActIdx={selectedActIdx}
            targetModel={targetModel}
            disabled={disabled}
            onUpdateAction={onUpdateAction}
            onRemoveAction={onRemoveAction}
          />
        </div>
      )}
    </div>
  );
}

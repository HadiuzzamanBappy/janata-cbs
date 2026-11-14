"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import { Button } from "@/components/ui/button";
import type { INQCmd } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { ACTION_INSPECTOR_SECTIONS } from "../../fields/ic-action-fields";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";
import { InspectorEmptyState } from "../shared/inspector-empty-state";
import { InspectorHeader } from "../shared/inspector-header";

export interface ActionInspectorProps {
  activeAction?: INQCmd;
  selectedActionIdx: number;
  targetModel?: string;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
  onUpdateAction: (index: number, patch: Partial<INQCmd>) => void;
  onRemoveAction: (index: number) => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  showSidebarToggle?: boolean;
}

const ACTION_PRESETS = [
  { label: "View", mode: "S", commandSuffix: "S recordId" },
  { label: "Edit", mode: "I", commandSuffix: "I recordId" },
  { label: "Auth", mode: "A", commandSuffix: "A recordId" },
  { label: "Delete", mode: "D", commandSuffix: "D recordId" },
  { label: "Reverse", mode: "R", commandSuffix: "R recordId" },
  { label: "History", mode: "H", commandSuffix: "H recordId" },
];

export function ActionInspector({
  activeAction,
  selectedActionIdx,
  targetModel,
  disabled = false,
  validationErrors = [],
  onUpdateAction,
  onRemoveAction,
  onToggleSidebar,
  isSidebarOpen = false,
  showSidebarToggle = false,
}: ActionInspectorProps) {
  const errorMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const err of validationErrors) {
      if (err.tab === "actions" && err.itemIndex === selectedActionIdx) {
        const cleanKey = err.fieldKey.split(".").pop() || err.fieldKey;
        map[cleanKey] = err.message;
      }
    }
    return map;
  }, [validationErrors, selectedActionIdx]);

  if (!activeAction) {
    return (
      <InspectorEmptyState message="Select an action from the left to inspect its command definition." />
    );
  }

  const handleApplyPreset = (preset: (typeof ACTION_PRESETS)[number]) => {
    const existingParts = (activeAction.cmdFor || "").trim().split(/\s+/);
    const prefix =
      existingParts[0] && existingParts[0].length > 0 ? existingParts[0] : targetModel || "ACCOUNT";
    const paramToken =
      existingParts[2] && existingParts[2].length > 0 ? existingParts[2] : "recordId";
    onUpdateAction(selectedActionIdx, {
      cmdButton: preset.label,
      cmdFor: `${prefix} ${preset.mode} ${paramToken}`,
    });
  };

  const handleFieldChange = (fieldKey: string, value: unknown) => {
    onUpdateAction(selectedActionIdx, {
      [fieldKey]: String(value ?? ""),
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      {/* 1. Header Bar */}
      <InspectorHeader
        title={activeAction.cmdButton}
        subtitle={activeAction.cmdFor}
        fallbackTitle="<UNNAMED_ACTION>"
        indexBadge={selectedActionIdx}
        showSidebarToggle={showSidebarToggle}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={onToggleSidebar}
        toggleTooltip={isSidebarOpen ? "Hide Actions" : "Show Actions"}
        onDelete={() => onRemoveAction(selectedActionIdx)}
        deleteTooltip="Delete Action"
        disabled={disabled}
      />

      {/* 2. Inspector Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          {/* Quick Preset Buttons */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block border-b border-border/60 pb-1.5">
              Action Presets
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {ACTION_PRESETS.map((p) => {
                const isSelected = activeAction.cmdButton === p.label;
                return (
                  <Button
                    key={p.label}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    disabled={disabled}
                    onClick={() => handleApplyPreset(p)}
                    className="h-7 px-2.5 text-xs rounded gap-1 cursor-pointer"
                  >
                    <span className="font-semibold">{p.label}</span>
                    <span className="text-[10px] opacity-70 font-mono">({p.mode})</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Form Engine Rendered Action Fields */}
          <FormRenderer
            frmElements={{ sections: ACTION_INSPECTOR_SECTIONS }}
            values={activeAction as unknown as Record<string, unknown>}
            onChange={handleFieldChange}
            errors={errorMap}
            disabled={disabled}
            mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          />
        </div>
      </div>
    </div>
  );
}

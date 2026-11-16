"use client";

import * as React from "react";
import { FormRenderer } from "@/components/cbs-form-engine";
import type { INQCmd } from "@/lib/data-schemas";
import { CbsRecordFunction } from "@/types";
import { getActionInspectorSections } from "../../fields/ic-action-fields";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";
import { InspectorEmptyState } from "../shared/inspector-empty-state";
import { InspectorHeader } from "../shared/inspector-header";

export interface ActionInspectorProps {
  activeAction?: INQCmd & { actionPreset?: string };
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

const PRESET_MODES = ["S", "I", "A", "D", "R", "H"] as const;

export function ActionInspector({
  activeAction,
  selectedActionIdx,
  targetModel = "ACCOUNT",
  disabled = false,
  validationErrors = [],
  onUpdateAction,
  onRemoveAction,
  onToggleSidebar,
  isSidebarOpen = false,
  showSidebarToggle = false,
}: ActionInspectorProps) {
  // 1. Determine preset: prioritize active in-memory preset, fallback to detecting from cmdFor
  const effectivePreset = React.useMemo(() => {
    if (!activeAction) return "CUSTOM";
    if (activeAction.actionPreset) return activeAction.actionPreset;
    const parts = (activeAction.cmdFor || "").trim().split(/\s+/);
    const mode = parts[1]?.toUpperCase();
    return mode && (PRESET_MODES as readonly string[]).includes(mode) ? mode : "CUSTOM";
  }, [activeAction]);

  // 2. Form sections dynamically parameterized with live targetModel prefix
  const existingPrefix = (activeAction?.cmdFor || "").trim().split(/\s+/)[0];
  const effectiveModel = existingPrefix || targetModel.trim() || "ACCOUNT";

  const sections = React.useMemo(
    () => getActionInspectorSections(effectiveModel),
    [effectiveModel],
  );

  // 3. Form values including dynamic actionPreset
  const formValues = React.useMemo(
    () => ({
      ...(activeAction || {}),
      actionPreset: effectivePreset,
    }),
    [activeAction, effectivePreset],
  );

  // 4. Map validation errors for this action
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

      {/* 2. 1:1 Form Engine Renderer (matches mc-property-inspector.tsx standard) */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          <FormRenderer
            frmElements={{ sections }}
            values={formValues}
            onRecordChange={(next) => onUpdateAction(selectedActionIdx, next)}
            errors={errorMap}
            disabled={disabled}
            mode={disabled ? CbsRecordFunction.SEE : CbsRecordFunction.INPUT}
          />
        </div>
      </div>
    </div>
  );
}

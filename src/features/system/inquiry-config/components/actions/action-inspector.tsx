"use client";

import { PanelLeft, Trash2 } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormRenderer } from "@/features/form-engine/components/form-renderer";
import type { INQCmd } from "@/lib/data-schemas/inquiry-config-schema";
import { CbsRecordFunction } from "@/types";
import { ACTION_INSPECTOR_SECTIONS } from "../../fields";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";

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
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
        <p className="text-xs font-mono">
          Select an action from the left to inspect its command definition.
        </p>
      </div>
    );
  }

  const handleApplyPreset = (preset: (typeof ACTION_PRESETS)[number]) => {
    const existingParts = (activeAction.cmdFor || "").trim().split(/\s+/);
    const prefix =
      existingParts[0] && existingParts[0].length > 0 ? existingParts[0] : targetModel || "ACCOUNT";
    onUpdateAction(selectedActionIdx, {
      cmdButton: preset.label,
      cmdFor: `${prefix} ${preset.commandSuffix}`,
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
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {showSidebarToggle && onToggleSidebar && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onToggleSidebar}
              className="size-7 text-muted-foreground hover:text-foreground shrink-0 mr-0.5"
              title={isSidebarOpen ? "Hide Actions" : "Show Actions"}
            >
              <PanelLeft className="size-3.5" />
            </Button>
          )}

          {activeAction.cmdButton &&
          activeAction.cmdFor &&
          activeAction.cmdButton !== activeAction.cmdFor ? (
            <>
              <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
                {activeAction.cmdButton}
              </span>
              <span className="text-xs text-muted-foreground truncate font-mono">
                — {activeAction.cmdFor}
              </span>
            </>
          ) : (
            <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
              {activeAction.cmdButton || activeAction.cmdFor || "<UNNAMED_ACTION>"}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs shrink-0"
          >
            #{selectedActionIdx + 1}
          </Badge>

          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemoveAction(selectedActionIdx)}
              className="size-7 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
              title="Delete Action"
            >
              <Trash2 className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

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

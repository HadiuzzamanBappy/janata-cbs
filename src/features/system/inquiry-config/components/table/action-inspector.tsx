"use client";

import { Play, Settings2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldRow } from "@/features/form-engine/components/widgets/field-row";
import { cn } from "@/lib/core-utils";
import type { INQCmd } from "@/lib/data-schemas/inquiry-config-schema";
import type { InquiryValidationErrorItem } from "../../hooks/ic-validation";

export interface ActionInspectorProps {
  activeAction?: INQCmd;
  selectedActionIdx: number;
  targetModel?: string;
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
  onUpdateAction: (index: number, patch: Partial<INQCmd>) => void;
  onRemoveAction: (index: number) => void;
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
}: ActionInspectorProps) {
  const btnError = validationErrors.find(
    (e) =>
      e.tab === "table" &&
      e.subSegment === "actions" &&
      e.itemIndex === selectedActionIdx &&
      e.fieldKey.endsWith("cmdButton"),
  );
  const forError = validationErrors.find(
    (e) =>
      e.tab === "table" &&
      e.subSegment === "actions" &&
      e.itemIndex === selectedActionIdx &&
      e.fieldKey.endsWith("cmdFor"),
  );

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

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      {/* 1. Header Bar */}
      <div className="px-3 py-1.5 border-b border-border/70 flex items-center justify-between gap-2 bg-muted/20 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Badge
            variant="outline"
            className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border-primary/25 shadow-2xs"
          >
            Action #{selectedActionIdx + 1}
          </Badge>
          <span className="text-xs font-bold font-mono text-foreground uppercase tracking-wide truncate">
            {activeAction.cmdButton || "<Empty Action>"}
          </span>
        </div>

        {!disabled && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveAction(selectedActionIdx)}
            className="h-6 text-xs text-destructive hover:bg-destructive/10 gap-1 rounded cursor-pointer"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Action</span>
          </Button>
        )}
      </div>

      {/* 2. Inspector Panels */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="max-w-3xl space-y-3">
          {/* Panel 1: Action Identity & Quick Presets */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Play className="size-3.5 text-primary" />
                <span>Action Preset & Button Label</span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Select Preset or Type Custom
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Quick Type Selection */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Action Type Presets:
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

              {/* Button Display Label */}
              <FieldRow
                label="Button Label"
                required
                error={btnError?.message}
                enrichText="Label text rendered on the row action button or context menu (e.g. View, Edit, Auth)."
              >
                <Input
                  value={activeAction.cmdButton}
                  disabled={disabled}
                  onChange={(e) => onUpdateAction(selectedActionIdx, { cmdButton: e.target.value })}
                  className={cn(
                    "h-7 text-xs bg-background rounded border-border/80 flex-1",
                    btnError && "border-destructive focus-visible:ring-destructive/30",
                  )}
                  placeholder="e.g. View, Edit, Auth"
                />
              </FieldRow>
            </div>
          </div>

          {/* Panel 2: Target & Command Configuration */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Settings2 className="size-3.5 text-primary" />
                <span>Target & Parameter Configuration</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Runtime Dispatch</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Target Command Template */}
              <FieldRow
                label="Command Target"
                required
                error={forError?.message}
                enrichText="Command string template executed when clicked, with field placeholder tokens (e.g. ACCOUNT S recordId)."
              >
                <Input
                  value={activeAction.cmdFor}
                  disabled={disabled}
                  onChange={(e) => onUpdateAction(selectedActionIdx, { cmdFor: e.target.value })}
                  className={cn(
                    "h-7 text-xs font-mono bg-background rounded border-border/80 flex-1",
                    forError && "border-destructive focus-visible:ring-destructive/30",
                  )}
                  placeholder={`e.g. ${targetModel || "ACCOUNT"} S recordId`}
                />
              </FieldRow>

              {/* Command Template Guide */}
              <div className="mt-2 p-2.5 rounded bg-muted/20 border border-border/50 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Command Interpolation Syntax:</p>
                <p>
                  Use row field names in the template string (e.g.{" "}
                  <code className="font-mono bg-muted/60 px-1 py-0.5 rounded text-primary border border-primary/20">
                    {targetModel || "ACCOUNT"} S recordId
                  </code>
                  ). When clicked, the runtime replaces each placeholder with the active row's
                  value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

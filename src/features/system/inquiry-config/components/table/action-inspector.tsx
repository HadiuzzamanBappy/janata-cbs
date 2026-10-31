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
  disabled?: boolean;
  validationErrors?: InquiryValidationErrorItem[];
  onUpdateAction: (index: number, patch: Partial<INQCmd>) => void;
  onRemoveAction: (index: number) => void;
}

const ACTION_PRESETS = [
  { label: "View", commandSuffix: "S recordId" },
  { label: "Edit", commandSuffix: "E recordId" },
  { label: "Auth", commandSuffix: "A recordId" },
  { label: "History", commandSuffix: "H recordId" },
  { label: "Print", commandSuffix: "P recordId" },
];

export function ActionInspector({
  activeAction,
  selectedActionIdx,
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
    // Preserve existing target prefix if available
    const existingParts = (activeAction.cmdFor || "").split(" ");
    const prefix = existingParts[0] || "ACCOUNT,1.0.0";
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
            {activeAction.cmdButton || "<UNNAMED_ACTION>"}
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
          {/* Panel 1: Action Identity */}
          <div className="rounded border border-border/80 bg-card/60 p-3 shadow-2xs space-y-2.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground pb-1.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Play className="size-3.5 text-primary" />
                <span>Action Identity</span>
              </div>
              <span className="text-[10px] text-muted-foreground">Button Specification</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Button Display Label */}
              <FieldRow
                label="Button Label"
                required
                error={btnError?.message}
                enrichText="Label text rendered on the row action button or context menu (e.g. View, Edit, Auth)."
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={activeAction.cmdButton}
                    disabled={disabled}
                    onChange={(e) =>
                      onUpdateAction(selectedActionIdx, { cmdButton: e.target.value })
                    }
                    className={cn(
                      "h-7 text-xs bg-background rounded border-border/80 flex-1",
                      btnError && "border-destructive focus-visible:ring-destructive/30",
                    )}
                    placeholder="e.g. View, Edit, Auth"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    {ACTION_PRESETS.map((p) => (
                      <Button
                        key={p.label}
                        type="button"
                        variant={activeAction.cmdButton === p.label ? "default" : "outline"}
                        size="sm"
                        disabled={disabled}
                        onClick={() => handleApplyPreset(p)}
                        className="h-7 px-2 text-xs rounded"
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
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
                enrichText="Command string template executed when clicked, with field placeholder tokens (e.g. ACCOUNT,1.0.0 S recordId)."
              >
                <Input
                  value={activeAction.cmdFor}
                  disabled={disabled}
                  onChange={(e) => onUpdateAction(selectedActionIdx, { cmdFor: e.target.value })}
                  className={cn(
                    "h-7 text-xs font-mono bg-background rounded border-border/80 flex-1",
                    forError && "border-destructive focus-visible:ring-destructive/30",
                  )}
                  placeholder="e.g. ACCOUNT,1.0.0 S recordId"
                />
              </FieldRow>

              {/* Command Template Guide */}
              <div className="mt-2 p-2.5 rounded bg-muted/20 border border-border/50 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Command Interpolation Syntax:</p>
                <p>
                  Use row field names in the template string (e.g.{" "}
                  <code className="font-mono bg-muted/60 px-1 py-0.5 rounded text-primary border border-primary/20">
                    ACCOUNT,1.0.0 S recordId
                  </code>
                  ). When clicked, the runtime engine replaces each placeholder with the active
                  row's value.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

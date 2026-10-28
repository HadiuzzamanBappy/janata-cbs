"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { INQCmd } from "@/lib/data-schemas/inquiry-config-schema";

export interface ActionInspectorProps {
  activeAction?: INQCmd;
  selectedActionIdx: number;
  disabled?: boolean;
  onUpdateAction: (index: number, patch: Partial<INQCmd>) => void;
  onRemoveAction: (index: number) => void;
}

export function ActionInspector({
  activeAction,
  selectedActionIdx,
  disabled = false,
  onUpdateAction,
  onRemoveAction,
}: ActionInspectorProps) {
  if (!activeAction) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground select-none">
        <p className="text-xs font-mono">
          Select an action from the left to inspect its command definition.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      {/* Inspector Header */}
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Action Inspector:
          </span>
          <span className="text-xs font-bold text-foreground">{activeAction.cmdButton}</span>
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

      {/* Inspector Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-3 text-xs max-w-xl">
          {/* Button Display Label */}
          <div className="flex items-center gap-2">
            <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Button Label :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <Input
              value={activeAction.cmdButton}
              disabled={disabled}
              onChange={(e) => onUpdateAction(selectedActionIdx, { cmdButton: e.target.value })}
              className="h-7 text-xs bg-background rounded border-border/80 flex-1"
              placeholder="e.g. View, Edit, Auth"
            />
          </div>

          {/* Target Command Template */}
          <div className="flex items-center gap-2">
            <Label className="w-32 shrink-0 text-muted-foreground font-mono text-[11px] select-none">
              Command Target :
            </Label>
            <span className="text-muted-foreground/60 font-mono text-xs shrink-0">:</span>
            <Input
              value={activeAction.cmdFor}
              disabled={disabled}
              onChange={(e) => onUpdateAction(selectedActionIdx, { cmdFor: e.target.value })}
              className="h-7 text-xs font-mono bg-background rounded border-border/80 flex-1"
              placeholder="e.g. ACCOUNT,1.0.0 S recordId"
            />
          </div>

          {/* Command Template Guide */}
          <div className="pt-2 border-t border-border/30 text-[11px] text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Command Interpolation Syntax:</p>
            <p>
              Use row field names in the template string (e.g.{" "}
              <code className="font-mono bg-muted px-1 py-0.5 rounded text-primary">
                ACCOUNT,1.0.0 S recordId
              </code>
              ). When clicked, the runtime engine replaces{" "}
              <code className="font-mono text-foreground">recordId</code> with the selected row's
              actual value before execution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

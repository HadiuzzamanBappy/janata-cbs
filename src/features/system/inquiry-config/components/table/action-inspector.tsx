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
      <div className="flex-1 flex items-center justify-center p-8 text-xs text-muted-foreground">
        Select an action command to inspect its parameters.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background/50">
      <div className="h-10 px-3 border-b border-border/70 flex items-center justify-between shrink-0 bg-muted/20">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Command Inspector:
          </span>
          <span className="text-xs font-bold text-foreground">
            {activeAction.cmdButton || "Action"}
          </span>
        </div>

        {!disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveAction(selectedActionIdx)}
            className="h-7 px-2 text-destructive hover:bg-destructive/10 text-xs gap-1"
          >
            <Trash2 className="size-3.5" />
            <span>Delete Action</span>
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1">
          <Label className="text-xs">Button Label</Label>
          <Input
            value={activeAction.cmdButton}
            disabled={disabled}
            onChange={(e) => onUpdateAction(selectedActionIdx, { cmdButton: e.target.value })}
            className="h-8 text-xs font-semibold"
            placeholder="e.g. View, Edit, Authorize"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">CBS Command Template (cmdFor)</Label>
          <Input
            value={activeAction.cmdFor}
            disabled={disabled}
            onChange={(e) => onUpdateAction(selectedActionIdx, { cmdFor: e.target.value })}
            className="h-8 text-xs font-mono"
            placeholder="e.g. USER.MGT,NEW1 A recordId"
          />
          <p className="text-[11px] text-muted-foreground pt-1">
            Specify the command code, version, and record function. Tokens matching column names
            (e.g. <span className="font-mono text-primary">recordId</span>) are automatically substituted
            with row values at runtime.
          </p>
        </div>
      </div>
    </div>
  );
}

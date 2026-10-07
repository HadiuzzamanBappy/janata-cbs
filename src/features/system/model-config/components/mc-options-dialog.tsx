"use client";

import { ListPlus, X } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ModelProperty } from "../types";

interface McOptionsDialogProps {
  property?: ModelProperty;
  isReadOnly: boolean;
  onSave: (options: string[]) => void;
  onClose: () => void;
}

export function McOptionsDialog({
  property,
  isReadOnly,
  onSave,
  onClose,
}: McOptionsDialogProps) {
  const [optionsText, setOptionsText] = React.useState(
    (property?.options || []).join("\n"),
  );

  if (!property) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50 duration-100">
      <div className="w-full max-w-md rounded border border-border/80 bg-card p-3.5 shadow-xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between border-b border-border/70 pb-2">
          <div className="flex items-center gap-2">
            <div className="size-5 rounded bg-primary/10 text-primary flex items-center justify-center">
              <ListPlus className="size-3" />
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {property.name}
              </h3>
              <p className="text-[10px] text-muted-foreground font-mono">Options & Enum Values</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="font-mono text-[10px] rounded h-5">
              {property.type}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-6 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          Enter one option per line for dropdown selections and validators:
        </p>

        <textarea
          rows={6}
          value={optionsText}
          disabled={isReadOnly}
          onChange={(e) => setOptionsText(e.target.value)}
          placeholder="Option 1&#10;Option 2&#10;Option 3"
          className="w-full rounded border border-border/80 bg-background p-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
        />

        <div className="flex items-center justify-between pt-2 border-t border-border/70">
          <span className="text-[11px] text-muted-foreground font-mono">
            {optionsText.split("\n").filter((s) => s.trim().length > 0).length} items defined
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-7 text-xs rounded border-border/80"
            >
              Cancel
            </Button>
            {!isReadOnly && (
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const list = optionsText
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean);
                  onSave(list);
                }}
                className="h-7 text-xs rounded shadow-xs"
              >
                Save Options
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

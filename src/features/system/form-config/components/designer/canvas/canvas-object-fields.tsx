/**
 * @fileoverview Inner fields of an object group, listed inside its canvas card. Each inner field
 * is selected and configured like any other field (inspector: label, widget, width, rules),
 * reordered within the group, or removed (the palette can put it back).
 *
 * @module features/system/form-config/components/designer/canvas/canvas-object-fields
 */

"use client";

import { ChevronDown, ChevronUp, CornerDownRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormElement } from "@/lib/data-schemas";
import { useOptionalDesignerContext } from "../context/designer-context";

export interface CanvasObjectFieldsProps {
  parent: FormElement;
  sectionId: string;
  disabled?: boolean;
}

const idOf = (f: FormElement) => String(f.SN || f.NAME);

export function CanvasObjectFields({ parent, sectionId, disabled }: CanvasObjectFieldsProps) {
  const ctx = useOptionalDesignerContext();
  const inner = parent.PROP ?? [];
  if (!ctx || inner.length === 0) return null;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= inner.length) return;
    const next = [...inner];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    ctx.onUpdateField(idOf(parent), { PROP: next });
  };

  return (
    <div className="mt-1.5 ml-4 space-y-1 border-l border-border/60 pl-2">
      {inner.map((child, idx) => {
        const childId = idOf(child);
        const isSelected = ctx.selectedFieldId === childId;
        const errorCount = ctx.getFieldErrors(childId).length;
        return (
          <div
            key={childId}
            className={cn(
              "flex items-center gap-1 rounded border px-1.5 py-1 text-2xs bg-background/70",
              isSelected
                ? "border-primary ring-1 ring-primary/40 bg-primary/10"
                : errorCount > 0
                  ? "border-destructive/60 bg-destructive/5"
                  : "border-border/60 hover:border-primary/50",
            )}
          >
            <CornerDownRight className="size-3 text-muted-foreground/60 shrink-0" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                ctx.handleCanvasSelectField(sectionId, childId);
              }}
              className="min-w-0 flex-1 flex items-center gap-1.5 text-left cursor-pointer"
              title={`Configure ${child.LABEL || child.NAME}`}
            >
              <span className="font-medium text-foreground truncate">
                {child.LABEL || child.NAME}
              </span>
              {child.REQUIRED && <span className="text-destructive font-bold shrink-0">*</span>}
              <span className="font-mono text-3xs text-muted-foreground truncate">
                {child.NAME}
              </span>
              {child.WIDGET && (
                <Badge
                  variant="outline"
                  className="text-3xs h-3.5 px-1 font-mono uppercase shrink-0"
                >
                  {child.WIDGET}
                </Badge>
              )}
            </button>
            {!disabled && (
              <div className="flex items-center shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={idx === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    move(idx, idx - 1);
                  }}
                  className="size-5 p-0 text-muted-foreground/60 hover:text-foreground rounded cursor-pointer"
                  title="Move up"
                >
                  <ChevronUp className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={idx === inner.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    move(idx, idx + 1);
                  }}
                  className="size-5 p-0 text-muted-foreground/60 hover:text-foreground rounded cursor-pointer"
                  title="Move down"
                >
                  <ChevronDown className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={inner.length === 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    ctx.onRemoveField(childId);
                  }}
                  className="size-5 p-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                  title={
                    inner.length === 1
                      ? "An object group keeps at least one field"
                      : `Remove ${child.LABEL || child.NAME} from the group`
                  }
                >
                  <Minus className="size-3.5 stroke-[2.5]" />
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

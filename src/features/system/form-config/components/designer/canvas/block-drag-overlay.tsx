"use client";

import { DragOverlay } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";

export interface BlockDragOverlayProps {
  activeDragItem: {
    type: "field" | "section";
    data: FormElement | FormSection;
  } | null;
}

/**
 * Floating drag preview when moving blocks (Fields or Containers) across the canvas.
 */
export function BlockDragOverlay({ activeDragItem }: BlockDragOverlayProps) {
  if (!activeDragItem) return null;

  return (
    <DragOverlay>
      {activeDragItem.type === "field" ? (
        <div className="rounded-md border px-2.5 py-1.5 flex items-center justify-between text-xs bg-card shadow-2xl ring-2 ring-primary border-primary min-w-44 select-none">
          <span className="font-semibold text-foreground truncate">
            {(activeDragItem.data as FormElement).LABEL ||
              (activeDragItem.data as FormElement).NAME}
          </span>
          <Badge variant="outline" className="text-[9px] h-3.5 px-1 uppercase ml-2 font-mono">
            {(activeDragItem.data as FormElement).TYPE}
          </Badge>
        </div>
      ) : activeDragItem.type === "section" ? (
        <div className="rounded-lg border p-2.5 bg-card shadow-2xl ring-2 ring-primary border-primary text-xs font-semibold uppercase min-w-56 select-none flex items-center justify-between">
          <span className="truncate">
            {(activeDragItem.data as FormSection).title || "Container"}
          </span>
          <Badge variant="outline" className="text-[9px] h-3.5 px-1 uppercase font-mono">
            {(activeDragItem.data as FormSection).containerType || "Card"}
          </Badge>
        </div>
      ) : null}
    </DragOverlay>
  );
}

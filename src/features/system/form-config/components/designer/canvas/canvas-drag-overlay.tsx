"use client";

import { DragOverlay } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import type { FormSection } from "@/lib/data-schemas/form-config-schema";
import type { FormElement } from "@/lib/data-schemas/form-engine-schema";

export interface CanvasDragOverlayProps {
  activeDragItem: {
    type: "field" | "section";
    data: FormElement | FormSection;
  } | null;
}

/**
 * Renders the floating drag avatar/ghost preview when dragging
 * a field or section card on the designer canvas.
 */
export function CanvasDragOverlay({ activeDragItem }: CanvasDragOverlayProps) {
  if (!activeDragItem) return null;

  return (
    <DragOverlay>
      {activeDragItem.type === "field" ? (
        <div className="rounded border px-2.5 py-1.5 flex items-center justify-between text-xs bg-card shadow-2xl ring-2 ring-primary border-primary min-w-44 select-none">
          <span className="font-semibold text-foreground truncate">
            {(activeDragItem.data as FormElement).LABEL ||
              (activeDragItem.data as FormElement).NAME}
          </span>
          <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase ml-2 font-mono">
            {(activeDragItem.data as FormElement).TYPE}
          </Badge>
        </div>
      ) : activeDragItem.type === "section" ? (
        <div className="rounded border p-3 bg-card shadow-2xl ring-2 ring-primary border-primary text-xs font-semibold uppercase min-w-56 select-none flex items-center justify-between">
          <span>{(activeDragItem.data as FormSection).title || "Section"}</span>
          <Badge variant="outline" className="text-[9px] h-4 px-1 uppercase font-mono">
            {(activeDragItem.data as FormSection).containerType || "Card"}
          </Badge>
        </div>
      ) : null}
    </DragOverlay>
  );
}

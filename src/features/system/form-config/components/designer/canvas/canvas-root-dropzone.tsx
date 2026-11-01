"use client";

import { useDroppable } from "@dnd-kit/core";
import * as React from "react";
import { cn } from "@/lib/core-utils";

export interface CanvasRootDropzoneProps {
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
  ) => void;
  disabled?: boolean;
}

export function CanvasRootDropzone({
  onDropPaletteItem,
  onConvertSectionZone,
  disabled,
}: CanvasRootDropzoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-root-zone",
    data: { type: "canvas-root" },
    disabled,
  });

  const [isNativeOver, setIsNativeOver] = React.useState(false);
  const show = isOver || isNativeOver;

  return (
    <section
      aria-label="Root canvas drop target"
      ref={setNodeRef}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsNativeOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsNativeOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsNativeOver(false);
        if (disabled) return;
        try {
          const dataStr = e.dataTransfer.getData("application/json");
          if (dataStr) {
            const parsed = JSON.parse(dataStr);
            if (parsed.type === "canvas-tab" && parsed.sectionId && onConvertSectionZone) {
              onConvertSectionZone(parsed.sectionId, "standard");
              return;
            }
            if (onDropPaletteItem) {
              onDropPaletteItem(parsed);
            }
          }
        } catch {
          /* ignore */
        }
      }}
      className={cn(
        "transition-all flex items-center justify-center text-xs text-muted-foreground/60",
        show
          ? "min-h-12 rounded-lg border-2 border-dashed border-primary bg-primary/10 text-primary font-medium my-2"
          : "h-0 my-0 border-0 opacity-0 overflow-hidden pointer-events-none",
      )}
    >
      {show && <span>↓ Drop directly onto root canvas</span>}
    </section>
  );
}

"use client";

import { useDroppable } from "@dnd-kit/core";
import * as React from "react";
import { cn } from "@/lib/core-utils";

export interface BetweenBlockDropZoneProps {
  id: string;
  gapIndex: number;
  isActive: boolean;
  onDropPaletteItem?: (payload: unknown, targetSectionId?: string, insertIndex?: number) => void;
  onConvertSectionZone?: (
    sectionId: string,
    targetZone: "standard" | "tab",
    opts?: { tabGroupId?: string; tabTitle?: string },
  ) => void;
  disabled?: boolean;
}

export function BetweenBlockDropZone({
  id,
  gapIndex,
  isActive,
  onDropPaletteItem,
  onConvertSectionZone,
  disabled,
}: BetweenBlockDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "between-block-gap", gapId: id, gapIndex },
    disabled,
  });

  const [isNativeOver, setIsNativeOver] = React.useState(false);

  React.useEffect(() => {
    const handleDragReset = () => setIsNativeOver(false);
    window.addEventListener("dragend", handleDragReset);
    window.addEventListener("drop", handleDragReset);
    return () => {
      window.removeEventListener("dragend", handleDragReset);
      window.removeEventListener("drop", handleDragReset);
    };
  }, []);

  const isHighlighted = isOver || isNativeOver;
  const showIndicator = isActive || isNativeOver;

  return (
    <section
      aria-label={`Drop gap ${gapIndex}`}
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
              onDropPaletteItem(parsed, undefined, gapIndex);
            }
          }
        } catch {
          /* ignore */
        }
      }}
      className={cn(
        "transition-all rounded mx-0.5 relative flex items-center justify-center",
        showIndicator
          ? isHighlighted
            ? "h-8 mb-2 bg-primary/15 border-2 border-dashed border-primary"
            : "h-3 mb-1.5 border border-dashed border-border/50 hover:border-primary/50"
          : "h-0 my-0 border-0 opacity-0 overflow-hidden pointer-events-none",
      )}
    >
      {isHighlighted && (
        <span className="text-[10px] font-semibold text-primary select-none">
          + Place item here
        </span>
      )}
    </section>
  );
}

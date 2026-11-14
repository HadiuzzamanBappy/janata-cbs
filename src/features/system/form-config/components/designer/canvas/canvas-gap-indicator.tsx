"use client";

import { useDroppable } from "@dnd-kit/core";
import * as React from "react";
import { cn } from "@/lib/core-utils";
import { useGlobalDragReset } from "./canvas-chrome";

export interface CanvasGapIndicatorProps {
  id: string;
  gapIndex: number;
  isActive?: boolean;
  onDropItem?: (payload: unknown, insertIndex: number) => void;
  disabled?: boolean;
}

export type InsertionIndicatorProps = CanvasGapIndicatorProps;

/**
 * Universal Canvas Gap Indicator.
 * Renders a collapsed drop zone that expands into an active placement guide
 * line when an item (variable, card, tab) is dragged over the gap or when
 * the pointer position in the canvas targets this slot.
 */
export function CanvasGapIndicator({
  id,
  gapIndex,
  isActive,
  onDropItem,
  disabled,
}: CanvasGapIndicatorProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "between-block-gap", gapId: id, gapIndex },
    disabled,
  });

  const [isNativeOver, setIsNativeOver] = React.useState(false);

  useGlobalDragReset(React.useCallback(() => setIsNativeOver(false), []));

  const isHighlighted = (isOver || isNativeOver || isActive) && !disabled;

  const handleNativeDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsNativeOver(true);
  };

  const handleNativeDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isNativeOver) setIsNativeOver(true);
  };

  const handleNativeDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsNativeOver(false);
    }
  };

  const handleNativeDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsNativeOver(false);
    if (disabled || !onDropItem) return;

    try {
      const dataStr = e.dataTransfer.getData("application/json");
      if (dataStr) {
        onDropItem(JSON.parse(dataStr), gapIndex);
      }
    } catch {
      /* ignore invalid json */
    }
  };

  return (
    <section
      ref={setNodeRef}
      data-canvas-gap="true"
      data-gap-index={gapIndex}
      onDragEnter={handleNativeDragEnter}
      onDragOver={handleNativeDragOver}
      onDragLeave={handleNativeDragLeave}
      onDrop={handleNativeDrop}
      aria-label={`Insert at position ${gapIndex}`}
      className={cn(
        "w-full transition-all duration-150 flex items-center justify-center relative select-none",
        isHighlighted ? "h-6 my-1" : gapIndex === 0 ? "h-0.5 my-0" : "h-1.5 my-0",
      )}
    >
      <div
        className={cn(
          "w-full rounded-full transition-all duration-150 relative flex items-center justify-center",
          isHighlighted
            ? "h-1 bg-primary ring-2 ring-primary/30 shadow-xs"
            : "h-px bg-transparent hover:bg-border/40",
        )}
      >
        {isHighlighted && (
          <span className="absolute bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs tracking-tight pointer-events-none">
            + Insert here
          </span>
        )}
      </div>
    </section>
  );
}

export { CanvasGapIndicator as InsertionIndicator };

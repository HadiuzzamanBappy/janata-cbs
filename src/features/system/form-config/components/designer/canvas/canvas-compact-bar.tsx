"use client";

import { LayoutGrid, PanelLeft, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";

export interface CanvasCompactBarProps {
  sectionsCount: number;
  totalFieldsCount: number;
  isPaletteOpen: boolean;
  isInspectorOpen: boolean;
  hasSelection: boolean;
  onTogglePalette?: () => void;
  onToggleInspector?: () => void;
}

/**
 * Compact Viewport Responsive Toolbar for Canvas (Tablet/Mobile).
 * Allows toggling Left Palette and Right Inspector drawers.
 */
export function CanvasCompactBar({
  sectionsCount,
  totalFieldsCount,
  isPaletteOpen,
  isInspectorOpen,
  hasSelection,
  onTogglePalette,
  onToggleInspector,
}: CanvasCompactBarProps) {
  return (
    <div className="px-3 py-1.5 border-b border-border/70 bg-card/60 flex items-center justify-between shrink-0 gap-2 z-10">
      <Button
        type="button"
        variant={isPaletteOpen ? "secondary" : "outline"}
        size="sm"
        onClick={onTogglePalette}
        className={cn(
          "h-7 text-xs px-2.5 gap-1.5 cursor-pointer font-medium",
          isPaletteOpen && "bg-primary/15 text-primary border-primary/40",
        )}
        title="Toggle Palette (Variables & Containers)"
      >
        <PanelLeft className="size-3.5 text-primary" />
        <span className="hidden xs:inline">Palette</span>
      </Button>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
        <LayoutGrid className="size-3.5 text-muted-foreground/70" />
        <span className="font-semibold text-foreground text-xs">Canvas</span>
        <span className="text-[11px] font-mono opacity-80">
          ({sectionsCount} {sectionsCount === 1 ? "sec" : "secs"}, {totalFieldsCount}{" "}
          {totalFieldsCount === 1 ? "field" : "fields"})
        </span>
      </div>

      <Button
        type="button"
        variant={isInspectorOpen ? "secondary" : "outline"}
        size="sm"
        onClick={onToggleInspector}
        className={cn(
          "h-7 text-xs px-2.5 gap-1.5 cursor-pointer font-medium",
          hasSelection && "border-cyan-500/50 text-cyan-400",
          isInspectorOpen && "bg-primary/15 text-primary border-primary/40",
        )}
        title="Toggle Property Inspector"
      >
        <SlidersHorizontal className="size-3.5" />
        <span className="hidden xs:inline">Inspector</span>
        {hasSelection && <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />}
      </Button>
    </div>
  );
}

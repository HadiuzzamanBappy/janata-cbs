/**
 * @fileoverview Chrome presentation elements and floating overlays for CBS Form Designer Canvas.
 * Bundles Compact Toolbar, Empty State Splash, Drag Overlay Preview, and Drag Reset Hook.
 *
 * @module features/system/form-config/components/designer/canvas/canvas-chrome
 */

"use client";

import { DragOverlay } from "@dnd-kit/core";
import { Folder, LayoutGrid, PanelLeft, SlidersHorizontal } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { FormElement, FormSection } from "@/lib/data-schemas/form-engine-schema";
import { useDesignerContext } from "../context/designer-context";
import type { DesignerCanvasProps } from "./canvas-types";

// ============================================================================
// 1. GLOBAL DRAG RESET HOOK (Centralizes window dragend/drop listeners)
// ============================================================================

/**
 * Shared hook to safely reset drag hover states when a drag operation ends or cancels.
 */
export function useGlobalDragReset(onReset: () => void) {
  React.useEffect(() => {
    window.addEventListener("dragend", onReset);
    window.addEventListener("drop", onReset);
    return () => {
      window.removeEventListener("dragend", onReset);
      window.removeEventListener("drop", onReset);
    };
  }, [onReset]);
}

// ============================================================================
// 2. COMPACT TOOLBAR (Mobile/Tablet drawer controls)
// ============================================================================

export interface CanvasCompactBarProps {
  sectionsCount?: number;
  totalFieldsCount?: number;
  isPaletteOpen?: boolean;
  isInspectorOpen?: boolean;
  hasSelection?: boolean;
  onTogglePalette?: () => void;
  onToggleInspector?: () => void;
}

/**
 * Compact Viewport Responsive Toolbar for Canvas (Tablet/Mobile).
 * Allows toggling Left Palette and Right Inspector drawers.
 */
export function CanvasCompactBar(props: CanvasCompactBarProps = {}) {
  const context = useDesignerContext();
  const sectionsCount = props.sectionsCount ?? context.sections.length;
  const totalFieldsCount =
    props.totalFieldsCount ?? context.sections.reduce((acc, s) => acc + (s.fields?.length || 0), 0);
  const isPaletteOpen = props.isPaletteOpen ?? context.isPaletteOpen;
  const isInspectorOpen = props.isInspectorOpen ?? context.isInspectorOpen;
  const hasSelection = props.hasSelection ?? context.hasSelection;
  const onTogglePalette = props.onTogglePalette ?? context.togglePalette;
  const onToggleInspector = props.onToggleInspector ?? context.toggleInspector;

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
          hasSelection && "border-primary/50 text-primary",
          isInspectorOpen && "bg-primary/15 text-primary border-primary/40",
        )}
        title="Toggle Property Inspector"
      >
        <SlidersHorizontal className="size-3.5" />
        <span className="hidden xs:inline">Inspector</span>
        {hasSelection && <span className="size-1.5 rounded-full bg-primary animate-pulse" />}
      </Button>
    </div>
  );
}

// ============================================================================
// 3. EMPTY CANVAS SPLASH (Zero-state onboarding)
// ============================================================================

export interface EmptyCanvasSplashProps {
  isOver: boolean;
  onAddSection?: DesignerCanvasProps["onAddSection"];
  onClickBackground?: () => void;
  onDragOver: React.DragEventHandler;
  onDragLeave: React.DragEventHandler;
  onDrop: React.DragEventHandler;
  disabled?: boolean;
}

export function EmptyCanvasSplash(props: EmptyCanvasSplashProps) {
  const context = useDesignerContext();
  const { isOver, onDragOver, onDragLeave, onDrop } = props;
  const onAddSection = props.onAddSection ?? context.onAddSection;
  const disabled = props.disabled ?? context.disabled;

  return (
    <section
      aria-label="Empty canvas workspace"
      className={cn(
        "flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-xl m-4 transition-all bg-transparent",
        isOver
          ? "border-primary bg-primary/10 text-primary scale-[1.01]"
          : "border-border/60 bg-muted/5",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
        <Folder className="size-6 text-muted-foreground/60" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">Canvas is Empty</h4>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
        Drag variables or containers here, or click any variable on the left to add directly.
      </p>

      {!disabled && onAddSection && (
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-md mt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddSection("card", [], "Card Section")}
            className="h-8 text-xs bg-background shadow-xs hover:border-primary/50"
          >
            + Card Container
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddSection("tab", [], "Tab 1", undefined, "Tab 1")}
            className="h-8 text-xs bg-background shadow-xs hover:border-primary/50"
          >
            + Tab Group
          </Button>
        </div>
      )}
    </section>
  );
}

// ============================================================================
// 4. BLOCK DRAG OVERLAY (Ghost preview during sorting)
// ============================================================================

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

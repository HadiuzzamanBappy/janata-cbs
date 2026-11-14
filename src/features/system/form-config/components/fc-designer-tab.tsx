"use client";

import { useContainerWidth } from "@/hooks";
import { cn } from "@/lib/core-utils";
import { DesignerProvider, useDesignerContext } from "./designer/context/designer-context";
import type { DesignerProviderProps } from "./designer/context/designer-context-types";
import { DesignerCanvas } from "./designer/designer-canvas";
import { FieldPalette } from "./designer/field-palette";
import { PropertyInspector } from "./designer/property-inspector";

export type FcDesignerTabProps = Omit<DesignerProviderProps, "children" | "isCompact">;

/**
 * Visual Form Designer Tab.
 * Clean, modular 3-pane workbench (Palette | Canvas | Inspector) adhering to <=150 lines.
 */
export function FcDesignerTab(props: FcDesignerTabProps) {
  const { ref: containerRef, isCompact } = useContainerWidth<HTMLDivElement>(960);

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col h-full w-full bg-background overflow-hidden"
    >
      <DesignerProvider {...props} isCompact={isCompact}>
        <DesignerWorkbenchLayout />
      </DesignerProvider>
    </div>
  );
}

/**
 * Internal 3-Pane Workbench Layout consuming scoped DesignerContext.
 */
function DesignerWorkbenchLayout() {
  const {
    isCompact,
    isPaletteOpen,
    isInspectorOpen,
    setIsPaletteOpen,
    setIsInspectorOpen,
    closeDrawers,
  } = useDesignerContext();

  return (
    <>
      {/* Backdrop for Left Palette Drawer on compact screens */}
      {isCompact && isPaletteOpen && (
        <div
          className="absolute inset-0 bg-black/40 z-30 backdrop-blur-xs transition-opacity"
          onClick={closeDrawers}
          aria-hidden="true"
        />
      )}

      {/* Backdrop for Right Inspector Drawer on compact screens */}
      {isCompact && isInspectorOpen && (
        <div
          className="absolute inset-0 bg-black/40 z-30 backdrop-blur-xs transition-opacity"
          onClick={closeDrawers}
          aria-hidden="true"
        />
      )}

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* 1. Left: Palette (Side-panel on desktop, Drawer on compact) */}
        {isCompact ? (
          <div
            className={cn(
              "absolute inset-y-0 left-0 z-40 w-72 sm:w-80 shadow-2xl transition-transform duration-200 ease-in-out bg-card",
              isPaletteOpen ? "translate-x-0" : "-translate-x-full pointer-events-none",
            )}
          >
            <FieldPalette
              onClose={() => setIsPaletteOpen(false)}
              className="w-full h-full border-r border-border"
            />
          </div>
        ) : (
          <FieldPalette />
        )}

        {/* 2. Center: Canvas */}
        <DesignerCanvas />

        {/* 3. Right: Property Inspector (Side-panel on desktop, Drawer on compact) */}
        {isCompact ? (
          <div
            className={cn(
              "absolute inset-y-0 right-0 z-40 w-72 sm:w-80 shadow-2xl transition-transform duration-200 ease-in-out bg-card",
              isInspectorOpen ? "translate-x-0" : "translate-x-full pointer-events-none",
            )}
          >
            <PropertyInspector
              onClose={() => setIsInspectorOpen(false)}
              className="w-full h-full border-l border-border"
            />
          </div>
        ) : (
          <PropertyInspector />
        )}
      </div>
    </>
  );
}

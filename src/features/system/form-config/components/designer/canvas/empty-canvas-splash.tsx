"use client";

import { Folder } from "lucide-react";
import type * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/core-utils";
import type { DesignerCanvasProps } from "./canvas-types";

export interface EmptyCanvasSplashProps {
  isOver: boolean;
  onAddSection?: DesignerCanvasProps["onAddSection"];
  onClickBackground?: () => void;
  onDragOver: React.DragEventHandler;
  onDragLeave: React.DragEventHandler;
  onDrop: React.DragEventHandler;
  disabled?: boolean;
}

export function EmptyCanvasSplash({
  isOver,
  onAddSection,
  onDragOver,
  onDragLeave,
  onDrop,
  disabled,
}: EmptyCanvasSplashProps) {
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
            onClick={() => onAddSection("standard", "standard", [], "card", "Card Section")}
            className="h-8 text-xs bg-background shadow-xs hover:border-emerald-500/50"
          >
            + Card Container
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddSection("standard", "tab", [], "card", "Tab 1", undefined, "Tab 1")}
            className="h-8 text-xs bg-background shadow-xs hover:border-sky-500/50"
          >
            + Tab Group
          </Button>
        </div>
      )}
    </section>
  );
}

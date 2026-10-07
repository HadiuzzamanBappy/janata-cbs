"use client";

import { Layers } from "lucide-react";

export interface CbsIdleStateProps {
  title: string;
  code: string;
  customMessage?: string;
}

/**
 * Standard CBS IDLE state card.
 * Displays dashed boundary, subtle primary layer emblem, and operational directions.
 */
export function CbsIdleState({ title, code, customMessage }: CbsIdleStateProps) {
  return (
    <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10 select-none animate-in fade-in-50">
      <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Layers className="size-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        {title} ({code})
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1">
        {customMessage || (
          <>
            Select an action from the top toolbar to begin. Use <strong>+</strong> to create a new
            entry, or enter / search a <strong>Record ID</strong> to view or edit existing records.
          </>
        )}
      </p>
    </div>
  );
}

"use client";

import { Layers } from "lucide-react";

export interface CbsIdleStateProps {
  title: string;
  code?: string;
  customMessage?: string;
  className?: string;
}

/**
 * Standard CBS IDLE state card.
 * Displays dashed boundary, subtle primary layer emblem, and operational directions.
 */
export function CbsIdleState({ title, code, customMessage, className = "" }: CbsIdleStateProps) {
  return (
    <div
      className={`w-full h-full min-h-75 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-md p-8 text-center bg-muted/10 select-none animate-in fade-in-50 ${className}`}
    >
      <div className="size-11 rounded-md border border-border/60 bg-muted/50 text-primary flex items-center justify-center mb-3 shadow-2xs">
        <Layers className="size-5.5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
        <span>{title}</span>
        {code && (
          <span className="text-[11px] font-mono text-muted-foreground font-normal">[{code}]</span>
        )}
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

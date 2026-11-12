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
 * Minimal layout with simple title, short clean description, and primary layer emblem.
 */
export function CbsIdleState({ title, customMessage, className = "" }: CbsIdleStateProps) {
  return (
    <div
      className={`w-full h-full min-h-75 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-md p-8 text-center bg-muted/10 select-none animate-in fade-in-50 ${className}`}
    >
      <div className="size-11 rounded-md border border-border/60 bg-muted/50 text-primary flex items-center justify-center mb-3 shadow-2xs">
        <Layers className="size-5.5" />
      </div>
      <div className="flex flex-col gap-1 max-w-sm">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {customMessage || "Enter or select a record to view or edit"}
        </p>
      </div>
    </div>
  );
}

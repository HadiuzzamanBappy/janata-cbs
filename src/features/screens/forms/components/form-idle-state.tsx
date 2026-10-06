import { Layers } from "lucide-react";

export interface FormIdleStateProps {
  title: string;
  code: string;
}

/**
 * Standard Temenos T24 CBS IDLE state card.
 * Displays dashed boundary, subtle primary layer emblem, and operational directions.
 */
export function FormIdleState({ title, code }: FormIdleStateProps) {
  return (
    <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10 select-none animate-in fade-in-50">
      <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
        <Layers className="size-6" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        {title} ({code})
      </h3>
      <p className="text-xs text-muted-foreground max-w-sm mt-1">
        Select an action from the top toolbar to begin. Use <strong>+</strong> to create a new
        entry, or enter / search a <strong>Record ID</strong> to view or edit existing records.
      </p>
    </div>
  );
}

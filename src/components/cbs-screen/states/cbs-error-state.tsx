"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CbsErrorStateProps {
  title?: string;
  message?: string;
  command?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Standard CBS Unified Error State Card.
 * Consistent layout, typography, icon styling, and retry button across all CBS screens.
 */
export function CbsErrorState({
  title = "Failed to Load Command Schema",
  message,
  command,
  onRetry,
  className,
}: CbsErrorStateProps) {
  const displayMessage =
    message ||
    (command ? `No schema or contract found for "${command}"` : "Unable to load screen metadata");

  return (
    <div className={`w-full h-full p-4 flex flex-col flex-1 ${className || ""}`}>
      <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-destructive/40 rounded-md p-8 text-center bg-destructive/5 select-none animate-in fade-in-50">
        <div className="size-11 rounded-md border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-center mb-3 shadow-2xs">
          <AlertTriangle className="size-5.5" />
        </div>
        <div className="flex flex-col gap-1 max-w-sm mb-3">
          <h3 className="text-sm font-semibold tracking-tight text-destructive">{title}</h3>
          <p className="text-xs text-muted-foreground font-mono leading-relaxed">
            {displayMessage}
          </p>
        </div>
        {onRetry && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="text-xs h-7 px-2.5 gap-1.5"
          >
            <RefreshCw className="size-3" />
            <span>Retry</span>
          </Button>
        )}
      </div>
    </div>
  );
}

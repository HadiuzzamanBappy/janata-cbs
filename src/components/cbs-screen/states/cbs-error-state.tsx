"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
    <div
      className={`p-6 max-w-md mx-auto my-auto flex flex-col items-center justify-center w-full ${className || ""}`}
    >
      <Alert variant="destructive" className="w-full shadow-xs">
        <AlertTriangle className="size-4" />
        <AlertTitle className="text-xs font-semibold">{title}</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-3">
          <p className="text-xs opacity-90 leading-relaxed">{displayMessage}</p>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              className="w-fit text-xs h-7 px-2.5 gap-1.5"
            >
              <RefreshCw className="size-3" />
              <span>Retry</span>
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}

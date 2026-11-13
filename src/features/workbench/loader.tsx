"use client";

import { AlertCircle } from "lucide-react";
import * as React from "react";
import { SystemSkeleton } from "@/components/cbs-screen";
import { FormSkeleton } from "@/features/operations/forms";
import { InquirySkeleton } from "@/features/operations/inquiries";
import { logger } from "@/lib/core-logger";
import { isInquiryCommand, isSystemScreen, resolveScreen } from "./registry";
import type { ScreenLoaderProps } from "./types";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ScreenErrorBoundary extends React.Component<
  { children: React.ReactNode; command: string },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; command: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ScreenLoader] CRASH in "${this.props.command}":`, error, errorInfo);
    logger.error(
      `ScreenLoader error rendering "${this.props.command}": ${error?.message || "Unknown error"}`,
      { message: error?.message, stack: error?.stack, componentStack: errorInfo?.componentStack },
      "SCREEN_LOADER",
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full p-4 flex flex-col flex-1">
          <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-destructive/40 rounded-md p-8 text-center bg-destructive/5 select-none animate-in fade-in-50">
            <div className="size-11 rounded-md border border-destructive/30 bg-destructive/10 text-destructive flex items-center justify-center mb-3 shadow-2xs">
              <AlertCircle className="size-5.5" />
            </div>
            <div className="flex flex-col gap-1 max-w-sm">
              <h3 className="text-sm font-semibold tracking-tight text-destructive">
                Failed to Load Screen
              </h3>
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                {this.state.error?.message || `Render error on "${this.props.command}"`}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Universal Screen Loader mounting the resolved screen within Suspense & ErrorBoundary.
 * Provides individual loading skeletons for System vs Inquiry vs Form screens.
 */
export function ScreenLoader({
  command,
  tabId,
  mode = "panel",
  className = "",
}: ScreenLoaderProps) {
  const ScreenComponent = React.useMemo(() => resolveScreen(command), [command]);

  const FallbackSkeleton = React.useMemo(() => {
    if (isSystemScreen(command)) {
      return <SystemSkeleton />;
    }
    return isInquiryCommand(command) ? <InquirySkeleton /> : <FormSkeleton rowCount={4} />;
  }, [command]);

  return (
    <div
      data-render-mode={mode}
      className={`w-full h-full min-h-0 flex flex-col flex-1 ${className}`}
    >
      <ScreenErrorBoundary command={command}>
        <React.Suspense fallback={FallbackSkeleton}>
          <ScreenComponent command={command} tabId={tabId} />
        </React.Suspense>
      </ScreenErrorBoundary>
    </div>
  );
}

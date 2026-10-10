"use client";

import { AlertCircle } from "lucide-react";
import * as React from "react";
import { FormSkeleton, InquirySkeleton } from "@/features/operations";
import { logger } from "@/lib/core-logger";
import { resolveScreen } from "./registry";
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
    logger.error(
      `ScreenLoader error rendering "${this.props.command}":`,
      { error, errorInfo },
      "SCREEN_LOADER",
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-auto text-center flex flex-col items-center gap-2 bg-destructive/10 rounded-lg border border-destructive/20 max-w-md mx-auto">
          <AlertCircle className="size-6 text-destructive" />
          <h3 className="font-semibold text-xs text-destructive">Failed to Load Screen</h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            {this.state.error?.message || `Render error on "${this.props.command}"`}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Universal Screen Loader mounting the resolved screen within Suspense & ErrorBoundary.
 * Provides individual loading skeletons for Enquiry vs Form screens.
 */
export function ScreenLoader({
  command,
  tabId,
  mode = "panel",
  className = "",
}: ScreenLoaderProps) {
  const ScreenComponent = React.useMemo(() => resolveScreen(command), [command]);

  const FallbackSkeleton = React.useMemo(() => {
    const cleanCmd = (command || "").split(",")[0].trim().toUpperCase();
    const isEnquiry = cleanCmd.startsWith("INQ ") || cleanCmd.startsWith("INQUIRY");

    return isEnquiry ? <InquirySkeleton /> : <FormSkeleton rowCount={4} />;
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

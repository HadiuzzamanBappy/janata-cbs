"use client";

import { AlertCircle } from "lucide-react";
import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ComponentLoaderProps } from "../types";
import { resolveControl } from "./component-registry";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ComponentErrorBoundary extends React.Component<
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
    console.error(
      `ComponentLoader error rendering "${this.props.command}":`,
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 my-auto text-center flex flex-col items-center gap-2 bg-destructive/10 rounded-lg border border-destructive/20 max-w-md mx-auto">
          <AlertCircle className="size-6 text-destructive" />
          <h3 className="font-semibold text-xs text-destructive">
            Failed to Load Control
          </h3>
          <p className="text-[11px] text-muted-foreground font-mono">
            {this.state.error?.message ||
              `Render error on "${this.props.command}"`}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * SINGLE UNIFIED component loader replacing legacy componentLoader, panelLoader, and windowLoader.
 */
export function ComponentLoader({
  command,
  mode = "panel",
  className = "",
}: ComponentLoaderProps) {
  const ControlComponent = React.useMemo(
    () => resolveControl(command),
    [command],
  );

  return (
    <div
      data-render-mode={mode}
      className={`w-full h-full min-h-0 flex flex-col flex-1 ${className}`}
    >
      <ComponentErrorBoundary command={command}>
        <React.Suspense
          fallback={
            <div className="p-6 space-y-4 max-w-3xl mx-auto w-full">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-64 w-full rounded-md" />
            </div>
          }
        >
          <ControlComponent command={command} />
        </React.Suspense>
      </ComponentErrorBoundary>
    </div>
  );
}

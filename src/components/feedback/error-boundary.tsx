"use client";

import { AlertTriangle } from "lucide-react";
import * as React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/core-logger";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error("ErrorBoundary caught an error:", { error, errorInfo }, "UI_ERROR_BOUNDARY");
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
          <Alert variant="destructive" className="max-w-md text-left">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle className="text-xs font-semibold">Something went wrong</AlertTitle>
            <AlertDescription className="mt-1.5 flex flex-col gap-3">
              <p className="text-xs opacity-90 leading-relaxed">
                {this.state.error?.message ||
                  "An unexpected error occurred while rendering this component."}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="w-fit text-xs h-7 px-2.5"
              >
                Try again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

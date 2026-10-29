"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as React from "react";
import { AlertStoreProvider } from "./alert/alert-provider";
import { SessionStoreProvider } from "./session/session-provider";
import { ThemeProvider } from "./theme-provider";
import { WorkbenchStoreProvider } from "./workbench/workbench-provider";

export interface CbsAppStoreProviderProps {
  readonly children: React.ReactNode;
}

/**
 * Universal Master State & Context Provider for Janata CBS Workbench.
 * Encapsulates TanStack Query, Theme, Session, Workbench Tabs, and Alerts in a single root hierarchy.
 */
export function CbsAppStoreProvider({ children }: CbsAppStoreProviderProps) {
  // QueryClient singleton per browser session with banking-grade cache policies
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute in-memory cache
            gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
            refetchOnWindowFocus: false, // Prevent unwanted refetches during banking data entry
            retry: 1, // Single retry before failing gracefully
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SessionStoreProvider>
          <WorkbenchStoreProvider>
            <AlertStoreProvider>{children}</AlertStoreProvider>
          </WorkbenchStoreProvider>
        </SessionStoreProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default CbsAppStoreProvider;

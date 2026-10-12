"use client";

import type * as React from "react";
import { AlertStoreProvider } from "./alert/alert-provider";
import { SessionStoreProvider } from "./session/session-provider";
import { ThemeProvider } from "./theme-provider";
import { WorkbenchStoreProvider } from "./workbench/workbench-provider";

export interface CbsAppStoreProviderProps {
  readonly children: React.ReactNode;
}

/**
 * Universal Master State & Context Provider for Janata CBS Workbench.
 * Encapsulates Theme, Session, Workbench Tabs, and Modal Alerts in a single root hierarchy.
 */
export function CbsAppStoreProvider({ children }: CbsAppStoreProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionStoreProvider>
        <WorkbenchStoreProvider>
          <AlertStoreProvider>{children}</AlertStoreProvider>
        </WorkbenchStoreProvider>
      </SessionStoreProvider>
    </ThemeProvider>
  );
}

export default CbsAppStoreProvider;

"use client";

import type * as React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";
import { AlertStoreProvider, SessionStoreProvider, WorkbenchStoreProvider } from "@/store";
import { AppAlert } from "./app-alert";
import { AppSidebar } from "./app-sidebar";
import { AppTabBar } from "./app-tabbar";
import { AppTimeoutWatcher } from "./app-timeout-watcher";

export function WorkbenchShell({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <SessionStoreProvider>
      <WorkbenchStoreProvider>
        <AlertStoreProvider>
          <SidebarProvider defaultOpen={defaultOpen}>
            <AppSidebar />
            <SidebarInset className="flex flex-col min-w-0 h-screen overflow-hidden">
              {/* TabBar Header Strip */}
              <div className="shrink-0 z-20">
                <AppTabBar />
              </div>

              {/* Main Content Area — fills remaining height, scrolls independently */}
              <main className="flex-1 min-h-0 overflow-auto bg-muted/15">{children}</main>
            </SidebarInset>

            {/* Global UI Overlays */}
            <Toaster />
            <AppAlert />
            <AppTimeoutWatcher />
          </SidebarProvider>
        </AlertStoreProvider>
      </WorkbenchStoreProvider>
    </SessionStoreProvider>
  );
}

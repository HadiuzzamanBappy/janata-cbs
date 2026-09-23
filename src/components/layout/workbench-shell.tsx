"use client";

import type * as React from "react";
import { GlobalAlertSystem } from "@/components/feedback/global-alert-system";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTabBar } from "@/components/layout/app-tabbar";
import { TopBar } from "@/components/layout/app-topbar";
import { AlertStoreProvider } from "@/components/providers/alert-provider";
import { SessionStoreProvider } from "@/components/providers/session-provider";
import { WorkbenchStoreProvider } from "@/components/providers/workbench-provider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";

export function WorkbenchShell({ children }: { children: React.ReactNode }) {
  return (
    <SessionStoreProvider>
      <WorkbenchStoreProvider>
        <AlertStoreProvider>
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <SidebarInset className="flex flex-col min-w-0 h-screen overflow-hidden">
              {/* Sticky TopBar — stays at top on scroll */}
              <div className="sticky top-0 z-20 shrink-0">
                <TopBar />
              </div>

              {/* Sticky TabBar — docked just below TopBar */}
              <div className="sticky top-16 z-10 shrink-0">
                <AppTabBar />
              </div>

              {/* Main Content Area — fills remaining height, scrolls independently */}
              <main className="flex-1 min-h-0 overflow-auto bg-muted/15">
                {children}
              </main>
            </SidebarInset>

            {/* Global UI Overlays */}
            <Toaster />
            <GlobalAlertSystem />
          </SidebarProvider>
        </AlertStoreProvider>
      </WorkbenchStoreProvider>
    </SessionStoreProvider>
  );
}

"use client";

import * as React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";
import { cbsCommand } from "@/lib/cbs-command";
import { AlertStoreProvider, SessionStoreProvider, WorkbenchStoreProvider } from "@/store";
import { AppAlert } from "./app-alert";
import { AppSidebar } from "./app-sidebar";
import { AppTabBar } from "./app-tabbar";
import { AppTargetPreview } from "./app-target-preview";
import { AppTimeoutWatcher } from "./app-timeout-watcher";

export function WorkbenchShell({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  // Global event delegation for data-cbs-command clicks anywhere across the app
  React.useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const trigger = target.closest<HTMLElement>("[data-cbs-command]");
      // If element is already a button or handled by its own synthetic click, allow it,
      // but if it's a plain element or link with data-cbs-command without a direct handler, execute it:
      if (trigger && !trigger.hasAttribute("data-cbs-link-handled")) {
        const cmd = trigger.getAttribute("data-cbs-command");
        if (cmd) {
          const title =
            trigger.getAttribute("data-cbs-label") || trigger.innerText?.slice(0, 40)?.trim();
          cbsCommand.execute(cmd, { title: title || undefined });
        }
      }
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
    };
  }, []);
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
            <AppTargetPreview />
          </SidebarProvider>
        </AlertStoreProvider>
      </WorkbenchStoreProvider>
    </SessionStoreProvider>
  );
}

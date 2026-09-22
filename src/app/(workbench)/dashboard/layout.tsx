"use client";

import type * as React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/app-topbar";
import { AppTabBar } from "@/components/layout/app-tabbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
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

      {/* Floating Toast Notification Container */}
      <Toaster />
    </SidebarProvider>
  );
}

"use client";

import * as React from "react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/app-topbar";
import { TabBar } from "@/components/tab-bar";
import { Toaster } from "@/components/ui/toast";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset className="min-w-0 overflow-hidden">
        {/* Modular TopBar with Branch Roaming & Search */}
        <TopBar />

        {/* Workspace TabBar */}
        <TabBar />

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-4 p-6 overflow-auto bg-muted/15">
          {children}
        </main>
      </SidebarInset>

      {/* Floating Toast Notification Container */}
      <Toaster />
    </SidebarProvider>
  );
}

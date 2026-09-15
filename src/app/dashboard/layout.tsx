"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/app-topbar";
import { TabBar } from "@/components/tab-bar";
import { useAlertStore, AlertMessage } from "@/store/alert-store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

function AlertBanner({ alert, onDismiss }: { alert: AlertMessage; onDismiss: () => void }) {
  const iconMap = {
    success: <CheckCircle2 className="size-4 text-emerald-500" />,
    error: <ShieldAlert className="size-4 text-destructive" />,
    warning: <AlertCircle className="size-4 text-amber-500" />,
    info: <Info className="size-4 text-sky-500" />,
  };

  return (
    <Alert className="relative py-2.5 px-3 flex items-start justify-between shadow-sm border-border/70">
      <div className="flex items-start gap-2.5">
        {iconMap[alert.type]}
        <div>
          {alert.title && <AlertTitle className="text-xs font-semibold">{alert.title}</AlertTitle>}
          <AlertDescription className="text-xs text-muted-foreground">
            {alert.message}
          </AlertDescription>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="size-5 rounded-xs hover:bg-muted text-muted-foreground"
      >
        <X className="size-3" />
      </Button>
    </Alert>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { alerts, dismissAlert } = useAlertStore();

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />
      <SidebarInset>
        {/* Modular TopBar with Branch Roaming & Search */}
        <TopBar />

        {/* Alert Notification Banners */}
        {alerts.length > 0 && (
          <div className="p-3 bg-muted/20 border-b border-border/40 flex flex-col gap-2">
            {alerts.map((alert) => (
              <AlertBanner
                key={alert.id}
                alert={alert}
                onDismiss={() => dismissAlert(alert.id)}
              />
            ))}
          </div>
        )}

        {/* Workspace TabBar */}
        <TabBar />

        {/* Main Content Area */}
        <main className="flex flex-1 flex-col gap-4 p-6 overflow-auto bg-muted/15">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

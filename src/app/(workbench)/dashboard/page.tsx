"use client";

import { Sparkles } from "lucide-react";
import { useWorkbenchStore } from "@/components/providers/workbench-provider";
import { ComponentLoader } from "@/features/workspace";

export default function DashboardPage() {
  const { tabs, activeTabId } = useWorkbenchStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (activeTab) {
    const targetCommand =
      activeTab.screenId || activeTab.componentName || "ACCOUNT";
    return (
      <div className="w-full h-full flex flex-col">
        <ComponentLoader command={targetCommand} mode="panel" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16 select-none">
      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
        <Sparkles className="size-6" />
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          Janata Bank PLC.
        </h3>
        <h2 className="text-sm text-muted-foreground leading-relaxed">
          Core Banking Solution
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Select any workflow or configuration item from the navigation sidebar
          or enter a command above to open a tab.
        </p>
      </div>
    </div>
  );
}

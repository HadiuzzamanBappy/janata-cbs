"use client";

import { useWorkbenchStore } from "@/store/workbench-store";
import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  const { tabs, activeTabId } = useWorkbenchStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (activeTab) {
    return (
      <Card className="w-full flex-1 shadow-xs border-border/80 p-6 flex flex-col gap-4">
        <div className="p-4 rounded-lg bg-muted/40 border border-border/50 flex flex-col gap-2 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">
            Component Loader Target: <code className="text-primary font-mono">{activeTab.componentName}</code>
          </p>
          <p>
            Screen ID: <code className="font-mono">{activeTab.screenId || activeTab.id}</code> • Instance ID: <code className="font-mono">{activeTab.id}</code>
          </p>
          <p className="pt-1 leading-relaxed">
            This workspace area renders only the screen body. Opening this leaf hydrates form properties over gRPC or loads bespoke components from the registry directly.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16 select-none">
      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
        <Sparkles className="size-6" />
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          FinX Core Banking Workbench
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Select any workflow or configuration item from the navigation sidebar or enter a command above to open a tab.
        </p>
      </div>
    </div>
  );
}

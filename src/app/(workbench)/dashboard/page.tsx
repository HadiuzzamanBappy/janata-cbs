"use client";

import { Sparkles } from "lucide-react";
import { ScreenLoader } from "@/features/workbench";
import { cn } from "@/lib/utils";
import { useWorkbenchStore } from "@/store";

export default function DashboardPage() {
  const { tabs, activeTabId } = useWorkbenchStore();

  if (tabs.length > 0) {
    return (
      <div className="w-full h-full flex flex-col relative overflow-hidden">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          const targetCommand = tab.screenId || tab.componentName || tab.id;
          return (
            <div
              key={tab.id}
              className={cn("w-full h-full flex-col flex-1", isActive ? "flex" : "hidden")}
            >
              <ScreenLoader command={targetCommand} tabId={tab.id} mode="panel" />
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center text-center gap-4 py-16 select-none">
      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
        <Sparkles className="size-6" />
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">Janata Bank PLC.</h3>
        <h2 className="text-sm text-muted-foreground leading-relaxed">Core Banking Solution</h2>
      </div>
    </div>
  );
}

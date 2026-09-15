"use client";

import { useWorkbenchStore } from "@/store/workbench-store";
import { Terminal, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { tabs, activeTabId } = useWorkbenchStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (activeTab) {
    return (
      <Card className="max-w-5xl mx-auto shadow-xs border-border/80">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                <Terminal className="size-4" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">{activeTab.title}</CardTitle>
                <CardDescription className="text-xs">
                  Screen ID: <span className="font-mono">{activeTab.id}</span> • Component:{" "}
                  <span className="font-mono">{activeTab.componentName}</span>
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              Active Workspace
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-6 flex flex-col gap-4 text-xs text-muted-foreground">
          <div className="p-4 rounded-lg bg-muted/40 border border-border/50 flex flex-col gap-2">
            <p className="font-medium text-foreground">
              Component Loader Target: <code className="text-primary font-mono">{activeTab.componentName}</code>
            </p>
            <p>
              This tab is active in the Zustand <code className="font-mono">workbench-store</code>. In Step 3 (Schema Engine), opening this leaf will dynamically hydrate form properties over gRPC or load bespoke components from the registry.
            </p>
          </div>
        </CardContent>
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

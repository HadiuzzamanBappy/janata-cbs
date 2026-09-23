"use client";

import { ShieldCheck } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { ComponentLoader } from "@/features/workspace";

export default function StandaloneScreenPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const screenId = (params?.id as string) ?? "ACCOUNT";
  const title = searchParams.get("title") ?? screenId.toUpperCase();

  return (
    <div className="min-h-screen w-full flex flex-col bg-background text-foreground antialiased select-none">
      {/* Standalone Window Header */}
      <header className="h-12 border-b border-border/60 bg-background/95 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
            JBP
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">{title}</span>
            <Badge
              variant="outline"
              className="font-mono text-[10px] px-1.5 py-0"
            >
              {screenId}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-emerald-500" />
            <span>Standalone Window Mode</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Screen Canvas Container */}
      <main className="flex-1 p-4 overflow-auto bg-muted/15 flex flex-col">
        <ComponentLoader command={screenId} mode="window" />
      </main>
    </div>
  );
}

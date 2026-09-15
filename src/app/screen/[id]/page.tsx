"use client";

import { useSearchParams, useParams } from "next/navigation";
import { Terminal, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function StandaloneScreenPage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const screenId = (params?.id as string) ?? "UNKNOWN";
  const title = searchParams.get("title") ?? screenId.toUpperCase();
  const componentName = searchParams.get("component") ?? "DYNAMIC_FORM";

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
            <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">
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
      <main className="flex-1 p-6 overflow-auto bg-muted/15">
        <Card className="max-w-4xl mx-auto shadow-xs border-border/80">
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                  <Terminal className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                  <CardDescription className="text-xs">
                    Screen ID: <span className="font-mono">{screenId}</span> • Component:{" "}
                    <span className="font-mono">{componentName}</span>
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-xs">
                Window Target View
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-6 flex flex-col gap-4 text-xs text-muted-foreground">
            <div className="p-4 rounded-lg bg-muted/40 border border-border/50 flex flex-col gap-2">
              <p className="font-medium text-foreground">
                Standalone Target Execution: <code className="text-primary font-mono">{componentName}</code>
              </p>
              <p>
                This screen was launched in <code className="font-mono">window</code> or <code className="font-mono">tab</code> mode. In Step 3 (Schema Engine), this route will dynamically load the gRPC schema specification for screen <code className="font-mono">{screenId}</code> directly.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

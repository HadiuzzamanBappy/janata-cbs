import { Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Generalized Screen Skeleton for Next.js Route Loading (loading.tsx).
 * Renders an authentic CBS application scaffold matching all screen types
 * (Forms, Enquiries, and System Screens) prior to hydration and client-side resolution:
 * - ROW 1: Action toolbar placeholder (buttons + action dropdown)
 * - ROW 2: Record lookup / Command title header strip
 * - Body: Centered IDLE canvas with pulsating Layers icon
 */
export default function ScreenLoadingState() {
  return (
    <div className="fixed inset-0 flex flex-col bg-background select-none animate-in fade-in-50">
      {/* Header Toolbar Skeleton */}
      <header className="shrink-0 bg-muted/40 border-b border-border/80">
        {/* ROW 1: Action Icons Toolbar */}
        <div className="flex items-center gap-1.5 px-2 py-1 border-b border-border/50 bg-background/90">
          <div className="flex items-center gap-1 shrink-0">
            <Skeleton className="h-7 w-9" />
            <Skeleton className="h-7 w-9" />
            <Skeleton className="h-7 w-9" />
          </div>
          <span className="h-4 w-px bg-border/60 mx-1" />
          <Skeleton className="h-7 w-20" />
        </div>

        {/* ROW 2: CBS Screen Command & Record ID Header */}
        <div className="flex items-center gap-2 px-2.5 py-1 text-xs bg-muted/20">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-40 sm:w-52 font-mono" />
          <Skeleton className="h-7 w-7 shrink-0" />
        </div>
      </header>

      {/* Screen Body Canvas Skeleton */}
      <div className="flex-1 min-h-0 p-3 flex flex-col">
        <div className="w-full flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-md p-8 text-center bg-muted/10">
          <div className="size-11 rounded-md border border-border/60 bg-muted/50 text-primary flex items-center justify-center mb-3 shadow-2xs">
            <Layers className="size-5.5 animate-pulse opacity-60" />
          </div>
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-3 w-64 max-w-sm" />
        </div>
      </div>
    </div>
  );
}

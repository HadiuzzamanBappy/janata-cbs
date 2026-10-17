import { Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface SystemSkeletonProps {
  tabCount?: number;
}

/**
 * SystemSkeleton mirrors the exact IDLE / Tabbed layout of System Screens (variant="admin-tabs"):
 * - Row 1: Action toolbar (Save, Validate, Authorize, More Actions)
 * - Row 2: Screen title + Record lookup ID input box
 * - Row 3: Admin Tab strip ([General] [Fields / Specific] [Audit Data] [JSON Output])
 * - Body: Centered dashed canvas with Layers icon placeholder or tab content outline
 */
export function SystemSkeleton({ tabCount = 4 }: SystemSkeletonProps) {
  const tabs = Array.from({ length: tabCount }, (_, i) => i);

  return (
    <div className="flex flex-col h-full w-full bg-background select-none animate-in fade-in-50">
      {/* Header Toolbar Skeleton */}
      <header className="sticky top-0 z-20 bg-muted/40 border-b border-border/80">
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

        {/* ROW 2: System Screen Header: Command Title + Record ID Lookup */}
        <div className="flex items-center gap-2 px-2.5 py-1 text-xs bg-muted/20">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-40 sm:w-56 font-mono" />
          <Skeleton className="h-7 w-7 shrink-0" />
        </div>

        {/* ROW 3: Admin Tab Strip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background border-t border-border/40 overflow-x-auto">
          {tabs.map((i) => (
            <Skeleton key={i} className="h-6 w-24 rounded-t-sm" />
          ))}
        </div>
      </header>

      {/* Screen Body Skeleton */}
      <div className="flex-1 overflow-auto p-3">
        <div className="h-full min-h-75 flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-md p-8 text-center bg-muted/10">
          <div className="size-11 rounded-md border border-border/60 bg-muted/50 text-primary flex items-center justify-center mb-3 shadow-2xs">
            <Layers className="size-5.5 animate-pulse opacity-60" />
          </div>
          <Skeleton className="h-4 w-44 mb-2" />
          <Skeleton className="h-3 w-72 max-w-sm" />
        </div>
      </div>
    </div>
  );
}

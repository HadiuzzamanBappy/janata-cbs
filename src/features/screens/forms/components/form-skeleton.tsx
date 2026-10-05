import { Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface FormSkeletonProps {
  rowCount?: number;
}

/**
 * FormSkeleton mirrors the exact IDLE state layout of FormScreen:
 * - Row 1: Action toolbar with Edit, View, Perform icons + action dropdown
 * - Row 2: Title label + Record ID input box + Add button
 * - Body: Centered dashed canvas with Layers icon placeholder
 */
export function FormSkeleton(_props?: FormSkeletonProps) {
  return (
    <div className="flex flex-col h-full w-full bg-background select-none animate-in fade-in-50">
      {/* Header Toolbar Skeleton */}
      <header className="sticky top-0 z-20 bg-muted/40 border-b border-border/80">
        {/* ROW 1: Action Icons Toolbar */}
        <div className="flex items-center gap-1.5 px-2 py-1 border-b border-border/50 bg-background/90">
          <div className="flex items-center gap-1 shrink-0">
            {/* Edit / View / Perform icon button placeholders */}
            <Skeleton className="h-7 w-9 rounded" />
            <Skeleton className="h-7 w-9 rounded" />
            <Skeleton className="h-7 w-9 rounded" />
          </div>
          <span className="h-4 w-px bg-border/60 mx-1" />
          {/* More Actions dropdown placeholder */}
          <Skeleton className="h-7 w-20 rounded" />
        </div>

        {/* ROW 2: Temenos Record Header: Label + Record ID Box + Add (+) Button */}
        <div className="flex items-center gap-2 px-2.5 py-1 text-xs bg-muted/20">
          {/* Title label placeholder */}
          <Skeleton className="h-4 w-28 rounded" />
          {/* Record ID Input Box */}
          <Skeleton className="h-7 w-36 sm:w-48 rounded font-mono" />
          {/* Add (+) Button */}
          <Skeleton className="h-7 w-7 rounded shrink-0" />
        </div>
      </header>

      {/* Screen Body Skeleton: IDLE State Center Canvas */}
      <div className="flex-1 overflow-auto p-3">
        <div className="h-full min-h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-8 text-center bg-muted/10">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <Layers className="size-6 animate-pulse opacity-60" />
          </div>
          <Skeleton className="h-4 w-40 rounded mb-2" />
          <Skeleton className="h-3 w-64 rounded max-w-sm" />
        </div>
      </div>
    </div>
  );
}


import { Skeleton } from "@/components/ui/skeleton";

export default function ScreenLoadingState() {
  return (
    <div className="h-full w-full p-4 bg-muted/15">
      <div className="w-full h-full space-y-4 animate-in fade-in-50">
        {/* 1. Header Toolbar Skeleton */}
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-3 w-72 rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>

        {/* 2. High-Density 12-Column Banking Form Skeleton */}
        <div className="p-4 rounded-lg border border-border/60 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-3 w-20 rounded-md" />
          </div>

          <div className="grid grid-cols-12 gap-3 pt-1">
            <div className="col-span-12 sm:col-span-3 space-y-1.5">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="col-span-12 sm:col-span-3 space-y-1.5">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="col-span-12 sm:col-span-3 space-y-1.5">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="col-span-12 sm:col-span-3 space-y-1.5">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="col-span-12 sm:col-span-6 space-y-1.5">
              <Skeleton className="h-3 w-28 rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="col-span-12 sm:col-span-6 space-y-1.5">
              <Skeleton className="h-3 w-32 rounded" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>
        </div>

        {/* 3. Transaction Data Table Skeleton */}
        <div className="rounded-lg border border-border/60 bg-card p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-36 rounded-md" />
            <Skeleton className="h-7 w-28 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-7 w-full rounded-md bg-muted/70" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
            <Skeleton className="h-8 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

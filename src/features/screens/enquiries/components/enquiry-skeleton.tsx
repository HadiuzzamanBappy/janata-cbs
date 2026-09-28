import { Skeleton } from "@/components/ui/skeleton";

export interface EnquirySkeletonProps {
  rowCount?: number;
}

export function EnquirySkeleton({ rowCount = 5 }: EnquirySkeletonProps) {
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <div className="h-full w-full p-4 bg-muted/15 space-y-4 animate-in fade-in-50">
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-2.5 w-20 rounded bg-muted/60" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
      </div>

      {/* Main Table Skeleton Card */}
      <div className="p-4 rounded-lg border border-border/60 bg-card space-y-3">
        {/* Table Header Row */}
        <div className="flex items-center justify-between pb-2 border-b">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="h-4 w-20 rounded" />
        </div>
        {/* Data Rows */}
        {rows.map((r) => (
          <div key={r} className="flex items-center justify-between py-2 border-b border-border/30">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-36 rounded" />
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-3.5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

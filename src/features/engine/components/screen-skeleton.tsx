import { Skeleton } from "@/components/ui/skeleton";

export interface ScreenSkeletonProps {
  rowCount?: number;
}

const DEFAULT_ROWS = [
  { id: "row-1", labelW: "w-32", req: true, inputW: "max-w-md" },
  { id: "row-2", labelW: "w-28", req: true, inputW: "max-w-md" },
  { id: "row-3", labelW: "w-20", req: true, inputW: "max-w-md" },
  { id: "row-4", labelW: "w-24", req: true, inputW: "max-w-xs" },
  { id: "row-5", labelW: "w-24", req: false, inputW: "max-w-md" },
  { id: "row-6", labelW: "w-24", req: false, inputW: "max-w-md" },
  { id: "row-7", labelW: "w-32", req: false, inputW: "max-w-xs" },
];

export function ScreenSkeleton({ rowCount }: ScreenSkeletonProps) {
  const rows = rowCount ? DEFAULT_ROWS.slice(0, rowCount) : DEFAULT_ROWS;

  return (
    <div className="h-full w-full p-4 bg-muted/15 space-y-4 animate-in fade-in-50">
      {/* Top Header Toolbar */}
      <div className="flex items-center justify-between pb-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-36 rounded-md" />
          <Skeleton className="h-4 w-24 rounded bg-muted/60" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-28 rounded-md" />
        </div>
      </div>

      {/* Main Screen Form Skeleton Card */}
      <div className="p-4 rounded-lg border border-border/60 bg-card space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="w-full sm:w-64 shrink-0 flex items-center gap-1">
              <Skeleton className={`h-3.5 ${row.labelW} rounded`} />
              {row.req && <Skeleton className="h-3.5 w-2 rounded bg-destructive/40" />}
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="hidden sm:inline text-muted-foreground/40 font-mono text-xs shrink-0 select-none">
                :
              </span>
              <Skeleton className={`h-8 w-full ${row.inputW} rounded-md`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

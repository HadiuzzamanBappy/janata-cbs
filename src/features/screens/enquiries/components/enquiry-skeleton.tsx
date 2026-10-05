import { Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface EnquirySkeletonProps {
  rowCount?: number;
}

/**
 * EnquirySkeleton mirrors the exact IDLE (SELECTION) state layout of EnquiryScreen:
 * - Centered selection criteria card with filter rows (label, operand, value input)
 * - Bottom action bar with Find (search) and Clear buttons
 */
export function EnquirySkeleton({ rowCount = 4 }: EnquirySkeletonProps) {
  const rows = Array.from({ length: rowCount }, (_, i) => i);

  return (
    <div className="flex-1 overflow-auto p-3 flex flex-col items-center justify-start select-none animate-in fade-in-50">
      <div className="w-full max-w-xl bg-card border border-border/60 rounded-xl shadow-xs overflow-hidden mt-1">
        {/* Card Header */}
        <div className="bg-muted/30 px-3.5 py-2 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="size-3.5 text-primary opacity-60 animate-pulse" />
            <Skeleton className="h-3.5 w-36 rounded" />
          </div>
          <Skeleton className="h-3 w-24 rounded font-mono" />
        </div>

        {/* Card Body - Selection Filter Rows */}
        <div className="p-4 flex flex-col gap-3">
          <div className="flex flex-col divide-y divide-border/30">
            {rows.map((i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2 py-2 text-xs">
                {/* Field Label & Field ID */}
                <div className="col-span-4 flex items-center justify-between pr-2 shrink-0">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-2.5 w-12 rounded hidden sm:inline" />
                </div>

                {/* Operand + Value Input */}
                <div className="col-span-8 flex items-center gap-1.5">
                  <Skeleton className="h-7 w-16 rounded shrink-0" />
                  <Skeleton className="h-7 flex-1 rounded" />
                </div>
              </div>
            ))}
          </div>

          {/* Card Footer Actions */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between">
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-7 w-24 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}


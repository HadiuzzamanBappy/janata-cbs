"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface InquiryPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  className?: string;
}

export function InquiryPagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  className = "",
}: InquiryPaginationProps) {
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div
      className={`flex items-center justify-between px-3 py-1 bg-card/60 border border-border/80 rounded text-xs select-none shadow-2xs ${className}`}
    >
      {/* Total Counter */}
      <div className="flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
        <span>Showing</span>
        <span className="font-semibold text-foreground">
          {startItem}-{endItem}
        </span>
        <span>of</span>
        <span className="font-semibold text-foreground">{totalCount}</span>
        <span>records</span>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 border-r border-border/50 pr-2">
            <span className="text-[11px] text-muted-foreground">Rows:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(val: string | null) => {
                if (val) onPageSizeChange(Number(val));
              }}
            >
              <SelectTrigger className="h-6 w-16 text-[11px] font-mono px-1.5 py-0 bg-background border-border/80 rounded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="text-[11px] font-mono min-w-16">
                {[15, 30, 50, 100].map((sz) => (
                  <SelectItem key={sz} value={String(sz)}>
                    {sz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Page Buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="size-6 rounded"
            title="First page"
          >
            <ChevronsLeft className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="size-6 rounded"
            title="Previous page"
          >
            <ChevronLeft className="size-3" />
          </Button>

          <span className="text-xs font-mono px-1.5 text-muted-foreground">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="size-6 rounded"
            title="Next page"
          >
            <ChevronRight className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="size-6 rounded"
            title="Last page"
          >
            <ChevronsRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

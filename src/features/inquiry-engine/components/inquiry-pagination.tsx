"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex items-center gap-1.5">
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

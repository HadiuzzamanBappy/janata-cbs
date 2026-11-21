"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface InquiryPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export function InquiryPagination({
  currentPage,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
}: InquiryPaginationProps) {
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex items-center justify-between px-2 py-0.5 h-6.5 bg-card/60 border border-border/80 rounded text-2xs select-none shadow-2xs">
      {/* Total Counter */}
      <div className="flex items-center gap-1 font-mono text-3xs text-muted-foreground">
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
        {/* Fixed Rows Per Page (configured by Inquiry, non-editable) */}
        <div className="flex items-center gap-1 font-mono text-3xs text-muted-foreground border-r border-border/50 pr-1.5">
          <span>Rows:</span>
          <span className="font-semibold text-foreground">{pageSize}</span>
        </div>

        {/* Page Buttons */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(1)}
            disabled={currentPage <= 1}
            className="size-5 rounded"
            title="First page"
          >
            <ChevronsLeft className="size-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="size-5 rounded"
            title="Previous page"
          >
            <ChevronLeft className="size-2.5" />
          </Button>

          <span className="text-3xs font-mono px-1 text-muted-foreground">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="size-5 rounded"
            title="Next page"
          >
            <ChevronRight className="size-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            className="size-5 rounded"
            title="Last page"
          >
            <ChevronsRight className="size-2.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  onPageSizeChange: (pageSize: number) => void;
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
        {/* Page Size Selector */}
        <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
          <span className="text-muted-foreground text-[11px]">Rows:</span>
          <Select
            value={String(pageSize)}
            onValueChange={(val: string | null) => {
              if (val) onPageSizeChange(Number(val));
            }}
          >
            <SelectTrigger
              size="sm"
              className="h-6 w-auto min-w-11.5 text-xs font-mono px-1.5 py-0 gap-1 bg-background text-foreground border-border/80 rounded shadow-none [&_svg]:size-3 [&_svg]:text-muted-foreground"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded min-w-14">
              <SelectItem value="10" className="text-xs rounded font-mono">
                10
              </SelectItem>
              <SelectItem value="25" className="text-xs rounded font-mono">
                25
              </SelectItem>
              <SelectItem value="50" className="text-xs rounded font-mono">
                50
              </SelectItem>
              <SelectItem value="100" className="text-xs rounded font-mono">
                100
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

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

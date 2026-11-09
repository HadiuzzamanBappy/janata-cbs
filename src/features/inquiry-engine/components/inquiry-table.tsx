"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import { useInquiryPagination } from "../hooks/use-inquiry-pagination";
import { useInquirySort } from "../hooks/use-inquiry-sort";
import type { InquiryTableProps } from "../types";
import { deriveInquiryColumnMeta } from "../utils/column-compiler";
import { InquiryEmptyState } from "./inquiry-empty-state";
import { InquiryPagination } from "./inquiry-pagination";
import { InquiryTableBody } from "./inquiry-table-body";
import { InquiryTableHeader } from "./inquiry-table-header";

export function InquiryTable({
  columns,
  rows,
  commands = [],
  pageSize: controlledPageSize,
  onPageSizeChange,
  currentPage: controlledPage,
  onPageChange,
  totalRows,
  showSerial = true,
  showPagination = true,
  className = "",
}: InquiryTableProps) {
  // 1. Derive presentation metadata from canonical INQDef wire spec
  const columnMetas = React.useMemo(() => {
    return (columns || [])
      .map((col: INQDef) => deriveInquiryColumnMeta(col))
      .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.order - b.order));
  }, [columns]);

  // 2. Multi-row grouping layout calculation (e.g. 1,1 vs 2,1)
  const { isMultiRow, sortedRowNumbers, rowsMap, maxColsInAnyRow } = React.useMemo(() => {
    const map = new Map<number, typeof columnMetas>();
    for (const col of columnMetas) {
      const list = map.get(col.row) || [];
      list.push(col);
      map.set(col.row, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.order - b.order);
    }
    const rowNums = Array.from(map.keys()).sort((a, b) => a - b);
    const maxCols = Math.max(...Array.from(map.values()).map((list) => list.length), 1);
    return {
      isMultiRow: rowNums.length > 1,
      sortedRowNumbers: rowNums,
      rowsMap: map,
      maxColsInAnyRow: maxCols,
    };
  }, [columnMetas]);

  // 3. Client-side sort state
  const { sortState, handleSort, sortedRows } = useInquirySort(rows);

  // 4. Pagination calculation
  const {
    currentPage,
    pageSize,
    totalPages,
    totalCount,
    handlePageChange,
    handlePageSizeChange,
    paginatedRows,
  } = useInquiryPagination({
    rows: sortedRows,
    controlledPageSize,
    onPageSizeChange,
    controlledPage,
    onPageChange,
    totalRows,
  });

  const displayRows = showPagination ? paginatedRows : sortedRows;
  const showActionsColumn = commands.length > 0;

  return (
    <TooltipProvider delay={150}>
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden pr-1 gap-1 ${className}`}>
        {/* Table Container: rounded, border-border/80, bg-card/60, shadow-2xs matching system layout */}
        <div className="flex-1 min-h-0 overflow-auto rounded border border-border/80 bg-card/60 shadow-2xs flex flex-col">
          {rows.length === 0 ? (
            <InquiryEmptyState />
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <InquiryTableHeader
                  isMultiRow={isMultiRow}
                  sortedRowNumbers={sortedRowNumbers}
                  rowsMap={rowsMap}
                  maxColsInAnyRow={maxColsInAnyRow}
                  columnMetas={columnMetas}
                  showSerial={showSerial}
                  showActionsColumn={showActionsColumn}
                  sortColumn={sortState?.column}
                  sortDirection={sortState?.direction}
                  onSort={handleSort}
                />
                <InquiryTableBody
                  rows={displayRows}
                  isMultiRow={isMultiRow}
                  sortedRowNumbers={sortedRowNumbers}
                  rowsMap={rowsMap}
                  maxColsInAnyRow={maxColsInAnyRow}
                  columnMetas={columnMetas}
                  commands={commands}
                  showSerial={showSerial}
                  showActionsColumn={showActionsColumn}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  showPagination={showPagination}
                />
              </table>
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        {showPagination && (
          <InquiryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

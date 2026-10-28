"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { INQDef } from "@/lib/data-schemas/inquiry-config-schema";
import { useInquiryPagination } from "../hooks/use-inquiry-pagination";
import { useInquirySort } from "../hooks/use-inquiry-sort";
import type { InquiryTableProps } from "../types";
import { deriveInquiryColumnMeta } from "../utils/column-compiler";
import { CellFormatter } from "./cell-formatter";
import { ColumnHeader } from "./column-header";
import { InquiryPagination } from "./inquiry-pagination";
import { InquiryRowActions } from "./inquiry-row-actions";

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
  className = "",
}: InquiryTableProps) {
  // 1. Derive rich metadata from canonical INQDef wire spec
  const columnMetas = React.useMemo(() => {
    return (columns || []).map((col: INQDef) => deriveInquiryColumnMeta(col)).sort((a, b) => a.order - b.order);
  }, [columns]);

  // 2. Client-side sort state
  const { sortState, handleSort, sortedRows } = useInquirySort(rows);

  // 3. Pagination calculation
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
    controlledPage,
    controlledPageSize,
    onPageChange,
    onPageSizeChange,
    totalRows,
  });

  return (
    <div
      className={`flex flex-col border border-border rounded-lg bg-card overflow-hidden shadow-xs ${className}`}
    >
      <div className="overflow-x-auto">
        <Table className="w-full text-xs">
          <TableHeader className="bg-muted/50 border-b border-border">
            <TableRow className="hover:bg-transparent">
              {showSerial && (
                <TableHead className="w-12 text-center text-muted-foreground font-mono text-[11px]">
                  #
                </TableHead>
              )}
              {columnMetas.map((col) => (
                <TableHead
                  key={col.id}
                  style={{ width: col.width }}
                  className="px-3 py-2 text-foreground font-semibold"
                >
                  <ColumnHeader
                    title={col.label}
                    align={col.align}
                    sortDirection={sortState.column === col.id ? sortState.direction : null}
                    onSort={() => handleSort(col.id)}
                  />
                </TableHead>
              ))}
              {commands.length > 0 && (
                <TableHead className="w-24 text-right pr-4 text-foreground font-semibold">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    columnMetas.length + (showSerial ? 1 : 0) + (commands.length > 0 ? 1 : 0)
                  }
                  className="h-32 text-center text-muted-foreground text-xs"
                >
                  No matching records found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, rowIdx) => {
                const serialNum = (currentPage - 1) * pageSize + rowIdx + 1;
                const rowKey =
                  typeof row.id === "string" && row.id.length > 0
                    ? row.id
                    : typeof row.recordId === "string" && row.recordId.length > 0
                      ? row.recordId
                      : `inq-row-${serialNum}`;
                return (
                  <TableRow
                    key={rowKey}
                    className="hover:bg-muted/40 transition-colors border-b border-border/40"
                  >
                    {showSerial && (
                      <TableCell className="text-center font-mono text-[11px] text-muted-foreground">
                        {serialNum}
                      </TableCell>
                    )}
                    {columnMetas.map((col) => (
                      <TableCell
                        key={col.id}
                        className={`px-3 py-2 text-xs ${
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                              ? "text-center"
                              : "text-left"
                        }`}
                      >
                        <CellFormatter
                          value={row[col.id]}
                          format={col.format}
                          isMono={col.isMono}
                        />
                      </TableCell>
                    ))}
                    {commands.length > 0 && (
                      <TableCell className="pr-4 py-1.5 text-right">
                        <InquiryRowActions commands={commands} row={row} />
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <InquiryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}

"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/core-utils";
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
    return (columns || [])
      .map((col: INQDef) => deriveInquiryColumnMeta(col))
      .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.order - b.order));
  }, [columns]);

  // 1.1 Multi-row grouping (e.g. 1,1 vs 2,1)
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
    controlledPageSize,
    onPageSizeChange,
    controlledPage,
    onPageChange,
    totalRows,
  });

  const showActionsColumn = commands.length > 0;

  return (
    <TooltipProvider delay={150}>
      <div className={`flex-1 flex flex-col min-h-0 overflow-hidden pr-1 gap-1 ${className}`}>
        {/* Table Container: rounded, border-border/80, bg-card/60, shadow-2xs matching system layout */}
        <div className="flex-1 min-h-0 overflow-auto rounded border border-border/80 bg-card/60 shadow-2xs flex flex-col">
          {rows.length === 0 ? (
            <div className="flex-1 min-h-50 flex flex-col items-center justify-center p-6 text-center bg-muted/10">
              <p className="text-xs text-muted-foreground font-mono">No matching records found.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="bg-muted/50 sticky top-0 z-10 border-b border-border/70 [&_tr]:border-b">
                  {!isMultiRow ? (
                    <tr className="hover:bg-transparent border-b border-border/60">
                      {showSerial && (
                        <th className="w-12 text-center text-xs font-semibold text-muted-foreground py-1 px-2 whitespace-nowrap">
                          #
                        </th>
                      )}
                      {columnMetas.map((col) => (
                        <th
                          key={col.id}
                          style={{ width: col.width }}
                          className={`text-xs font-semibold text-foreground/90 py-1.5 px-2.5 h-7.5 whitespace-nowrap ${
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                                ? "text-center"
                                : "text-left"
                          }`}
                        >
                          <ColumnHeader
                            label={col.label}
                            columnId={col.id}
                            align={col.align}
                            sortDirection={
                              sortState?.column === col.id ? sortState.direction : null
                            }
                            onSort={handleSort}
                          />
                        </th>
                      ))}

                      {/* Actions Column Header pinned on the Right */}
                      {showActionsColumn && (
                        <th className="w-20 px-2 py-1 text-center text-xs font-semibold text-muted-foreground sticky right-0 bg-muted/95 backdrop-blur-xs border-l border-border/40 z-20 whitespace-nowrap">
                          Actions
                        </th>
                      )}
                    </tr>
                  ) : (
                    sortedRowNumbers.map((rowNum, rIdx) => {
                      const rowCols = rowsMap.get(rowNum) || [];
                      const isFirstRow = rIdx === 0;
                      return (
                        <tr
                          key={`thead-row-${rowNum}`}
                          className="hover:bg-transparent border-b border-border/60"
                        >
                          {isFirstRow && showSerial && (
                            <th
                              rowSpan={sortedRowNumbers.length}
                              className="w-12 text-center text-xs font-semibold text-muted-foreground py-1 px-2 whitespace-nowrap align-middle border-r border-border/30"
                            >
                              #
                            </th>
                          )}

                          {rowCols.map((col, cIdx) => {
                            const isLast = cIdx === rowCols.length - 1;
                            const colSpan =
                              isLast && rowCols.length < maxColsInAnyRow
                                ? maxColsInAnyRow - rowCols.length + 1
                                : undefined;
                            return (
                              <th
                                key={col.id}
                                colSpan={colSpan}
                                style={{ width: colSpan ? undefined : col.width }}
                                className={`text-xs font-semibold text-foreground/90 py-1.5 px-2.5 h-7.5 whitespace-nowrap ${
                                  col.align === "right"
                                    ? "text-right"
                                    : col.align === "center"
                                      ? "text-center"
                                      : "text-left"
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1 py-0.5 rounded">
                                    L{rowNum}.{col.order}
                                  </span>
                                  <ColumnHeader
                                    label={col.label}
                                    columnId={col.id}
                                    align={col.align}
                                    sortDirection={
                                      sortState?.column === col.id ? sortState.direction : null
                                    }
                                    onSort={handleSort}
                                  />
                                </div>
                              </th>
                            );
                          })}

                          {isFirstRow && showActionsColumn && (
                            <th
                              rowSpan={sortedRowNumbers.length}
                              className="w-20 px-2 py-1 text-center text-xs font-semibold text-muted-foreground sticky right-0 bg-muted/95 backdrop-blur-xs border-l border-border/40 z-20 whitespace-nowrap align-middle"
                            >
                              Actions
                            </th>
                          )}
                        </tr>
                      );
                    })
                  )}
                </thead>

                <tbody className="[&_tr:last-child]:border-0">
                  {paginatedRows.map((row, rowIdx) => {
                    const serialNum = (currentPage - 1) * pageSize + rowIdx + 1;
                    const rowKey =
                      typeof row.id === "string" && row.id.length > 0
                        ? row.id
                        : typeof row.recordId === "string" && row.recordId.length > 0
                          ? row.recordId
                          : `inq-row-${serialNum}`;
                    const isStriped = rowIdx % 2 === 1;

                    if (!isMultiRow) {
                      return (
                        <tr
                          key={rowKey}
                          className={`hover:bg-primary/10 transition-colors border-b border-border/30 font-mono text-xs ${
                            isStriped ? "bg-muted/40" : "bg-transparent"
                          }`}
                        >
                          {showSerial && (
                            <td className="w-12 text-center font-mono text-[11px] text-muted-foreground py-1.5 px-2 whitespace-nowrap">
                              {serialNum}
                            </td>
                          )}
                          {columnMetas.map((col) => (
                            <td
                              key={col.id}
                              className={`py-1.5 px-2.5 text-xs whitespace-nowrap ${col.isMono ? "font-mono" : ""} ${
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
                                routine={col.routine}
                              />
                            </td>
                          ))}

                          {/* Action Column pinned right with matching striped background */}
                          {showActionsColumn && (
                            <td
                              className={`w-20 px-1.5 py-1 text-center sticky right-0 backdrop-blur-xs border-l border-border/30 whitespace-nowrap ${
                                isStriped ? "bg-muted/95" : "bg-card/95"
                              }`}
                            >
                              <InquiryRowActions commands={commands} row={row} />
                            </td>
                          )}
                        </tr>
                      );
                    }

                    // Multi-line Stacked Record
                    return (
                      <React.Fragment key={rowKey}>
                        {sortedRowNumbers.map((rowNum, rIdx) => {
                          const rowCols = rowsMap.get(rowNum) || [];
                          const isFirst = rIdx === 0;
                          const isLast = rIdx === sortedRowNumbers.length - 1;

                          return (
                            <tr
                              key={`${rowKey}-line-${rowNum}`}
                              className={cn(
                                "hover:bg-primary/10 transition-colors font-mono text-xs",
                                isStriped ? "bg-muted/30" : "bg-transparent",
                                isLast
                                  ? "border-b border-border/80 shadow-2xs"
                                  : "border-b border-dashed border-border/30",
                              )}
                            >
                              {isFirst && showSerial && (
                                <td
                                  rowSpan={sortedRowNumbers.length}
                                  className="w-12 text-center font-mono text-[11px] text-muted-foreground py-1.5 px-2 whitespace-nowrap align-middle border-r border-border/30 font-semibold"
                                >
                                  {serialNum}
                                </td>
                              )}

                              {rowCols.map((col, cIdx) => {
                                const isLastCol = cIdx === rowCols.length - 1;
                                const colSpan =
                                  isLastCol && rowCols.length < maxColsInAnyRow
                                    ? maxColsInAnyRow - rowCols.length + 1
                                    : undefined;

                                return (
                                  <td
                                    key={col.id}
                                    colSpan={colSpan}
                                    className={cn(
                                      "py-1.5 px-2.5 text-xs whitespace-nowrap",
                                      col.isMono ? "font-mono" : "",
                                      !isFirst && "text-muted-foreground/90 bg-muted/15",
                                      col.align === "right"
                                        ? "text-right"
                                        : col.align === "center"
                                          ? "text-center"
                                          : "text-left",
                                    )}
                                  >
                                    {!isFirst && (
                                      <span className="text-[10px] font-sans font-medium text-muted-foreground/70 mr-1.5 not-italic">
                                        {col.label}:
                                      </span>
                                    )}
                                    <CellFormatter
                                      value={row[col.id]}
                                      format={col.format}
                                      isMono={col.isMono}
                                      routine={col.routine}
                                    />
                                  </td>
                                );
                              })}

                              {isFirst && showActionsColumn && (
                                <td
                                  rowSpan={sortedRowNumbers.length}
                                  className={cn(
                                    "w-20 px-1.5 py-1 text-center sticky right-0 backdrop-blur-xs border-l border-border/30 whitespace-nowrap align-middle",
                                    isStriped ? "bg-muted/95" : "bg-card/95",
                                  )}
                                >
                                  <InquiryRowActions commands={commands} row={row} />
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Bar */}
        <InquiryPagination
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
    </TooltipProvider>
  );
}

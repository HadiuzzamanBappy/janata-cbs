"use client";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Search,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkbenchStore } from "@/store";
import type { EnquiryColumn, EnquiryRow } from "../types";

interface EnquiryTableProps {
  columns: EnquiryColumn[];
  rows: EnquiryRow[];
  onViewRecord?: (recordId: string, row: EnquiryRow) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function EnquiryTable({
  columns,
  rows,
  onViewRecord,
  pageSize: controlledPageSize,
  onPageSizeChange,
  currentPage: controlledPage,
  onPageChange,
}: EnquiryTableProps) {
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);
  const [internalPage, setInternalPage] = React.useState(1);
  const [internalPageSize, setInternalPageSize] = React.useState(10);
  const { addTab } = useWorkbenchStore();

  const page = controlledPage ?? internalPage;
  const setPage = onPageChange ?? setInternalPage;
  const pageSize = controlledPageSize ?? internalPageSize;
  const setPageSize = onPageSizeChange ?? setInternalPageSize;

  const handleSort = (colId: string) => {
    if (sortCol === colId) {
      setSortAsc((prev) => !prev);
    } else {
      setSortCol(colId);
      setSortAsc(true);
    }
  };

  const sortedRows = React.useMemo(() => {
    if (!sortCol) return rows;
    return [...rows].sort((a, b) => {
      const valA = String(a[sortCol] ?? "");
      const valB = String(b[sortCol] ?? "");
      const cmp = valA.localeCompare(valB, undefined, { numeric: true });
      return sortAsc ? cmp : -cmp;
    });
  }, [rows, sortCol, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));

  // Reset to page 1 if totalPages shrink below current page
  React.useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page, setPage]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, sortedRows.length);
  const paginatedRows = sortedRows.slice(startIndex, endIndex);

  const handleDrilldown = (targetCommand?: string, recordId?: string) => {
    if (!recordId) return;
    const cmd = targetCommand || "USER.RECORD";
    const fullCmd = `${cmd},${recordId}`;
    addTab({
      screenId: fullCmd,
      title: `${cmd} #${recordId}`,
      componentName: "DYNAMIC_FORM",
    });
  };

  const handleView = (recordId: string, row: EnquiryRow) => {
    if (onViewRecord) {
      onViewRecord(recordId, row);
    } else {
      // Default fallback: open record in form tab
      handleDrilldown("ACCOUNT", recordId);
    }
  };

  return (
    <TooltipProvider delay={150}>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
        {/* Table Container */}
        <div className="flex-1 overflow-auto border border-border/60 rounded-lg bg-card shadow-xs">
          {rows.length === 0 ? (
            <div className="h-full min-h-[240px] flex flex-col items-center justify-center p-8 text-center bg-muted/10">
              <p className="text-xs text-muted-foreground font-mono">No matching records found.</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Adjust your selection criteria and click <strong>Find / Execute (▶)</strong>.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/40 sticky top-0 z-10 shadow-xs">
                <TableRow className="hover:bg-transparent">
                  {/* Dedicated View Column Header */}
                  <TableHead className="w-10 px-2 py-2 text-center text-xs font-semibold text-muted-foreground">
                    <span>View</span>
                  </TableHead>

                  {columns.map((col) => (
                    <TableHead
                      key={col.id}
                      className={`text-xs font-semibold text-foreground py-2.5 px-3 h-9 ${
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                            ? "text-center"
                            : "text-left"
                      }`}
                      style={{ width: col.width }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSort(col.id)}
                        className="inline-flex items-center gap-1 hover:text-primary transition"
                      >
                        <span>{col.label}</span>
                        <ArrowUpDown className="size-3 text-muted-foreground" />
                      </button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedRows.map((row, index) => {
                  const recordKey = String(row.id || row.accountNo || index);

                  return (
                    <TableRow
                      key={row.id || index}
                      className="hover:bg-muted/30 transition-colors border-b border-border/40"
                    >
                      {/* View Action Column (Temenos Magnifier Icon) */}
                      <TableCell className="w-10 px-2 py-1.5 text-center">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <button
                                type="button"
                                onClick={() => handleView(recordKey, row)}
                                className="inline-flex items-center justify-center size-6 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                title={`View details for ${recordKey}`}
                              >
                                <Search className="size-3.5" />
                              </button>
                            }
                          />
                          <TooltipContent className="text-xs">
                            View Record #{recordKey}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>

                      {columns.map((col) => {
                        const val = row[col.id];
                        const displayVal = val !== undefined && val !== null ? String(val) : "";

                        return (
                          <TableCell
                            key={col.id}
                            className={`py-2 px-3 text-xs ${col.isMono ? "font-mono" : ""} ${
                              col.align === "right"
                                ? "text-right"
                                : col.align === "center"
                                  ? "text-center"
                                  : "text-left"
                            }`}
                          >
                            {col.isDrilldown ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDrilldown(col.drilldownTargetCommand, String(row.id))
                                }
                                className="h-6 px-1.5 font-mono text-primary font-bold hover:underline gap-1 -ml-1 text-xs"
                              >
                                <span>{displayVal}</span>
                                <ExternalLink className="size-3 text-primary/70" />
                              </Button>
                            ) : col.id === "status" ? (
                              <Badge
                                variant={
                                  displayVal === "ACTIVE" || displayVal === "AUTHORIZED"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-[10px] font-mono px-1.5 py-0"
                              >
                                {displayVal}
                              </Badge>
                            ) : (
                              <span>{displayVal}</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* ALWAYS VISIBLE Pagination & Status Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-2 py-2.5 mt-2 bg-card border border-border/60 rounded-lg text-xs shrink-0 select-none">
          {/* Left: Record Range Display */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-muted-foreground">
              {rows.length > 0 ? (
                <>
                  Showing <strong className="text-foreground">{startIndex + 1}</strong> -{" "}
                  <strong className="text-foreground">{endIndex}</strong> of{" "}
                  <strong className="text-foreground">{rows.length}</strong> records
                </>
              ) : (
                "0 records"
              )}
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 pl-3 border-l border-border/60">
              <span className="text-muted-foreground text-[11px]">Rows:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  if (val) {
                    setPageSize(Number(val));
                    setPage(1);
                  }
                }}
              >
                <SelectTrigger className="h-7 w-16 text-xs font-mono px-2 bg-muted/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs font-mono min-w-[70px]">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Right: Pagination Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-muted-foreground mr-2 text-[11px]">
              Page {page} of {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="size-7"
              title="First Page"
            >
              <ChevronsLeft className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="size-7"
              title="Previous Page"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="size-7"
              title="Next Page"
            >
              <ChevronRight className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="size-7"
              title="Last Page"
            >
              <ChevronsRight className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

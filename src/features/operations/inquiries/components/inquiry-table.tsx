"use client";

import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit3,
  Eye,
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
import { cbsCommand } from "@/lib/cbs-command";
import type { EnquiryColumn, EnquiryRow } from "@/lib/schemas";

export interface InquiryTableProps {
  columns: EnquiryColumn[];
  rows: EnquiryRow[];
  onViewRecord?: (recordId: string, row: EnquiryRow) => void;
  onEditRecord?: (recordId: string, row: EnquiryRow) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export type EnquiryTableProps = InquiryTableProps;

export function InquiryTable({
  columns,
  rows,
  onViewRecord,
  onEditRecord,
  pageSize: controlledPageSize,
  onPageSizeChange,
  currentPage: controlledPage,
  onPageChange,
}: InquiryTableProps) {
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);
  const [internalPage, setInternalPage] = React.useState(1);
  const [internalPageSize, setInternalPageSize] = React.useState(10);

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

  const handleDrilldown = (
    targetCommand?: string,
    recordId?: string,
    mode: "VIEW" | "EDIT" = "VIEW",
    row?: EnquiryRow,
  ) => {
    if (!recordId) return;
    const cmd = targetCommand || "ACCOUNT";
    const functionCode = mode === "EDIT" ? "A" : "S";
    cbsCommand.execute(`${cmd} ${functionCode} ${recordId}`, {
      title: `${cmd} #${recordId}`,
      formData: (row as Record<string, unknown>) || {},
    });
  };

  const handleView = (recordId: string, row: EnquiryRow) => {
    if (onViewRecord) {
      onViewRecord(recordId, row);
    } else {
      handleDrilldown("ACCOUNT", recordId, "VIEW", row);
    }
  };

  const handleEdit = (recordId: string, row: EnquiryRow) => {
    if (onEditRecord) {
      onEditRecord(recordId, row);
    } else {
      handleDrilldown("ACCOUNT", recordId, "EDIT", row);
    }
  };

  return (
    <TooltipProvider delay={150}>
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden pr-1 gap-0.5">
        {/* Table Container: rounded, border-border/80, bg-card/60, shadow-2xs matching system layout */}
        <div className="flex-1 overflow-auto rounded border border-border/80 bg-card/60 shadow-2xs">
          {rows.length === 0 ? (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center p-6 text-center bg-muted/10">
              <p className="text-xs text-muted-foreground font-mono">No matching records found.</p>
              <p className="text-[11px] text-muted-foreground/80 mt-1">
                Adjust your selection criteria and click <strong>Find / Execute (▶)</strong>.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10 border-b border-border/70">
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  {columns.map((col) => (
                    <TableHead
                      key={col.id}
                      className={`text-xs font-semibold text-foreground/90 py-1.5 px-2.5 h-7.5 ${
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
                        className="inline-flex items-center gap-1 hover:text-primary transition font-medium select-none cursor-pointer"
                      >
                        <span>{col.label}</span>
                        <ArrowUpDown className="size-3 text-muted-foreground/70" />
                      </button>
                    </TableHead>
                  ))}

                  {/* Actions Column Header pinned on the Right */}
                  <TableHead className="w-14 px-2 py-1 text-center text-xs font-semibold text-muted-foreground sticky right-0 bg-muted/95 backdrop-blur-xs border-l border-border/40 z-20">
                    <span>Act</span>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedRows.map((row, index) => {
                  const recordKey = String(row.id || row.accountNo || index);
                  const isStriped = index % 2 === 1;

                  return (
                    <TableRow
                      key={row.id || index}
                      className={`hover:bg-primary/10 transition-colors border-b border-border/30 font-mono text-xs ${
                        isStriped ? "bg-muted/40" : "bg-transparent"
                      }`}
                    >
                      {columns.map((col) => {
                        const val = row[col.id];
                        const displayVal = val !== undefined && val !== null ? String(val) : "";

                        return (
                          <TableCell
                            key={col.id}
                            className={`py-1.5 px-2.5 text-xs ${col.isMono ? "font-mono" : ""} ${
                              col.align === "right"
                                ? "text-right"
                                : col.align === "center"
                                  ? "text-center"
                                  : "text-left"
                            }`}
                          >
                            {col.id === "status" ? (
                              <Badge
                                variant={
                                  displayVal === "ACTIVE" || displayVal === "AUTHORIZED"
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-[10px] font-mono px-1 py-0 h-4.5 rounded uppercase tracking-wider"
                              >
                                {displayVal}
                              </Badge>
                            ) : (
                              <span>{displayVal}</span>
                            )}
                          </TableCell>
                        );
                      })}

                      {/* Action Column pinned right with matching striped background */}
                      <TableCell
                        className={`w-14 px-1.5 py-1 text-center sticky right-0 backdrop-blur-xs border-l border-border/30 ${
                          isStriped ? "bg-muted/95" : "bg-card/95"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-0.5">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  onClick={() => handleView(recordKey, row)}
                                  className="inline-flex items-center justify-center size-5.5 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                >
                                  <Eye className="size-3" />
                                </button>
                              }
                            />
                            <TooltipContent className="text-xs">View</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <button
                                  type="button"
                                  onClick={() => handleEdit(recordKey, row)}
                                  className="inline-flex items-center justify-center size-5.5 rounded hover:bg-primary/15 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                >
                                  <Edit3 className="size-3" />
                                </button>
                              }
                            />
                            <TooltipContent className="text-xs">Edit</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Compact Footer: Record Counts + Page Selector */}
        <div className="shrink-0 flex items-center justify-between pt-0.5 pb-0 px-0.5 text-xs select-none">
          {/* Left: Record Range Summary */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-muted-foreground text-[11px]">
              Showing <strong className="text-foreground">{sortedRows.length > 0 ? startIndex + 1 : 0}</strong> -{" "}
              <strong className="text-foreground">{endIndex}</strong> of{" "}
              <strong className="text-foreground">{sortedRows.length}</strong> records
            </span>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 pl-2.5 border-l border-border/60">
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
                <SelectTrigger
                  size="sm"
                  className="h-6 w-auto min-w-[46px] text-xs font-mono px-1.5 py-0 gap-1 bg-background text-foreground border-border/80 rounded shadow-none [&_svg]:size-3 [&_svg]:text-muted-foreground"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded min-w-[56px]">
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
          </div>

          {/* Right: Compact Pagination Navigation Controls */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-muted-foreground mr-1 text-[11px]">
              Page {page} of {totalPages}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="size-6 rounded"
            >
              <ChevronsLeft className="size-3" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="size-6 rounded"
            >
              <ChevronLeft className="size-3" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="size-6 rounded"
            >
              <ChevronRight className="size-3" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="size-6 rounded"
            >
              <ChevronsRight className="size-3" />
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

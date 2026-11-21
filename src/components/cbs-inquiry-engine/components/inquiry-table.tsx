"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  type DerivedColumnMeta,
  deriveInquiryColumnMeta,
  INQUIRY_UNPAGED_MAX_ROWS,
  type InquirySort,
  inquiryPageSize,
  nextInquirySort,
  sortInquiryRows,
} from "@/lib/cbs-inquiry-spec";
import { cn } from "@/lib/core-utils";
import type { INQCmd, INQDef, INQInfo, InquiryRow } from "@/lib/data-schemas";
import { useSessionStore } from "@/store";
import { InquiryPagination } from "./table/inquiry-pagination";
import { InquiryTableBody } from "./table/inquiry-table-body";
import { InquiryTableHeader } from "./table/inquiry-table-header";

/** Column lines of a (possibly multi-line) record: line numbers in order, each line's columns. */
export interface InquiryTableLayout {
  readonly columns: readonly DerivedColumnMeta[];
  readonly lines: ReadonlyArray<{ readonly line: number; readonly columns: DerivedColumnMeta[] }>;
  readonly isMultiRow: boolean;
  readonly maxColumns: number;
}

function buildLayout(defs: readonly INQDef[]): InquiryTableLayout {
  const columns = defs
    .map(deriveInquiryColumnMeta)
    .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.order - b.order));
  const byLine = new Map<number, DerivedColumnMeta[]>();
  for (const col of columns) byLine.set(col.row, [...(byLine.get(col.row) ?? []), col]);
  const lines = [...byLine.entries()]
    .sort(([a], [b]) => a - b)
    .map(([line, cols]) => ({ line, columns: cols }));
  return {
    columns,
    lines,
    isMultiRow: lines.length > 1,
    maxColumns: Math.max(1, ...lines.map((l) => l.columns.length)),
  };
}

export type InquiryTableInfo = Pick<
  INQInfo,
  "showSerial" | "showPagination" | "perpageItem" | "cmdFromInternal" | "cmdFieldName"
>;

export interface InquiryTableProps {
  columns: readonly INQDef[];
  rows: readonly InquiryRow[];
  commands: readonly INQCmd[];
  info: InquiryTableInfo;
  /** 1-based page, owned by the screen (persisted with the tab). */
  page: number;
  onPageChange: (page: number) => void;
  sort: InquirySort | null;
  onSortChange: (sort: InquirySort | null) => void;
  className?: string;
}

/**
 * The result grid of an inquiry: columns, alignment and multi-line records from `INQDef`, row
 * actions from `INQCmds`, client-side sorting, and paging by `perpageItem`. Paging is on when the
 * inquiry asks for it, and always above `INQUIRY_UNPAGED_MAX_ROWS` rows.
 */
export const InquiryTable = React.memo(function InquiryTable({
  columns,
  rows,
  commands,
  info,
  page,
  onPageChange,
  sort,
  onSortChange,
  className,
}: InquiryTableProps) {
  const user = useSessionStore((s) => s.user);
  const layout = React.useMemo(() => buildLayout(columns), [columns]);
  const sortedRows = React.useMemo(
    () => sortInquiryRows(rows, sort, layout.columns),
    [rows, sort, layout.columns],
  );

  const pageSize = inquiryPageSize(info);
  const paged = info.showPagination || rows.length > INQUIRY_UNPAGED_MAX_ROWS;
  const totalPages = paged ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const offset = paged ? (currentPage - 1) * pageSize : 0;
  const pageRows = React.useMemo(
    () => (paged ? sortedRows.slice(offset, offset + pageSize) : sortedRows),
    [paged, sortedRows, offset, pageSize],
  );

  const handleSort = React.useCallback(
    (column: string) => {
      onSortChange(nextInquirySort(sort, column));
      onPageChange(1);
    },
    [sort, onSortChange, onPageChange],
  );

  const showActions = commands.length > 0 || Boolean(info.cmdFromInternal && info.cmdFieldName);

  return (
    <TooltipProvider delay={150}>
      <div className={cn("flex-1 flex flex-col min-h-0 overflow-hidden pr-1 gap-1", className)}>
        <div className="flex-1 min-h-0 overflow-auto rounded border border-border/80 bg-card/60 shadow-2xs flex flex-col">
          {rows.length === 0 ? (
            <div className="flex-1 min-h-30 flex items-center justify-center p-3 bg-muted/10">
              <p className="text-2xs text-muted-foreground font-mono">No matching records found.</p>
            </div>
          ) : (
            <table className="w-full caption-bottom text-2xs">
              <InquiryTableHeader
                layout={layout}
                showSerial={info.showSerial}
                showActions={showActions}
                sort={sort}
                onSort={handleSort}
              />
              <InquiryTableBody
                rows={pageRows}
                offset={offset}
                layout={layout}
                commands={commands}
                showSerial={info.showSerial}
                showActions={showActions}
                cmdFromInternal={info.cmdFromInternal}
                cmdFieldName={info.cmdFieldName}
                user={user}
              />
            </table>
          )}
        </div>

        {paged && rows.length > 0 && (
          <InquiryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalCount={rows.length}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </TooltipProvider>
  );
});

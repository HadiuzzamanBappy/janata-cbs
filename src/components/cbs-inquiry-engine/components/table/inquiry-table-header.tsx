import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DerivedColumnMeta, InquirySort } from "@/lib/cbs-inquiry-spec";
import { cn } from "@/lib/core-utils";
import type { InquiryTableLayout } from "../inquiry-table";

export const ALIGN_CLASS = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

interface ColumnHeaderProps {
  col: DerivedColumnMeta;
  sort: InquirySort | null;
  onSort: (columnId: string) => void;
}

function ColumnHeader({ col, sort, onSort }: ColumnHeaderProps) {
  const direction = sort?.column === col.id ? sort.direction : null;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => onSort(col.id)}
      className={cn(
        "h-5 px-1 -ml-1 text-2xs font-semibold uppercase tracking-tight text-muted-foreground hover:text-foreground hover:bg-muted/80 flex items-center gap-1",
        col.align === "right" && "ml-auto",
        col.align === "center" && "mx-auto",
      )}
    >
      <span>{col.label}</span>
      {direction === "asc" ? (
        <ArrowUp className="size-2.5 text-primary" />
      ) : direction === "desc" ? (
        <ArrowDown className="size-2.5 text-primary" />
      ) : (
        <ArrowUpDown className="size-2.5 opacity-40 hover:opacity-100" />
      )}
    </Button>
  );
}

export interface InquiryTableHeaderProps {
  layout: InquiryTableLayout;
  showSerial: boolean;
  showActions: boolean;
  sort: InquirySort | null;
  onSort: (columnId: string) => void;
}

const HEAD_CELL = "text-2xs font-semibold text-foreground/80 py-1 px-2 h-6.5 whitespace-nowrap";
const SIDE_CELL =
  "w-8 text-center text-3xs font-semibold text-muted-foreground py-0.5 px-1 whitespace-nowrap";
const ACTIONS_CELL =
  "w-14 px-1 py-0.5 text-center text-3xs font-semibold text-muted-foreground sticky right-0 bg-muted/95 backdrop-blur-xs border-l border-border/40 z-20 whitespace-nowrap";

export function InquiryTableHeader({
  layout,
  showSerial,
  showActions,
  sort,
  onSort,
}: InquiryTableHeaderProps) {
  const lineCount = layout.lines.length;
  return (
    <thead className="bg-muted/50 sticky top-0 z-10 border-b border-border/70 [&_tr]:border-b">
      {layout.lines.map(({ line, columns }, lineIdx) => {
        const isFirst = lineIdx === 0;
        return (
          <tr key={line} className="hover:bg-transparent border-b border-border/60">
            {isFirst && showSerial && (
              <th
                rowSpan={lineCount}
                className={cn(
                  SIDE_CELL,
                  layout.isMultiRow && "align-middle border-r border-border/30",
                )}
              >
                #
              </th>
            )}
            {columns.map((col, colIdx) => {
              const isLast = colIdx === columns.length - 1;
              const colSpan =
                isLast && columns.length < layout.maxColumns
                  ? layout.maxColumns - columns.length + 1
                  : undefined;
              return (
                <th
                  key={col.id}
                  colSpan={colSpan}
                  style={{ width: colSpan ? undefined : col.width }}
                  className={cn(HEAD_CELL, ALIGN_CLASS[col.align])}
                >
                  {layout.isMultiRow ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-3xs font-mono font-bold text-primary bg-primary/10 px-1 py-0.5 rounded">
                        L{line}.{col.order}
                      </span>
                      <ColumnHeader col={col} sort={sort} onSort={onSort} />
                    </div>
                  ) : (
                    <ColumnHeader col={col} sort={sort} onSort={onSort} />
                  )}
                </th>
              );
            })}
            {isFirst && showActions && (
              <th
                rowSpan={lineCount}
                className={cn(ACTIONS_CELL, layout.isMultiRow && "align-middle")}
              >
                Actions
              </th>
            )}
          </tr>
        );
      })}
    </thead>
  );
}

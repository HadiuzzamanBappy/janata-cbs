import type { DerivedColumnMeta } from "@/lib/cbs-inquiry-spec";
import { ColumnHeader } from "./column-header";

export interface InquiryTableHeaderProps {
  isMultiRow: boolean;
  sortedRowNumbers: number[];
  rowsMap: Map<number, DerivedColumnMeta[]>;
  maxColsInAnyRow: number;
  columnMetas: DerivedColumnMeta[];
  showSerial: boolean;
  showActionsColumn: boolean;
  sortColumn?: string | null;
  sortDirection?: "asc" | "desc" | null;
  onSort: (columnId: string) => void;
}

export function InquiryTableHeader({
  isMultiRow,
  sortedRowNumbers,
  rowsMap,
  maxColsInAnyRow,
  columnMetas,
  showSerial,
  showActionsColumn,
  sortColumn,
  sortDirection,
  onSort,
}: InquiryTableHeaderProps) {
  return (
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
                sortDirection={sortColumn === col.id ? sortDirection : null}
                onSort={onSort}
              />
            </th>
          ))}

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
                        sortDirection={sortColumn === col.id ? sortDirection : null}
                        onSort={onSort}
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
  );
}

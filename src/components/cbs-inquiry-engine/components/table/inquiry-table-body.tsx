import * as React from "react";
import { type DerivedColumnMeta, executePrimaryInquiryCommand } from "@/lib/cbs-inquiry-spec";
import { cn } from "@/lib/core-utils";
import type { INQCmd, InquiryRow } from "@/lib/data-schemas";
import { InquiryRowActions } from "../inquiry-row-actions";
import { CellFormatter } from "./cell-formatter";

export interface InquiryTableBodyProps {
  rows: InquiryRow[];
  isMultiRow: boolean;
  sortedRowNumbers: number[];
  rowsMap: Map<number, DerivedColumnMeta[]>;
  maxColsInAnyRow: number;
  columnMetas: DerivedColumnMeta[];
  commands: INQCmd[];
  showSerial: boolean;
  showActionsColumn: boolean;
  currentPage: number;
  pageSize: number;
  showPagination: boolean;
  cmdFromInternal?: boolean;
  cmdFieldName?: string;
}

export function InquiryTableBody({
  rows,
  isMultiRow,
  sortedRowNumbers,
  rowsMap,
  maxColsInAnyRow,
  columnMetas,
  commands,
  showSerial,
  showActionsColumn,
  currentPage,
  pageSize,
  showPagination,
  cmdFromInternal = false,
  cmdFieldName = "",
}: InquiryTableBodyProps) {
  return (
    <tbody className="[&_tr:last-child]:border-0">
      {rows.map((row, rowIdx) => {
        const serialNum = showPagination ? (currentPage - 1) * pageSize + rowIdx + 1 : rowIdx + 1;
        const rowKey =
          typeof row.id === "string" && row.id.length > 0
            ? row.id
            : typeof row.recordId === "string" && row.recordId.length > 0
              ? row.recordId
              : `inq-row-${serialNum}`;
        const isStriped = rowIdx % 2 === 1;

        const handleRowDoubleClick = () => {
          executePrimaryInquiryCommand(commands, row, cmdFromInternal, cmdFieldName);
        };

        if (!isMultiRow) {
          return (
            <tr
              key={rowKey}
              onDoubleClick={handleRowDoubleClick}
              className={`h-6.5 hover:bg-primary/10 transition-colors border-b border-border/25 font-mono text-[11px] ${
                isStriped ? "bg-muted/30" : "bg-transparent"
              }`}
            >
              {showSerial && (
                <td className="w-8 text-center font-mono text-[10px] text-muted-foreground/60 py-0.5 px-1 whitespace-nowrap">
                  {serialNum}
                </td>
              )}
              {columnMetas.map((col) => {
                const isPassable = col.canPass;
                return (
                  <td
                    key={col.id}
                    onClick={
                      isPassable
                        ? (e) => {
                            e.stopPropagation();
                            executePrimaryInquiryCommand(
                              commands,
                              row,
                              cmdFromInternal,
                              cmdFieldName,
                            );
                          }
                        : undefined
                    }
                    onKeyDown={
                      isPassable
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              executePrimaryInquiryCommand(
                                commands,
                                row,
                                cmdFromInternal,
                                cmdFieldName,
                              );
                            }
                          }
                        : undefined
                    }
                    tabIndex={isPassable ? 0 : undefined}
                    role={isPassable ? "button" : undefined}
                    title={isPassable ? `Click to open / drill down (${col.label})` : undefined}
                    className={cn(
                      "py-0.5 px-2 text-[11px] font-mono whitespace-nowrap leading-tight",
                      col.align === "right"
                        ? "text-right"
                        : col.align === "center"
                          ? "text-center"
                          : "text-left",
                      isPassable &&
                        "cursor-pointer text-primary hover:underline hover:text-primary/80 font-medium",
                    )}
                  >
                    <CellFormatter
                      value={row[col.id]}
                      format={col.format}
                      isMono={col.isMono}
                      routine={col.routine}
                    />
                  </td>
                );
              })}

              {showActionsColumn && (
                <td
                  className={`w-14 px-1 py-0.5 text-center sticky right-0 backdrop-blur-xs border-l border-border/25 whitespace-nowrap ${
                    isStriped ? "bg-muted/95" : "bg-card/95"
                  }`}
                >
                  <InquiryRowActions
                    commands={commands}
                    row={row}
                    cmdFromInternal={cmdFromInternal}
                    cmdFieldName={cmdFieldName}
                  />
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
                  onDoubleClick={handleRowDoubleClick}
                  className={cn(
                    "h-6.5 hover:bg-primary/10 transition-colors font-mono text-[11px]",
                    isStriped ? "bg-muted/25" : "bg-transparent",
                    isLast
                      ? "border-b border-border/70 shadow-2xs"
                      : "border-b border-dashed border-border/25",
                  )}
                >
                  {isFirst && showSerial && (
                    <td
                      rowSpan={sortedRowNumbers.length}
                      className="w-8 text-center font-mono text-[10px] text-muted-foreground/60 py-0.5 px-1 whitespace-nowrap align-middle border-r border-border/25 font-semibold"
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
                    const isPassable = col.canPass;

                    return (
                      <td
                        key={col.id}
                        colSpan={colSpan}
                        onClick={
                          isPassable
                            ? (e) => {
                                e.stopPropagation();
                                executePrimaryInquiryCommand(
                                  commands,
                                  row,
                                  cmdFromInternal,
                                  cmdFieldName,
                                );
                              }
                            : undefined
                        }
                        onKeyDown={
                          isPassable
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  executePrimaryInquiryCommand(
                                    commands,
                                    row,
                                    cmdFromInternal,
                                    cmdFieldName,
                                  );
                                }
                              }
                            : undefined
                        }
                        tabIndex={isPassable ? 0 : undefined}
                        role={isPassable ? "button" : undefined}
                        title={isPassable ? `Click to open (${col.label})` : undefined}
                        className={cn(
                          "py-0.5 px-2 text-[11px] font-mono whitespace-nowrap leading-tight",
                          !isFirst && "text-muted-foreground/85 bg-muted/10",
                          col.align === "right"
                            ? "text-right"
                            : col.align === "center"
                              ? "text-center"
                              : "text-left",
                          isPassable &&
                            "cursor-pointer text-primary hover:underline hover:text-primary/80 font-medium",
                        )}
                      >
                        {!isFirst && (
                          <span className="text-[9px] font-sans font-medium text-muted-foreground/60 mr-1 not-italic">
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
                        "w-14 px-1 py-0.5 text-center sticky right-0 backdrop-blur-xs border-l border-border/25 whitespace-nowrap align-middle",
                        isStriped ? "bg-muted/95" : "bg-card/95",
                      )}
                    >
                      <InquiryRowActions
                        commands={commands}
                        row={row}
                        cmdFromInternal={cmdFromInternal}
                        cmdFieldName={cmdFieldName}
                      />
                    </td>
                  )}
                </tr>
              );
            })}
          </React.Fragment>
        );
      })}
    </tbody>
  );
}

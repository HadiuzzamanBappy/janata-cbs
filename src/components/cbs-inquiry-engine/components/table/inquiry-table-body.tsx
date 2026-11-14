import * as React from "react";
import { type DerivedColumnMeta, executePrimaryInquiryCommand } from "@/lib/cbs-inquiry-spec";
import { cn } from "@/lib/core-utils";
import type { EnquiryRow, INQCmd } from "@/lib/data-schemas";
import { InquiryRowActions } from "../inquiry-row-actions";
import { CellFormatter } from "./cell-formatter";

export interface InquiryTableBodyProps {
  rows: EnquiryRow[];
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
              className={`hover:bg-primary/10 transition-colors border-b border-border/30 font-mono text-xs ${
                isStriped ? "bg-muted/40" : "bg-transparent"
              }`}
            >
              {showSerial && (
                <td className="w-12 text-center font-mono text-[11px] text-muted-foreground py-1.5 px-2 whitespace-nowrap">
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
                      "py-1.5 px-2.5 text-xs whitespace-nowrap",
                      col.isMono ? "font-mono" : "",
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
                  className={`w-20 px-1.5 py-1 text-center sticky right-0 backdrop-blur-xs border-l border-border/30 whitespace-nowrap ${
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
                          "py-1.5 px-2.5 text-xs whitespace-nowrap",
                          col.isMono ? "font-mono" : "",
                          !isFirst && "text-muted-foreground/90 bg-muted/15",
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

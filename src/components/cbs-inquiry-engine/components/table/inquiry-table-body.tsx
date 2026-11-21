import * as React from "react";
import { cbsCommand } from "@/lib/cbs-command";
import {
  type DerivedColumnMeta,
  primaryRowCommand,
  resolveRowActions,
} from "@/lib/cbs-inquiry-spec";
import { cn } from "@/lib/core-utils";
import type { INQCmd, InquiryRow } from "@/lib/data-schemas";
import type { CbsUserSecurityContext } from "@/types";
import { InquiryRowActions } from "../inquiry-row-actions";
import type { InquiryTableLayout } from "../inquiry-table";
import { CellFormatter } from "./cell-formatter";
import { ALIGN_CLASS } from "./inquiry-table-header";

interface InquiryCellProps {
  col: DerivedColumnMeta;
  row: InquiryRow;
  primaryCommand: string;
  colSpan?: number;
  /** Second and later lines of a multi-line record show the column label inline. */
  showLabel: boolean;
}

function InquiryCell({ col, row, primaryCommand, colSpan, showLabel }: InquiryCellProps) {
  const passable = col.canPass && Boolean(primaryCommand);
  const open = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    cbsCommand.execute(primaryCommand);
  };
  return (
    <td
      colSpan={colSpan}
      onClick={passable ? open : undefined}
      onKeyDown={
        passable
          ? (e) => {
              if (e.key !== "Enter" && e.key !== " ") return;
              e.preventDefault();
              open(e);
            }
          : undefined
      }
      tabIndex={passable ? 0 : undefined}
      role={passable ? "button" : undefined}
      title={passable ? `Open ${primaryCommand}` : undefined}
      className={cn(
        "py-0.5 px-2 text-2xs whitespace-nowrap leading-tight",
        ALIGN_CLASS[col.align],
        showLabel && "text-muted-foreground/85 bg-muted/10",
        passable && "cursor-pointer text-primary hover:underline hover:text-primary/80 font-medium",
      )}
    >
      {showLabel && (
        <span className="text-3xs font-medium text-muted-foreground/60 mr-1">{col.label}:</span>
      )}
      <CellFormatter
        value={row[col.id]}
        format={col.format}
        isMono={col.isMono}
        routine={col.routine}
      />
    </td>
  );
}

interface InquiryRecordProps {
  row: InquiryRow;
  serial: number;
  striped: boolean;
  layout: InquiryTableLayout;
  commands: readonly INQCmd[];
  showSerial: boolean;
  showActions: boolean;
  cmdFromInternal: boolean;
  cmdFieldName: string;
  user: CbsUserSecurityContext | null;
}

/** One record: a table row, or one row per line for a multi-line layout. Re-renders only when its props change. */
const InquiryRecord = React.memo(function InquiryRecord({
  row,
  serial,
  striped,
  layout,
  commands,
  showSerial,
  showActions,
  cmdFromInternal,
  cmdFieldName,
  user,
}: InquiryRecordProps) {
  const primaryCommand = primaryRowCommand(commands, row, cmdFromInternal, cmdFieldName);
  const actions = showActions
    ? resolveRowActions(commands, row, cmdFromInternal, cmdFieldName)
    : [];
  const onDoubleClick = primaryCommand ? () => cbsCommand.execute(primaryCommand) : undefined;
  const lineCount = layout.lines.length;
  const multi = layout.isMultiRow;

  return layout.lines.map(({ line, columns }, lineIdx) => {
    const isFirst = lineIdx === 0;
    return (
      <tr
        key={line}
        onDoubleClick={onDoubleClick}
        className={cn(
          "h-6.5 hover:bg-primary/10 transition-colors",
          striped ? "bg-muted/30" : "bg-transparent",
          !multi && "border-b border-border/25",
          multi && lineIdx === lineCount - 1 && "border-b border-border/70 shadow-2xs",
          multi && lineIdx < lineCount - 1 && "border-b border-dashed border-border/25",
        )}
      >
        {isFirst && showSerial && (
          <td
            rowSpan={lineCount}
            className={cn(
              "w-8 text-center font-mono text-3xs text-muted-foreground/60 py-0.5 px-1 whitespace-nowrap",
              multi && "align-middle border-r border-border/25 font-semibold",
            )}
          >
            {serial}
          </td>
        )}
        {columns.map((col, colIdx) => {
          const isLast = colIdx === columns.length - 1;
          return (
            <InquiryCell
              key={col.id}
              col={col}
              row={row}
              primaryCommand={primaryCommand}
              showLabel={!isFirst}
              colSpan={
                isLast && columns.length < layout.maxColumns
                  ? layout.maxColumns - columns.length + 1
                  : undefined
              }
            />
          );
        })}
        {isFirst && showActions && (
          <td
            rowSpan={lineCount}
            className={cn(
              "w-14 px-1 py-0.5 text-center sticky right-0 backdrop-blur-xs border-l border-border/25 whitespace-nowrap",
              multi && "align-middle",
              striped ? "bg-muted/95" : "bg-card/95",
            )}
          >
            <InquiryRowActions actions={actions} row={row} user={user} />
          </td>
        )}
      </tr>
    );
  });
});

export interface InquiryTableBodyProps {
  rows: readonly InquiryRow[];
  /** Index of the first row in the whole result, for serial numbers. */
  offset: number;
  layout: InquiryTableLayout;
  commands: readonly INQCmd[];
  showSerial: boolean;
  showActions: boolean;
  cmdFromInternal: boolean;
  cmdFieldName: string;
  user: CbsUserSecurityContext | null;
}

export function InquiryTableBody({ rows, offset, ...shared }: InquiryTableBodyProps) {
  return (
    <tbody className="[&_tr:last-child]:border-0">
      {rows.map((row, idx) => (
        // A row's position is its identity: the core may send rows without a key, or repeat one
        <React.Fragment key={`${offset + idx}:${row.recordId}`}>
          <InquiryRecord row={row} serial={offset + idx + 1} striped={idx % 2 === 1} {...shared} />
        </React.Fragment>
      ))}
    </tbody>
  );
}

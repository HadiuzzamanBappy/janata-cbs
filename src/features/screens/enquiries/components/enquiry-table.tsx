"use client";

import { ArrowUpDown, ExternalLink } from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkbenchStore } from "@/store";
import type { EnquiryColumn, EnquiryRow } from "../types";

interface EnquiryTableProps {
  columns: EnquiryColumn[];
  rows: EnquiryRow[];
}

export function EnquiryTable({ columns, rows }: EnquiryTableProps) {
  const [sortCol, setSortCol] = React.useState<string | null>(null);
  const [sortAsc, setSortAsc] = React.useState(true);
  const { addTab } = useWorkbenchStore();

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

  if (rows.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/10 rounded-lg m-4 border border-dashed border-border/50">
        <p className="text-xs text-muted-foreground font-mono">No matching records found.</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Adjust your selection criteria and click <strong>Find / Execute</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="border border-border/60 rounded-lg overflow-hidden bg-card shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40 sticky top-0 z-10">
            <TableRow className="hover:bg-transparent">
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
            {sortedRows.map((row, index) => (
              <TableRow
                key={row.id || index}
                className="hover:bg-muted/30 transition-colors border-b border-border/40"
              >
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
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Row Counter Footer */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono px-1 py-2">
        <span>Showing {sortedRows.length} record(s)</span>
        <span>Temenos Transact Enquiry Engine</span>
      </div>
    </div>
  );
}
